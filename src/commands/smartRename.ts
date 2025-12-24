import * as vscode from 'vscode';
import { isSymbolExported, getReferencesInCurrentFile, getReferencesInOtherFiles, analyzePropsTransmission, findAllTextReferences, findAllReferencesInCurrentFile } from '../utils/symbolAnalyzer';

export async function smartRename() {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('请在编辑器中选择要重命名的变量或函数');
      return;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const symbolRange = document.getWordRangeAtPosition(position);
    if (!symbolRange) {
      vscode.window.showErrorMessage('未找到可重命名的符号');
      return;
    }

    const oldName = document.getText(symbolRange);
    const newName = await vscode.window.showInputBox({
      prompt: `请输入新的名称 (当前: ${oldName})`,
      value: oldName
    });

    if (!newName || newName === oldName) {
      return;
    }

    // 1. 获取所有引用（使用 VSCode 内置引用提供器，速度相对可接受）
    let references = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeReferenceProvider',
      document.uri,
      position
    ) || [];
    
    // 2. 添加符号本身的定义位置
    const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
      'vscode.executeDefinitionProvider',
      document.uri,
      position
    ) || [];
    
    // 合并定义位置到引用列表
    references = [...references, ...definitions];

    // 2. 获取当前工作区（仅记录，真正的全局扫描会在用户选择“全局更新”之后再执行）
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    // 3. 过滤掉无效的引用
    let validReferences = references.filter(ref => ref && ref.uri && ref.range);
    
    // 4. 分类引用
    let currentFileReferences = getReferencesInCurrentFile(validReferences, document.uri);
    let otherFileReferences = getReferencesInOtherFiles(validReferences, document.uri);
    
    // 如果当前文件引用较少，尝试使用专门的单文件查找函数补充
    if (currentFileReferences.length === 0 || currentFileReferences.length < 2) {
      const currentFileRefs = await findAllReferencesInCurrentFile(document, oldName);
      if (currentFileRefs.length > currentFileReferences.length) {
        currentFileReferences = currentFileRefs;
        // 更新validReferences以包含新找到的引用
        validReferences = [...currentFileReferences, ...otherFileReferences];
      }
    }
    
    // 4. 检查符号是否被导出或有跨文件引用
    const isExported = await isSymbolExported(document, position);
    
    // 5. 智能选择更新范围
    let updateAllFiles = false;
    
    // 检查是否有跨文件引用或符号被导出
    if (isExported || otherFileReferences.length > 0) {
      // 符号被外部使用或有跨文件引用，执行全局更新
      updateAllFiles = true;
      console.log(`[调试] 检测到跨文件引用: 导出=${isExported}, 当前文件=${currentFileReferences.length}, 其他文件=${otherFileReferences.length}`);
      console.log(`[调试] 其他文件列表:`, otherFileReferences.map(ref => ref?.uri?.fsPath || 'unknown').filter(path => path !== 'unknown'));
      console.log(`[调试] 总引用数: ${validReferences.length}`);
      vscode.window.showInformationMessage(`检测到跨文件引用，将执行全局更新。当前文件引用: ${currentFileReferences.length}, 跨文件引用: ${otherFileReferences.length}`);

      // 只有在确定需要全局更新时，才执行昂贵的全局扫描（props 透传 + 文本搜索）
      if (workspaceFolder) {
        // 从文件名提取组件名称（支持 Windows 和 Unix 路径分隔符）
        const fileName = document.fileName.split(/[/\\]/).pop() || '';
        const componentName = fileName.replace(/\.(vue|jsx|tsx|js|ts)$/, '');

        if (componentName) {
          const transmissionReferences = await analyzePropsTransmission(componentName, oldName, workspaceFolder);

          // 合并透传引用到总引用列表
          references = [...references, ...transmissionReferences];

          if (transmissionReferences.length > 0) {
            vscode.window.showInformationMessage(`检测到props透传引用: ${transmissionReferences.length}个`);
          }
        }

        // 使用文本搜索补充引用，确保全局模式下尽可能完整
        const textReferences = await findAllTextReferences(oldName, workspaceFolder);
        const existingKeys = new Set(references
          .filter(ref => ref && ref.uri && ref.range)
          .map(ref => `${ref.uri.fsPath}:${ref.range.start.line}:${ref.range.start.character}`));
        const newTextReferences = textReferences.filter(ref => {
          if (!ref || !ref.uri || !ref.range) return false;
          const key = `${ref.uri.fsPath}:${ref.range.start.line}:${ref.range.start.character}`;
          return !existingKeys.has(key);
        });

        references = [...references, ...newTextReferences];

        // 重新过滤与分类
        validReferences = references.filter(ref => ref && ref.uri && ref.range);
        currentFileReferences = getReferencesInCurrentFile(validReferences, document.uri);
        otherFileReferences = getReferencesInOtherFiles(validReferences, document.uri);

        if (newTextReferences.length > 0) {
          vscode.window.showInformationMessage(`使用文本搜索补充引用，新增: ${newTextReferences.length}个引用`);
          console.log(`[调试] 全局自动模式: 总引用 ${validReferences.length} 个，当前文件 ${currentFileReferences.length} 个，其他文件 ${otherFileReferences.length} 个`);
        }
      }
    } else {
      // 没有检测到跨文件引用，但让用户确认是否需要全局更新
      const choice = await vscode.window.showQuickPick(
        [
          { label: '仅更新当前文件', description: `当前文件引用: ${currentFileReferences.length}个` },
          { label: '全局更新', description: '搜索并更新所有文件中的引用' }
        ],
        {
          placeHolder: '未检测到明确的跨文件引用，选择更新范围',
          ignoreFocusOut: true
        }
      );
      
      if (!choice) {
        // 用户取消了操作
        vscode.window.showInformationMessage('已取消重命名操作');
        return;
      }
      
      updateAllFiles = choice.label === '全局更新';
      
      if (updateAllFiles) {
        vscode.window.showInformationMessage('将执行全局更新');
        // 用户主动选择“全局更新”后，再执行全局扫描（props 透传 + 文本搜索）
        if (workspaceFolder) {
          // 从文件名提取组件名称（支持 Windows 和 Unix 路径分隔符）
          const fileName = document.fileName.split(/[/\\]/).pop() || '';
          const componentName = fileName.replace(/\.(vue|jsx|tsx|js|ts)$/, '');

          if (componentName) {
            const transmissionReferences = await analyzePropsTransmission(componentName, oldName, workspaceFolder);
            references = [...references, ...transmissionReferences];

            if (transmissionReferences.length > 0) {
              vscode.window.showInformationMessage(`检测到props透传引用: ${transmissionReferences.length}个`);
            }
          }

          const textReferences = await findAllTextReferences(oldName, workspaceFolder);
          references = [...references, ...textReferences];
          // 重新分类引用并更新 validReferences
          validReferences = references.filter(ref => ref && ref.uri && ref.range);
          otherFileReferences = getReferencesInOtherFiles(validReferences, document.uri);
          currentFileReferences = getReferencesInCurrentFile(validReferences, document.uri);
          
          console.log(`[调试] 全局更新: 找到 ${validReferences.length} 个引用，当前文件 ${currentFileReferences.length} 个，其他文件 ${otherFileReferences.length} 个`);
        }
      } else {
        vscode.window.showInformationMessage('将仅更新当前文件');
        // 如果选择仅更新当前文件，使用专门的单文件引用查找函数，确保找到所有引用
        currentFileReferences = await findAllReferencesInCurrentFile(document, oldName);
        references = currentFileReferences;
      }
    }
    
    // 5. 执行重命名
    try {
      if (updateAllFiles) {
        // 全局重命名 - 使用最新的引用列表
        const finalReferences = references.filter(ref => ref && ref.uri && ref.range);
        await renameAllFiles(finalReferences, oldName, newName);
        
        vscode.window.showInformationMessage(`已全局更新所有引用: ${oldName} → ${newName}，共处理 ${finalReferences.length} 个引用`);
      } else {
        // 仅当前文件重命名
        await renameInCurrentFile(editor, currentFileReferences, oldName, newName);
        
        vscode.window.showInformationMessage(`已在当前文件更新所有引用: ${oldName} → ${newName}，共处理 ${currentFileReferences.length} 个引用`);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`重命名过程中发生错误: ${error.message || error}`);
      console.error('重命名错误:', error);
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`输入新名称时发生错误: ${error.message || error}`);
    console.error('输入新名称错误:', error);
    return;
  }
}

