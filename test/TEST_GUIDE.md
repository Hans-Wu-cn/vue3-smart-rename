# 插件功能测试指南

## 自动化测试结果

已运行核心功能测试，所有测试用例通过：

### ✅ 测试用例1: defineProps 对象语法识别
- Props 导出检测: ✓ 通过
- 父组件引用查找: ✓ 通过 (找到 1处引用)

### ✅ 测试用例2: defineProps 数组语法识别  
- Props 导出检测: ✓ 通过
- 父组件引用查找: ✓ 通过 (找到 1处引用)

### ✅ 测试用例3: 模板插值识别
- 模板引用查找: ✓ 通过 (找到 2处引用)

### ✅ 实际文件测试
- ChildComponent.vue 中 props 'a1' 检测: ✓ 通过
- ChildComponent.vue 中模板使用: ✓ 通过 (找到 2处)
- App.vue 中 props 绑定: ✓ 通过 (找到 1处)

## 手动测试步骤

### 测试场景1: 跨组件 Props 重命名

**测试文件**: 
- `test-vue/src/components/ChildComponent.vue`
- `test-vue/src/App.vue`

**步骤**:
1. 在 VSCode 中打开 `test-vue` 目录作为工作区
2. 打开 `ChildComponent.vue` 文件
3. 将光标放在第12行的 `a1` 上（defineProps 中的 a1）
4. 按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac) 触发智能重命名
5. 输入新名称，例如 `a2`
6. 选择"全局更新"（应该检测到跨文件引用）
7. 验证结果：
   - ✅ `ChildComponent.vue` 中的 `defineProps({ a1: ... })` 应更新为 `defineProps({ a2: ... })`
   - ✅ `ChildComponent.vue` 模板中的 `{{ a1 }}` 应更新为 `{{ a2 }}`
   - ✅ `App.vue` 中的 `:a1="parentA1"` 应更新为 `:a2="parentA1"`

**预期行为**:
- 插件应检测到 `a1` 是在 `defineProps` 中定义的 props
- 插件应自动识别为"导出"，提示执行全局更新
- 所有相关引用应同步更新

### 测试场景2: 单文件内变量重命名

**测试文件**: `test-vue/src/App.vue`

**步骤**:
1. 打开 `App.vue` 文件
2. 将光标放在第13行的 `parentA1` 上
3. 按 `Ctrl+Shift+R` 触发智能重命名
4. 输入新名称，例如 `parentA2`
5. 选择"仅更新当前文件"
6. 验证结果：
   - ✅ `const parentA1 = ref('初始值')` 应更新为 `const parentA2 = ref('初始值')`
   - ✅ `{{ parentA1 }}` 应更新为 `{{ parentA2 }}`
   - ✅ `:a1="parentA1"` 应更新为 `:a1="parentA2"`

**预期行为**:
- 插件应找到当前文件中所有 `parentA1` 的引用
- 所有引用应同步更新

### 测试场景3: 模板插值中的变量重命名

**测试文件**: `test-vue/src/components/ChildComponent.vue`

**步骤**:
1. 打开 `ChildComponent.vue` 文件
2. 创建一个新的变量，例如在 script setup 中添加：
   ```javascript
   const userName = ref('John')
   ```
3. 在模板中使用：
   ```vue
   <p>{{ userName }}</p>
   <span>{{ userName }} 元</span>
   ```
4. 将光标放在 `userName` 上
5. 按 `Ctrl+Shift+R` 触发智能重命名
6. 输入新名称，例如 `user`
7. 验证结果：
   - ✅ 所有 `userName` 引用应更新为 `user`
   - ✅ 包括模板插值中的引用

## 测试检查清单

### 功能检查
- [ ] Props 重命名能够跨文件同步
- [ ] 单文件内变量重命名正常工作
- [ ] 模板插值中的变量能正确识别和更新
- [ ] Props 绑定语法（`:prop`、`v-bind:prop`）能正确处理
- [ ] 全局更新选项正常工作
- [ ] 仅当前文件更新选项正常工作

### 边界情况检查
- [ ] 符号名称包含特殊字符时的处理
- [ ] 符号名称是 JavaScript 关键字时的处理
- [ ] 部分匹配的变量名不会被误替换（如 `user` vs `userName`）
- [ ] 注释中的相同名称不会被替换

### 用户体验检查
- [ ] 提示信息清晰明确
- [ ] 更新范围选择合理
- [ ] 更新完成后有成功提示
- [ ] 错误情况有友好提示

## 已知限制

1. 插件依赖 VSCode 的 Language Server 来获取符号引用，某些复杂情况可能需要配合文本搜索
2. 对于动态生成的组件名称（如 `:is="componentName"`），可能无法完全追踪
3. 对于嵌套很深的组件传递链，可能需要多次运行才能完全更新

## 报告问题

如果测试过程中发现问题，请记录：
1. 测试场景
2. 预期行为
3. 实际行为
4. 相关文件内容
5. 错误信息（如果有）

