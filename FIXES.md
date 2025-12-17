# 全局替换问题修复说明

## 问题描述
用户反馈使用打包后的插件进行全局替换时，只有当前文件被替换，其他文件没有被更新。用户提到可能的问题是文件夹问题：common.vue 在 src/component/select 文件夹中，调用放在 src/view/biz 中。

## 修复的问题

### 1. 文件路径分隔符处理
**问题**: 只处理了 Windows 的 `\`，没有处理 Unix 的 `/`

**修复**: 
```typescript
// 修复前
const fileName = document.fileName.split('\\').pop() || '';

// 修复后
const fileName = document.fileName.split(/[/\\]/).pop() || '';
```

### 2. 文件搜索路径格式
**问题**: 使用绝对路径字符串可能导致文件搜索失败

**修复**: 使用 `vscode.RelativePattern` 代替字符串路径
```typescript
// 修复前
const files = await vscode.workspace.findFiles(
  `${workspaceFolder.uri.fsPath}/**/*.{vue,js,ts,jsx,tsx}`,
  `{node_modules,dist,build}`
);

// 修复后
const files = await vscode.workspace.findFiles(
  new vscode.RelativePattern(workspaceFolder, '**/*.{vue,js,ts,jsx,tsx}'),
  new vscode.RelativePattern(workspaceFolder, '**/{node_modules,dist,build}/**')
);
```

### 3. 组件名称正则表达式转义
**问题**: kebab-case 组件名称（如 `common-select`）中的连字符没有被转义，导致正则表达式匹配失败

**修复**: 在 `findComponentUsages` 函数中添加特殊字符转义
```typescript
// 添加转义
const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
```

### 4. 全局更新时引用列表同步
**问题**: 在自动全局更新路径中，使用的是旧的 `validReferences`，而不是最新的引用列表

**修复**: 确保使用最新的引用列表
```typescript
// 修复后
const finalReferences = validReferences.length > 0 && otherFileReferences.length > 0 
  ? validReferences 
  : references.filter(ref => ref && ref.uri && ref.range);
```

### 5. 添加调试日志
添加了调试日志以便排查问题：
- 记录检测到的跨文件引用数量
- 记录需要更新的文件列表
- 记录全局更新时的引用数量

## 测试建议

1. **测试跨文件夹组件引用**:
   - 组件文件: `src/component/select/common.vue`
   - 使用文件: `src/view/biz/some-file.vue`
   - 在 `common.vue` 中重命名 props，验证 `some-file.vue` 中的引用是否被更新

2. **测试组件名称变体**:
   - 文件名: `common.vue`
   - 使用方式: `<Common>`、`<common>`、`<common-select>` 等
   - 验证所有变体都能被正确识别

3. **检查控制台输出**:
   - 在 VSCode 的"输出"面板中选择插件输出
   - 查看调试日志，确认找到了多少引用和哪些文件

## 注意事项

1. 确保工作区根目录正确配置
2. 检查 `.gitignore` 或其他排除配置是否影响了文件搜索
3. 如果问题仍然存在，查看控制台日志以获取更多信息

