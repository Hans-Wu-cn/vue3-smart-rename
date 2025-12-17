"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferencesInOtherFiles = exports.getReferencesInCurrentFile = exports.findAllReferencesInCurrentFile = exports.findAllTextReferences = exports.analyzePropsTransmission = exports.findComponentUsages = exports.isSymbolExported = exports.kebabToPascal = exports.pascalToKebab = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 将PascalCase转换为kebab-case
 * @param str PascalCase字符串
 * @returns kebab-case字符串
 */
function pascalToKebab(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
exports.pascalToKebab = pascalToKebab;
/**
 * 将kebab-case转换为PascalCase
 * @param str kebab-case字符串
 * @returns PascalCase字符串
 */
function kebabToPascal(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
exports.kebabToPascal = kebabToPascal;
async function isSymbolExported(document, position) {
    // 获取符号定义
    const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, position) || [];
    if (definitions.length === 0)
        return false;
    // 检查定义位置的上下文
    const definition = definitions[0];
    if (!definition || !definition.range)
        return false;
    const definitionDocument = await vscode.workspace.openTextDocument(definition.uri);
    const symbolName = definitionDocument.getText(definition.range);
    const fileName = definitionDocument.fileName.toLowerCase();
    const fullText = definitionDocument.getText();
    // 检查是否为Vue组件
    if (fileName.endsWith('.vue')) {
        // 1. 检查 defineProps - 组件向外暴露的参数
        if (fullText.includes('defineProps')) {
            // 数组形式：defineProps(['propName'])
            const arrayPropsRegex = new RegExp(`definePropss*(s*[sS]*?['"]${symbolName}['"]`, 'g');
            // 对象形式（带引号或无引号）：defineProps({ propName: { type: String } })
            const objectPropsRegex = new RegExp(`definePropss*(s*[sS]*?['"]?${symbolName}['"]?s*:`, 'g');
            // 函数形式：defineProps(() => ({ propName: String }))
            const functionPropsRegex = new RegExp(`definePropss*(s*(s*)s*=>s*[sS]*?['"]?${symbolName}['"]?s*:`, 'g');
            if (arrayPropsRegex.test(fullText) || objectPropsRegex.test(fullText) || functionPropsRegex.test(fullText)) {
                return true;
            }
            // 更宽松的匹配，确保能匹配到
            const loosePropsRegex = new RegExp(`definePropss*[^)]*?\\b${symbolName}\\b`, 'g');
            if (loosePropsRegex.test(fullText)) {
                return true;
            }
        }
        // 2. 检查 defineEmits - 组件向外暴露的事件
        if (fullText.includes('defineEmits')) {
            // 数组形式：defineEmits(['eventName'])
            const arrayEmitsRegex = new RegExp(`defineEmitss*(s*[sS]*?['"]${symbolName}['"]`, 'g');
            // 对象形式：defineEmits({ eventName: (payload) => boolean })
            const objectEmitsRegex = new RegExp(`defineEmitss*(s*[sS]*?['"]?${symbolName}['"]?s*:`, 'g');
            if (arrayEmitsRegex.test(fullText) || objectEmitsRegex.test(fullText)) {
                return true;
            }
            const looseEmitsRegex = new RegExp(`defineEmitss*[^)]*?\\b${symbolName}\\b`, 'g');
            if (looseEmitsRegex.test(fullText)) {
                return true;
            }
        }
        // 3. 检查 defineExpose - 组件向外暴露的方法或属性
        if (fullText.includes('defineExpose')) {
            // defineExpose({ methodName, propertyName })
            const exposeRegex = new RegExp(`defineExposes*(s*[sS]*?\\b${symbolName}\\b`, 'g');
            if (exposeRegex.test(fullText)) {
                return true;
            }
        }
        // 4. 检查选项式API中的props选项
        if (fullText.includes('props:')) {
            const propsOptionRegex = /props\s*:\s*([{[][\s\S]*?[\]}])/g;
            let match;
            while ((match = propsOptionRegex.exec(fullText)) !== null) {
                const propsContent = match[1];
                const propRegex = new RegExp(`(?:[[sS]*?['"]${symbolName}['"]|{[^}]*?['"]?${symbolName}['"]?s*:)`, 'g');
                if (propRegex.test(propsContent)) {
                    return true;
                }
            }
        }
        // 5. 检查选项式API中的emits选项
        if (fullText.includes('emits:')) {
            const emitsOptionRegex = /emits\s*:\s*([{[][\s\S]*?[\]}])/g;
            let match;
            while ((match = emitsOptionRegex.exec(fullText)) !== null) {
                const emitsContent = match[1];
                const emitRegex = new RegExp(`(?:[[sS]*?['"]${symbolName}['"]|{[^}]*?['"]?${symbolName}['"]?s*:)`, 'g');
                if (emitRegex.test(emitsContent)) {
                    return true;
                }
            }
        }
        // 6. 检查 <script setup> 中的顶级变量和函数
        // 在 <script setup> 中定义的变量和函数可以直接被模板使用，且可以被父组件通过ref访问
        if (fullText.includes('<script setup>') || fullText.includes('<script setup lang=')) {
            // 检查是否为顶级定义（不在函数或对象内部）
            const setupScriptMatch = fullText.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/i);
            if (setupScriptMatch) {
                const setupContent = setupScriptMatch[1];
                // 检查是否为顶级变量或函数定义
                // const/let/var variableName = ...
                // function functionName(...) { ... }
                // const functionName = (...) => { ... }
                const topLevelRegex = new RegExp(`^(?:const|let|var|function|async\\s+function)\\s+${symbolName}\\b`, 'm');
                if (topLevelRegex.test(setupContent)) {
                    return true;
                }
            }
        }
    }
    // 7. 对于普通文件，检查是否有export声明
    const lineText = definitionDocument.lineAt(definition.range.start.line).text;
    // 检查 export function、export const、export let、export var
    if (lineText.includes('export')) {
        return true;
    }
    // 检查是否有 export { symbolName } 或 export { symbolName as ... }
    const exportStatementRegex = new RegExp(`export\\s*{[^}]*?\\b${symbolName}\\b`, 'g');
    if (exportStatementRegex.test(fullText)) {
        return true;
    }
    return false;
}
exports.isSymbolExported = isSymbolExported;
/**
 * 查找所有使用指定组件的位置
 */
