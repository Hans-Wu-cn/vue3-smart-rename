# 全局替换问题修复

## 问题描述
用户反馈：使用打包后的插件进行全局替换时，只有当前文件被替换，其他文件没有被更新。用户提到可能的问题是文件夹问题：`common.vue` 在 `src/component/select` 文件夹中，调用放在 `src/view/biz` 中。

## 已修复的问题

### 1. ✅ 文件路径分隔符处理
**问题**: 只处理了 Windows 的 `\`，没有处理 Unix 的 `/`

**修复位置**: `src/commands/smartRename.ts:52`
```typescript
// 修复前
const fileName = document.fileName.split('\\').pop() || '';

// 修复后 - 支持 Windows 和 Unix 路径
const fileName = document.fileName.split(/[/\\]/).pop() || '';
const componentName = fileName.replace(/\.(vue|jsx|tsx|js|ts)$/, '');
```

### 2. ✅ 文件搜索路径格式
**问题**: 使用绝对路径字符串可能导致跨平台兼容性问题

**修复位置**: `src/utils/symbolAnalyzer.ts:215, 448`
```typescript
// 修复前
const files = await vscode.workspace.findFiles(
  `${workspaceFolder.uri.fsPath}/**/*.{vue,js,ts,jsx,tsx}`,
  `{node_modules,dist,build}`
);

// 修复后 - 使用 RelativePattern 提高兼容性
const files = await vscode.workspace.findFiles(
  new vscode.RelativePattern(workspaceFolder, '**/*.{vue,js,ts,jsx,tsx}'),
  new vscode.RelativePattern(workspaceFolder, '**/{node_modules,dist,build}/**')
);
```

### 3. ✅ 组件名称正则表达式转义
**问题**: kebab-case 组件名称（如 `common-select`）中的连字符没有被转义，导致正则表达式匹配失败

**修复位置**: `src/utils/symbolAnalyzer.ts:228`
```typescript
// 添加特殊字符转义（包括连字符）
const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
```

### 4. ✅ 改进组件标签匹配模式
**问题**: 组件标签匹配模式不够精确

**修复位置**: `src/utils/symbolAnalyzer.ts:232-234`
```typescript
// 修复后 - 更精确的匹配模式
new RegExp(`<${escapedVariant}(?:\\s|>|/)`, 'gi'),  // 支持 <Component 或 <Component> 或 <Component/
```

### 5. ✅ 添加调试日志
**添加位置**: `src/commands/smartRename.ts:105-107, 140, 154`
- 记录检测到的跨文件引用数量
- 记录需要更新的文件列表
- 记录全局更新时的引用数量

## 可能仍存在的问题

### 1. 组件名称匹配问题
如果文件是 `common.vue`，但使用时是：
- `<Common>` - PascalCase
- `<common>` - 全小写
- `<common-select>` - kebab-case（如果包含路径信息）

**检查方法**: 查看控制台日志，确认组件使用时的实际名称

### 2. 组件名称提取逻辑
当前从文件名提取组件名称，但如果组件在模板中使用时的名称与文件名不同，可能无法匹配。

**建议**: 
- 如果问题仍然存在，可以尝试在组件文件中查找组件注册信息
- 或者直接从导入语句中提取组件名称

## 测试步骤

1. **重新打包插件**:
   ```bash
   npm run compile
   npx @vscode/vsce package
   ```

2. **重新安装插件**:
   - 卸载旧版本
   - 安装新打包的 `.vsix` 文件

3. **测试场景**:
   - 打开 `src/component/select/common.vue`
   - 将光标放在 props 定义上（如 `a1`）
   - 按 `Ctrl+Shift+R` 触发重命名
   - 输入新名称（如 `a2`）
   - 选择"全局更新"

4. **检查结果**:
   - 查看控制台输出（VSCode 的"输出"面板，选择插件输出）
   - 验证 `src/view/biz` 中的文件是否被更新
   - 检查提示信息中的引用数量

## 调试信息

如果问题仍然存在，请查看 VSCode 控制台输出：
1. 打开 VSCode
2. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac)
3. 输入 "Output: Focus on Output View"
4. 在输出面板的下拉菜单中选择插件输出
5. 查看调试日志，包括：
   - 检测到的跨文件引用数量
   - 其他文件列表
   - 总引用数
   - 准备全局更新时的引用数量

## 后续优化建议

1. **增强组件名称匹配**:
   - 从导入语句中提取组件名称
   - 支持组件别名
   - 支持动态导入

2. **改进文件搜索**:
   - 添加搜索进度提示
   - 支持自定义排除模式

3. **更好的错误处理**:
   - 记录搜索失败的文件
   - 提供更详细的错误信息