/**
 * 执行全局重命名，处理所有文件中的引用
 */
async function renameAllFiles(references: vscode.Location[], oldName: string, newName: string) {
  // 按文件分组引用
  const referencesByFile = new Map<string, vscode.Location[]>();
  
  for (const ref of references) {
    // 检查引用是否有效
    if (!ref || !ref.uri || !ref.range) {
      console.warn('跳过无效引用:', ref);
      continue;
    }
    
    const filePath = ref.uri.fsPath;
    if (!filePath) {
      console.warn('跳过无效文件路径的引用:', ref);
      continue;
    }
    if (!referencesByFile.has(filePath)) {
      referencesByFile.set(filePath, []);
    }
    referencesByFile.get(filePath)?.push(ref);
  }
  
  // 使用WorkspaceEdit进行批量编辑
  const edit = new vscode.WorkspaceEdit();
  let updatedCount = 0;
  
  // 处理每个文件
  for (const [filePath, fileReferences] of referencesByFile) {
    try {
      // 按行号倒序排序，避免替换后影响后续位置
      const sortedReferences = fileReferences.sort((a, b) => b.range.start.line - a.range.start.line);
      
      // 打开文档
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      
      // 添加编辑操作到WorkspaceEdit
      // 使用 Set 来去重，避免同一位置重复替换
      const processedRanges = new Set<string>();
      
      for (const ref of sortedReferences) {
        try {
          // 检查范围是否有效
          if (!ref.range || !ref.range.start || !ref.range.end) {
            console.warn(`[警告] 无效的引用范围:`, ref);
            continue;
          }
          
          // 创建唯一标识符，避免重复处理同一位置
          const rangeKey = `${ref.range.start.line}:${ref.range.start.character}:${ref.range.end.character}`;
          if (processedRanges.has(rangeKey)) {
            console.log(`[调试] 跳过重复的引用: ${rangeKey}`);
            continue;
          }
          processedRanges.add(rangeKey);
          
          // 获取当前范围的文本
          const currentText = document.getText(ref.range);
          
          // 验证当前文本是否匹配旧名称（允许大小写不敏感）
          if (currentText !== oldName && currentText !== oldName.toLowerCase() && currentText !== oldName.toUpperCase()) {
            // 如果文本不匹配，尝试在整个行中查找并替换
            const fullLineText = document.lineAt(ref.range.start.line).text;
            const lineRange = new vscode.Range(
              ref.range.start.line, 0,
              ref.range.start.line, fullLineText.length
            );
            
            // 转义oldName用于正则表达式
            const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // 检查是否在 ref.range 位置找到了 oldName
            const textAtRange = fullLineText.substring(ref.range.start.character, ref.range.end.character);
            if (textAtRange === oldName || textAtRange.toLowerCase() === oldName.toLowerCase()) {
              // 直接替换范围内的文本
              edit.replace(uri, ref.range, newName);
              updatedCount++;
              console.log(`[调试] 替换: "${currentText}" → "${newName}" 在 ${filePath}:${ref.range.start.line + 1}:${ref.range.start.character}`);
            } else {
              // 如果范围文本不匹配，尝试整行替换
              const newLineText = fullLineText.replace(new RegExp(`\\b${escapedOldName}\\b`, 'g'), newName);
              if (newLineText !== fullLineText) {
                edit.replace(uri, lineRange, newLineText);
                updatedCount++;
                console.log(`[调试] 整行替换: "${oldName}" → "${newName}" 在 ${filePath}:${ref.range.start.line + 1}`);
              } else {
                console.warn(`[警告] 未找到匹配的文本 "${oldName}" 在 ${filePath}:${ref.range.start.line + 1}, 范围文本: "${textAtRange}"`);
              }
            }
          } else {
            // 文本匹配，直接替换
            edit.replace(uri, ref.range, newName);
            updatedCount++;
            console.log(`[调试] 直接替换: "${currentText}" → "${newName}" 在 ${filePath}:${ref.range.start.line + 1}:${ref.range.start.character}`);
          }
        } catch (error: any) {
          console.error(`[错误] 处理引用时出错 ${filePath}:${ref.range.start.line + 1}:`, error);
        }
      }
    } catch (error: any) {
      console.error(`处理文件 ${filePath} 时出错:`, error);
      vscode.window.showWarningMessage(`处理文件 ${filePath} 时出错: ${error.message || error}`);
    }
  }
  
  // 应用所有编辑
  await vscode.workspace.applyEdit(edit);
  
  // 保存所有修改过的文件
  for (const [filePath, fileReferences] of referencesByFile) {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      await document.save();
    } catch (error: any) {
      console.error(`保存文件 ${filePath} 时出错:`, error);
      vscode.window.showWarningMessage(`保存文件 ${filePath} 时出错: ${error.message || error}`);
    }
  }
  
  return updatedCount;
}