async function findComponentUsages(componentName, workspaceFolder) {
    const results = [];
    // 生成所有可能的组件名称变体
    const componentNameVariants = new Set([
        componentName,
        pascalToKebab(componentName),
        kebabToPascal(componentName),
        componentName.toLowerCase(),
        componentName.toUpperCase() // 全大写变体
    ]);
    // 查找所有.vue和.js/.ts文件（使用相对路径模式）
    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.{vue,js,ts,jsx,tsx}'), new vscode.RelativePattern(workspaceFolder, '**/{node_modules,dist,build}/**'));
    // 用于去重的Set，避免重复添加相同的引用
    const uniqueLocations = new Set();
    for (const file of files) {
        const document = await vscode.workspace.openTextDocument(file);
        const text = document.getText();
        // 处理每个组件名称变体
        for (const variant of componentNameVariants) {
            // 转义特殊字符，用于正则表达式
            const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
            // 支持多种组件使用语法，使用大小写不敏感匹配
            const searchPatterns = [
                // Vue组件标签使用 - 支持 <Component> 和 <component-name>
                new RegExp(`<${escapedVariant}(?:\\s|>|/)`, 'gi'),
                new RegExp(`<${escapedVariant}/>`, 'gi'),
                new RegExp(`<${escapedVariant}[^>]*>[\\s\\S]*?</${escapedVariant}>`, 'gi'),
                // 动态组件使用
                new RegExp(`component\\s*:\\s*['"]${escapedVariant}['"]`, 'gi'),
                // 异步组件导入
                new RegExp(`import\\s+${escapedVariant}\\s+from`, 'gi'),
                new RegExp(`from\\s*['"][^'"]*${escapedVariant}['"]`, 'gi'),
                // 注册组件
                new RegExp(`${escapedVariant}\\s*,\\s*[\\r\\n]`, 'gi'),
                new RegExp(`['"]${escapedVariant}['"]\\s*:\\s*${escapedVariant}`, 'gi'),
                // Vue 3动态组件
                new RegExp(`resolveComponent(['"]${escapedVariant}['"])`, 'gi'),
                // JSX/TSX组件使用
                new RegExp(`<${escapedVariant}\\s*/>`, 'gi'),
                new RegExp(`<${escapedVariant}\\s+[^>]*>`, 'gi')
            ];
            for (const pattern of searchPatterns) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    const position = document.positionAt(match.index);
                    const range = new vscode.Range(position, position);
                    // 创建唯一标识符以避免重复
                    const locationKey = `${file.fsPath}:${position.line}:${position.character}`;
                    if (!uniqueLocations.has(locationKey)) {
                        uniqueLocations.add(locationKey);
                        results.push(new vscode.Location(file, range));
                    }
                }
            }
        }
    }
    return results;
}
exports.findComponentUsages = findComponentUsages;
/**
 * 分析Vue组件的props透传关系
 * 当组件向外暴露的参数（props）发生命名变化时，找到所有使用该组件的文件并更新props引用
 */
async function analyzePropsTransmission(componentName, propName, workspaceFolder) {
    const allReferences = [];
    // 用于去重的Set，避免重复添加相同的引用
    const uniqueLocations = new Set();
    // 转义特殊字符
    const escapedPropName = propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 生成所有可能的组件名称变体（PascalCase <-> kebab-case转换）
    const componentNameVariants = new Set();
    componentNameVariants.add(componentName); // 原始名称
    componentNameVariants.add(pascalToKebab(componentName)); // kebab-case变体
    componentNameVariants.add(kebabToPascal(componentName)); // PascalCase变体
    // 避免重复添加相同的变体
    const variantArray = Array.from(componentNameVariants);
    for (const variant of variantArray) {
        if (variant !== componentName) {
            componentNameVariants.add(variant.toLowerCase());
            componentNameVariants.add(variant.toUpperCase());
        }
    }
    // 1. 查找所有使用该组件的位置
    const componentUsages = await findComponentUsages(componentName, workspaceFolder);
    for (const usage of componentUsages) {
        try {
            const document = await vscode.workspace.openTextDocument(usage.uri);
            const text = document.getText();
            // 2. 分析组件使用时传递的props
            for (const variant of componentNameVariants) {
                const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // 更精确地匹配组件标签，包括自闭合标签和带内容的标签
                // 支持多种Vue组件语法
                const componentPatterns = [
                    // 标准标签形式 <Component /> 或 <component-name />
                    new RegExp(`<${escapedVariant}(\\s[^>]*?)?/>`, 'gi'),
                    // 标签形式带内容 <Component>...</Component>
                    new RegExp(`<${escapedVariant}(\\s[^>]*?)?>([\\s\\S]*?)</${escapedVariant}>`, 'gi'),
                    // 动态组件形式 :is="Component"
                    new RegExp(`:is\\s*=\\s*['"]${escapedVariant}['"]`, 'gi'),
                    // JSX形式 <Component></Component>
                    new RegExp(`<${escapedVariant}\\s*>`, 'gi')
                ];
                for (const componentRegex of componentPatterns) {
                    componentRegex.lastIndex = 0; // 重置正则表达式
                    let match;
                    while ((match = componentRegex.exec(text)) !== null) {
                        const fullMatch = match[0];
                        const attributesPart = match[1] || '';
                        const contentPart = match[2] || '';
                        // 3. 检查属性部分是否包含目标props
                        // 支持多种Vue props绑定语法
                        const propPatterns = [
                            // Vue props绑定，如 :propName="value"（最常用）
                            {
                                pattern: new RegExp(`[\\s:](${escapedPropName})\\s*=`, 'gi'),
                                group: 1
                            },
                            // v-bind:propName="value"
                            {
                                pattern: new RegExp(`v-bind:(${escapedPropName})\\s*=`, 'gi'),
                                group: 1
                            },
                            // v-model:propName="value"
                            {
                                pattern: new RegExp(`v-model:(${escapedPropName})\\s*=`, 'gi'),
                                group: 1
                            },
                            // v-slot:propName
                            {
                                pattern: new RegExp(`v-slot:(${escapedPropName})\\s*=?`, 'gi'),
                                group: 1
                            },
                            // 普通props，如 propName="value"
                            {
                                pattern: new RegExp(`\\s(${escapedPropName})\\s*=`, 'gi'),
                                group: 1
                            },
                            // 对象展开形式，如 v-bind="{ propName: value }"
                            {
                                pattern: new RegExp(`v-bind\\s*=\\s*["']\\s*\\{[^}]*?\\b(${escapedPropName})\\b[^}]*?\\}`, 'gi'),
                                group: 1
                            }
                        ];
                        for (const { pattern, group } of propPatterns) {
                            pattern.lastIndex = 0;
                            let propMatch;
                            while ((propMatch = pattern.exec(attributesPart)) !== null) {
                                const matchedText = propMatch[group];
                                if (!matchedText)
                                    continue;
                                // 计算在完整文档中的位置
                                const matchStartInAttributes = propMatch.index;
                                const componentStart = match.index;
                                const attributesStart = componentStart + fullMatch.indexOf(attributesPart);
                                const symbolStart = attributesStart + matchStartInAttributes + propMatch[0].indexOf(matchedText);
                                const position = document.positionAt(symbolStart);
                                const range = new vscode.Range(position, position.translate(0, matchedText.length));
                                // 创建唯一标识符以避免重复
                                const locationKey = `${usage.uri.fsPath}:${position.line}:${position.character}`;
                                if (!uniqueLocations.has(locationKey)) {
                                    uniqueLocations.add(locationKey);
                                    allReferences.push(new vscode.Location(usage.uri, range));
                                }
                            }
                        }
                        // 4. 检查内容部分是否在模板中使用了目标props（较少见，但在某些场景下需要）
                        if (contentPart) {
                            const componentStart = match.index; // 获取组件标签在文档中的起始位置
                            const templatePatterns = [
                                // 模板插值，如 {{ propName }}
                                {
                                    pattern: new RegExp(`{{\\s*([^}]*?\\b${escapedPropName}\\b[^}]*?)\\s*}}`, 'gi'),
                                    group: 1
                                }
                            ];
                            for (const { pattern, group } of templatePatterns) {
                                pattern.lastIndex = 0;
                                let templateMatch;
                                while ((templateMatch = pattern.exec(contentPart)) !== null) {
                                    const matchedText = templateMatch[group];
                                    if (!matchedText || !matchedText.includes(propName))
                                        continue;
                                    // 计算在完整文档中的位置
                                    const contentStart = componentStart + fullMatch.indexOf(contentPart);
                                    const propIndexInMatch = matchedText.toLowerCase().indexOf(propName.toLowerCase());
                                    const symbolStart = contentStart + templateMatch.index + matchedText.indexOf(propName, propIndexInMatch);
                                    const position = document.positionAt(symbolStart);
                                    const range = new vscode.Range(position, position.translate(0, propName.length));
                                    const locationKey = `${usage.uri.fsPath}:${position.line}:${position.character}`;
                                    if (!uniqueLocations.has(locationKey)) {
                                        uniqueLocations.add(locationKey);
                                        allReferences.push(new vscode.Location(usage.uri, range));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.warn(`分析组件 ${componentName} 的props传递时出错:`, error);
        }
    }
    return allReferences;
}
exports.analyzePropsTransmission = analyzePropsTransmission;
/**
 * 使用文本搜索查找所有引用
 */
async function findAllTextReferences(symbolName, workspaceFolder) {
    const results = [];
    // 查找所有相关文件（使用相对路径模式）
    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.{vue,js,ts,jsx,tsx}'), new vscode.RelativePattern(workspaceFolder, '**/{node_modules,dist,build,.git}/**'));
    // 用于去重的Set，避免重复添加相同的引用
    const uniqueLocations = new Set();
    // 转义特殊字符，用于正则表达式
    const escapedSymbolName = symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const file of files) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const text = document.getText();
            // 生成更精确的搜索模式，覆盖Vue3的各种使用场景
            // 注意：移除了可能导致误匹配的模式（如普通变量引用、对象属性定义等）
            // 这些应该由 VSCode 的 LSP 来查找，文本搜索主要用于 Vue 特定语法
            const searchPatterns = [
                // 1. Vue props绑定，如 :propName="value"
                {
                    pattern: new RegExp(`[:]\\s*(${escapedSymbolName})\\s*=`, 'gi'),
                    group: 1,
                    description: 'Vue props绑定'
                },
                // 2. Vue v-bind绑定，如 v-bind:propName="value"
                {
                    pattern: new RegExp(`v-bind:(${escapedSymbolName})\\s*=`, 'gi'),
                    group: 1,
                    description: 'Vue v-bind绑定'
                },
                // 3. Vue v-model绑定，如 v-model:propName="value"
                {
                    pattern: new RegExp(`v-model:(${escapedSymbolName})\\s*=`, 'gi'),
                    group: 1,
                    description: 'Vue v-model绑定'
                },
                // 4. Vue v-slot绑定，如 v-slot:slotName 或 #slotName
                {
                    pattern: new RegExp(`v-slot:(${escapedSymbolName})\\s*=?`, 'gi'),
                    group: 1,
                    description: 'Vue v-slot绑定'
                },
                {
                    pattern: new RegExp(`#(${escapedSymbolName})(?:\\s|>|=)`, 'gi'),
                    group: 1,
                    description: 'Vue slot简写'
                },
                // 5. 模板插值，如 {{ propName }} 或 {{ propName.attr }}
                {
                    pattern: new RegExp(`{{\\s*([^}]*?\\b${escapedSymbolName}\\b[^}]*?)\\s*}}`, 'gi'),
                    group: 1,
                    description: '模板插值'
                },
                // 6. Vue 3组合式API中的props引用 - defineProps(['propName']) 或 defineProps({ propName: ... })
                {
                    pattern: new RegExp(`defineProps\\s*\\([^)]*?['"]?(${escapedSymbolName})['"]?`, 'gi'),
                    group: 1,
                    description: 'defineProps中的props引用'
                },
                // 7. Vue 3组合式API中的emits引用 - defineEmits(['eventName'])
                {
                    pattern: new RegExp(`defineEmits\\s*\\([^)]*?['"](${escapedSymbolName})['"]`, 'gi'),
                    group: 1,
                    description: 'defineEmits中的事件引用'
                },
                // 8. Vue 3组合式API中的expose引用 - defineExpose({ methodName })
                {
                    pattern: new RegExp(`defineExpose\\s*\\([^)]*?\\b(${escapedSymbolName})\\b`, 'gi'),
                    group: 1,
                    description: 'defineExpose中的方法引用'
                },
                // 9. emit调用，如 emit('eventName', ...)
                {
                    pattern: new RegExp(`emit\\s*\\(\\s*['"](${escapedSymbolName})['"]`, 'gi'),
                    group: 1,
                    description: 'emit事件调用'
                },
                // 10. 组件事件监听，如 @eventName="handler" 或 v-on:eventName="handler"
                {
                    pattern: new RegExp(`@(${escapedSymbolName})\\s*=`, 'gi'),
                    group: 1,
                    description: '组件事件监听'
                },
                {
                    pattern: new RegExp(`v-on:(${escapedSymbolName})\\s*=`, 'gi'),
                    group: 1,
                    description: 'v-on事件绑定'
                }
            ];
            // 检查位置是否在注释或字符串中的辅助函数
            const isInCommentOrString = (offset, text) => {
                // 获取当前位置之前的文本
                const beforeText = text.substring(0, offset);
                // 检查是否在单行注释中 (//)
                const lastLineComment = beforeText.lastIndexOf('//');
                if (lastLineComment !== -1) {
                    const nextNewline = text.indexOf('\n', lastLineComment);
                    if (nextNewline === -1 || nextNewline > offset) {
                        return true; // 在单行注释中
                    }
                }
                // 检查是否在多行注释中 (/* */)
                const lastBlockCommentStart = beforeText.lastIndexOf('/*');
                if (lastBlockCommentStart !== -1) {
                    const blockCommentEnd = text.indexOf('*/', lastBlockCommentStart);
                    if (blockCommentEnd === -1 || blockCommentEnd > offset) {
                        return true; // 在多行注释中
                    }
                }
                // 检查是否在 HTML 注释中 (<!-- -->)
                const lastHtmlCommentStart = beforeText.lastIndexOf('<!--');
                if (lastHtmlCommentStart !== -1) {
                    const htmlCommentEnd = text.indexOf('-->', lastHtmlCommentStart);
                    if (htmlCommentEnd === -1 || htmlCommentEnd > offset) {
                        return true; // 在 HTML 注释中
                    }
                }
                // 检查是否在字符串字面量中（简单检查，不处理转义）
                let inSingleQuote = false;
                let inDoubleQuote = false;
                let inTemplateLiteral = false;
                let escapeNext = false;
                for (let i = 0; i < offset; i++) {
                    const char = text[i];
                    const nextChar = text[i + 1];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (char === '\\') {
                        escapeNext = true;
                        continue;
                    }
                    if (char === "'" && !inDoubleQuote && !inTemplateLiteral) {
                        inSingleQuote = !inSingleQuote;
                    }
                    else if (char === '"' && !inSingleQuote && !inTemplateLiteral) {
                        inDoubleQuote = !inDoubleQuote;
                    }
                    else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
                        inTemplateLiteral = !inTemplateLiteral;
                    }
                }
                // 如果当前在字符串中，需要检查是否是允许的上下文（如 defineProps 的数组）
                if (inSingleQuote || inDoubleQuote || inTemplateLiteral) {
                    // 检查是否在 defineProps(['propName']) 或 defineEmits(['eventName']) 的上下文中
                    const beforeMatch = text.substring(Math.max(0, offset - 100), offset);
                    const isInPropsArray = /defineProps\s*\(\s*\[[^\]]*$/i.test(beforeMatch);
                    const isInEmitsArray = /defineEmits\s*\(\s*\[[^\]]*$/i.test(beforeMatch);
                    // 只允许在 props 或 emits 数组中
                    return !(isInPropsArray || isInEmitsArray);
                }
                return false;
            };
            for (const { pattern, group, description } of searchPatterns) {
                // 重置正则表达式的lastIndex，确保每次从头开始匹配
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    // 确定匹配的实际符号位置和长度
                    let symbolStart, symbolLength;
                    if (group === 0) {
                        // 对于整个匹配，我们需要找到symbolName在其中的位置
                        const fullMatch = match[0];
                        const symbolIndex = fullMatch.toLowerCase().indexOf(symbolName.toLowerCase());
                        if (symbolIndex !== -1) {
                            symbolStart = match.index + symbolIndex;
                            symbolLength = symbolName.length;
                        }
                        else {
                            continue;
                        }
                    }
                    else {
                        const matchedText = match[group];
                        if (!matchedText)
                            continue;
                        const matchIndexInFull = match[0].toLowerCase().indexOf(matchedText.toLowerCase());
                        if (matchIndexInFull === -1)
                            continue;
                        symbolStart = match.index + matchIndexInFull;
                        symbolLength = matchedText.length;
                    }
                    // 检查是否在注释或字符串中（除非是允许的上下文）
                    if (isInCommentOrString(symbolStart, text)) {
                        continue; // 跳过注释和字符串中的匹配
                    }
                    // 验证是否真的是我们要找的符号（避免部分匹配）
                    const beforeChar = symbolStart > 0 ? text[symbolStart - 1] : '';
                    const afterChar = symbolStart + symbolLength < text.length ? text[symbolStart + symbolLength] : '';
                    // 检查是否是单词边界（避免部分匹配）
                    const isWordBoundary = !/[a-zA-Z0-9_]/.test(beforeChar) &&
                        !/[a-zA-Z0-9_]/.test(afterChar);
                    // 对于特殊模式（如props绑定），不需要严格的单词边界检查
                    const needsWordBoundary = description?.includes('普通') || description?.includes('对象方法') || description?.includes('对象属性');
                    if (needsWordBoundary && !isWordBoundary) {
                        continue;
                    }
                    // 额外验证：确保匹配的文本确实是我们要找的符号
                    const matchedText = text.substring(symbolStart, symbolStart + symbolLength);
                    if (matchedText.toLowerCase() !== symbolName.toLowerCase()) {
                        continue; // 文本不匹配，跳过
                    }
                    const position = document.positionAt(symbolStart);
                    const range = new vscode.Range(position, position.translate(0, symbolLength));
                    // 创建唯一标识符以避免重复
                    const locationKey = `${file.fsPath}:${position.line}:${position.character}`;
                    if (!uniqueLocations.has(locationKey)) {
                        uniqueLocations.add(locationKey);
                        results.push(new vscode.Location(file, range));
                    }
                }
            }
        }
        catch (error) {
            // 忽略无法打开的文件
            console.warn(`无法处理文件 ${file.fsPath}:`, error);
        }
    }
    return results;
}
exports.findAllTextReferences = findAllTextReferences;
/**
 * 在当前文件中查找所有引用（包括Vue模板中的引用）
 * 用于单文件内变量和函数的重命名
 */
async function findAllReferencesInCurrentFile(document, symbolName) {
    const results = [];
    const text = document.getText();
    const uniqueLocations = new Set();
    const escapedSymbolName = symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 针对当前文件的搜索模式（更精确）
    const searchPatterns = [
        // 1. 普通变量/函数引用（单词边界）
        {
            pattern: new RegExp(`\\b(${escapedSymbolName})\\b`, 'g'),
            group: 1,
            description: '普通变量/函数引用'
        },
        // 2. Vue props绑定，如 :propName="value"
        {
            pattern: new RegExp(`[\\s:](${escapedSymbolName})\\s*=`, 'g'),
            group: 1,
            description: 'Vue props绑定'
        },
        // 3. Vue v-bind绑定
        {
            pattern: new RegExp(`v-bind:(${escapedSymbolName})\\s*=`, 'g'),
            group: 1,
            description: 'Vue v-bind绑定'
        },
        // 4. Vue v-model绑定
        {
            pattern: new RegExp(`v-model:(${escapedSymbolName})\\s*=`, 'g'),
            group: 1,
            description: 'Vue v-model绑定'
        },
        // 5. Vue v-slot绑定
        {
            pattern: new RegExp(`v-slot:(${escapedSymbolName})\\s*=?`, 'g'),
            group: 1,
            description: 'Vue v-slot绑定'
        },
        // 6. 模板插值，如 {{ propName }}
        {
            pattern: new RegExp(`{{\\s*([^}]*?\\b${escapedSymbolName}\\b[^}]*?)\\s*}}`, 'g'),
            group: 1,
            description: '模板插值'
        },
        // 7. defineProps中的引用
        {
            pattern: new RegExp(`defineProps\\s*\\([^)]*?['"]?(${escapedSymbolName})['"]?`, 'g'),
            group: 1,
            description: 'defineProps中的props引用'
        },
        // 8. defineEmits中的引用
        {
            pattern: new RegExp(`defineEmits\\s*\\([^)]*?['"](${escapedSymbolName})['"]`, 'g'),
            group: 1,
            description: 'defineEmits中的事件引用'
        },
        // 9. defineExpose中的引用
        {
            pattern: new RegExp(`defineExpose\\s*\\([^)]*?\\b(${escapedSymbolName})\\b`, 'g'),
            group: 1,
            description: 'defineExpose中的方法引用'
        },
        // 10. 对象属性引用
        {
            pattern: new RegExp(`\\b(${escapedSymbolName})\\s*:`, 'g'),
            group: 1,
            description: '对象属性定义'
        },
        // 11. 方法调用
        {
            pattern: new RegExp(`\\.(${escapedSymbolName})\\s*\\(`, 'g'),
            group: 1,
            description: '对象方法调用'
        },
        // 12. emit调用
        {
            pattern: new RegExp(`emit\\s*\\(\\s*['"](${escapedSymbolName})['"]`, 'g'),
            group: 1,
            description: 'emit事件调用'
        },
        // 13. 组件事件监听
        {
            pattern: new RegExp(`@(${escapedSymbolName})\\s*=`, 'g'),
            group: 1,
            description: '组件事件监听'
        },
        {
            pattern: new RegExp(`v-on:(${escapedSymbolName})\\s*=`, 'g'),
            group: 1,
            description: 'v-on事件绑定'
        }
    ];
    for (const { pattern, group } of searchPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let symbolStart, symbolLength;
            if (group === 0) {
                const fullMatch = match[0];
                const symbolIndex = fullMatch.toLowerCase().indexOf(symbolName.toLowerCase());
                if (symbolIndex !== -1) {
                    symbolStart = match.index + symbolIndex;
                    symbolLength = symbolName.length;
                }
                else {
                    continue;
                }
            }
            else {
                const matchedText = match[group];
                if (!matchedText)
                    continue;
                // 对于模板插值，需要找到具体的符号位置
                if (group === 1 && match[0].includes('{{')) {
                    const interpolationText = matchedText;
                    const symbolIndex = interpolationText.toLowerCase().indexOf(symbolName.toLowerCase());
                    if (symbolIndex === -1)
                        continue;
                    symbolStart = match.index + match[0].indexOf(matchedText) + symbolIndex;
                    symbolLength = symbolName.length;
                }
                else {
                    const matchIndexInFull = match[0].indexOf(matchedText);
                    if (matchIndexInFull === -1)
                        continue;
                    symbolStart = match.index + matchIndexInFull;
                    symbolLength = matchedText.length;
                }
            }
            const position = document.positionAt(symbolStart);
            const range = new vscode.Range(position, position.translate(0, symbolLength));
            const locationKey = `${position.line}:${position.character}`;
            if (!uniqueLocations.has(locationKey)) {
                uniqueLocations.add(locationKey);
                results.push(new vscode.Location(document.uri, range));
            }
        }
    }
    return results;
}
exports.findAllReferencesInCurrentFile = findAllReferencesInCurrentFile;
function getReferencesInCurrentFile(references, currentUri) {
    return references.filter(ref => ref && ref.uri && ref.range && ref.uri.fsPath === currentUri.fsPath);
}
exports.getReferencesInCurrentFile = getReferencesInCurrentFile;
function getReferencesInOtherFiles(references, currentUri) {
    return references.filter(ref => ref && ref.uri && ref.range && ref.uri.fsPath !== currentUri.fsPath);
}
exports.getReferencesInOtherFiles = getReferencesInOtherFiles;
//# sourceMappingURL=symbolAnalyzer.js.map