async function renameInCurrentFile(editor: vscode.TextEditor, references: vscode.Location[], oldName: string, newName: string) {
  // 过滤掉无效的引用，确保每个引用都有有效的uri和range
  const validReferences = references.filter(ref => ref && ref.uri && ref.range);
  
  if (validReferences.length === 0) {
    vscode.window.showInformationMessage(`未找到${oldName}的引用`);
    return;
  }
  
  // 按行号倒序排序，避免替换后影响后续位置
  const sortedReferences = validReferences.sort((a, b) => b.range.start.line - a.range.start.line);
  
  let updatedCount = 0;
  
  await editor.edit(editBuilder => {
    for (const ref of sortedReferences) {
      // 处理不同类型的引用
      const document = editor.document;
      const fullLineText = document.lineAt(ref.range.start.line).text;
      const currentText = document.getText(ref.range);
      
      // 转义oldName用于正则表达式
      const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 检查并处理Vue特定语法
      let newText = currentText;
      let isVueSyntax = false;
      
      // 1. 处理Vue props绑定，如 :propName="value"
      if (fullLineText.includes(`:${oldName}`) || fullLineText.match(new RegExp(`[\\s:]${escapedOldName}\\s*=`))) {
        // 处理 :propName 形式（简写绑定）
        newText = newText.replace(new RegExp(`:${escapedOldName}(?=\\s*=)`, 'g'), `:${newName}`);
        isVueSyntax = true;
      }
      
      // 2. 处理 v-bind:propName="value"
      if (fullLineText.includes(`v-bind:${oldName}`)) {
        newText = newText.replace(new RegExp(`v-bind:${escapedOldName}(?=\\s*=)`, 'g'), `v-bind:${newName}`);
        isVueSyntax = true;
      }
      
      // 3. 处理 v-model:propName="value"
      if (fullLineText.includes(`v-model:${oldName}`)) {
        newText = newText.replace(new RegExp(`v-model:${escapedOldName}(?=\\s*=)`, 'g'), `v-model:${newName}`);
        isVueSyntax = true;
      }
      
      // 4. 处理 v-slot:slotName 或 #slotName
      if (fullLineText.includes(`v-slot:${oldName}`) || fullLineText.includes(`#${oldName}`)) {
        newText = newText.replace(new RegExp(`v-slot:${escapedOldName}(?=\\s*|=)`, 'g'), `v-slot:${newName}`);
        newText = newText.replace(new RegExp(`#${escapedOldName}(?=\\s*|=)`, 'g'), `#${newName}`);
        isVueSyntax = true;
      }
      
      // 5. 处理模板插值，如 {{ propName }} 或 {{ propName.attr }}
      if (fullLineText.includes('{{') && fullLineText.includes('}}')) {
        newText = newText.replace(new RegExp(`\\b${escapedOldName}\\b`, 'g'), newName);
        isVueSyntax = true;
      }
      
      // 6. 处理事件绑定，如 @eventName="handler" 或 v-on:eventName="handler"
      if (fullLineText.includes(`@${oldName}`) || fullLineText.includes(`v-on:${oldName}`)) {
        newText = newText.replace(new RegExp(`@${escapedOldName}(?=\\s*=)`, 'g'), `@${newName}`);
        newText = newText.replace(new RegExp(`v-on:${escapedOldName}(?=\\s*=)`, 'g'), `v-on:${newName}`);
        isVueSyntax = true;
      }
      
      // 7. 如果不是Vue特定语法，使用普通替换
      if (!isVueSyntax) {
        // 普通文本替换，确保替换整个单词
        newText = newText.replace(new RegExp(`\\b${escapedOldName}\\b`, 'g'), newName);
      }
      
      editBuilder.replace(ref.range, newText);
      updatedCount++;
    }
  });
  
  return updatedCount;
}