# 新测试用例测试报告

## 测试日期
2024年（根据实际日期更新）

## 测试用例概述

新增了嵌套组件 props 传递链的测试场景，验证插件在多层组件嵌套时是否能正确追踪和更新 props 引用。

### 测试文件结构

```
test-vue/src/
├── components/
│   └── ChildComponent1.vue  (Level 3: 最底层组件)
├── App1.vue                  (Level 2: 中间组件)
└── App1-1.vue               (Level 1: 最顶层组件)
```

### Props 传递链

```
App1-1.vue (parentA1)
    ↓ :a1="parentA1"
App1.vue (props: { a1 })
    ↓ :a1="a1"
ChildComponent1.vue (props: { a1 })
```

## 测试结果

### ✅ 文件结构验证
- ✓ ChildComponent1.vue - 存在且格式正确
- ✓ App1.vue - 存在且格式正确
- ✓ App1-1.vue - 存在且格式正确

### ✅ Props 传递链验证

#### Level 3: ChildComponent1.vue (最底层组件)
- ✓ 定义了 props: `defineProps({ a1: { type: ... } })`
- ✓ 模板中使用: `{{ a1 }}` (2处)

#### Level 2: App1.vue (中间组件)
- ✓ 定义了 props: `defineProps({ a1: { type: ... } })` (接收来自父组件)
- ✓ 使用 ChildComponent1 组件
- ✓ 传递 props 给子组件: `:a1="a1"`
- ✓ 模板中使用: `{{ a1 }}`

#### Level 1: App1-1.vue (最顶层组件)
- ✓ 使用 App1 组件
- ✓ 传递 props 给 App1: `:a1="parentA1"`
- ✓ 定义了本地变量: `parentA1`

### ✅ 传递链完整性
- ✓ 传递链完整: App1-1.vue → App1.vue → ChildComponent1.vue
- ✓ 所有层级都正确传递 props `a1`

## 重命名场景测试

### 测试场景：在 ChildComponent1.vue 中将 `a1` 重命名为 `a2`

当执行重命名时，插件应该更新以下位置：

#### ChildComponent1.vue
- [ ] `defineProps({ a1: ... })` → `defineProps({ a2: ... })`
- [ ] `{{ a1 }}` → `{{ a2 }}` (2处)

#### App1.vue
- [ ] `defineProps({ a1: ... })` → `defineProps({ a2: ... })`
- [ ] `:a1="a1"` → `:a2="a2"` (传递给 ChildComponent1)
- [ ] `{{ a1 }}` → `{{ a2 }}`

#### App1-1.vue
- [ ] `:a1="parentA1"` → `:a2="parentA1"` (传递给 App1)

## 测试要点

### 1. 嵌套组件识别
- 插件需要能够识别多层组件嵌套关系
- 能够追踪 props 从顶层到底层的传递路径

### 2. 中间组件处理
- 中间组件既接收 props，又传递 props 给子组件
- 需要同时更新接收和传递两个位置的引用

### 3. 组件名称匹配
- 支持 PascalCase 组件名称（如 `ChildComponent1`, `App1`）
- 插件应该能够正确匹配组件使用和组件文件

## 手动测试步骤

1. **准备环境**
   - 在 VSCode 中安装插件 `api-tracking-0.0.1.vsix`
   - 打开 `test-vue` 目录作为工作区

2. **执行重命名**
   - 打开 `ChildComponent1.vue`
   - 将光标放在第14行的 `a1` 上（在 `defineProps({ a1: ... })` 中）
   - 按 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
   - 输入新名称：`a2`
   - 选择"全局更新"

3. **验证结果**
   - 检查 `ChildComponent1.vue`：
     - `defineProps({ a2: ... })` ✓
     - `{{ a2 }}` (2处) ✓
   - 检查 `App1.vue`：
     - `defineProps({ a2: ... })` ✓
     - `:a2="a2"` ✓
     - `{{ a2 }}` ✓
   - 检查 `App1-1.vue`：
     - `:a2="parentA1"` ✓

4. **验证未受影响的部分**
   - `App1-1.vue` 中的 `parentA1` 变量名不应改变
   - 其他不相关的代码不应被修改

## 预期行为

1. **自动检测跨文件引用**
   - 插件应自动检测到 `a1` 是导出的 props
   - 应提示执行全局更新

2. **完整更新**
   - 所有三个文件中的相关引用都应被更新
   - 包括 props 定义、props 传递、模板使用

3. **准确性**
   - 只更新相关的引用，不误替换其他内容
   - 例如，`parentA1` 变量名不应被改变

## 潜在问题

1. **深层嵌套支持**
   - 如果组件嵌套层数更深（超过3层），需要验证插件是否能正确处理

2. **组件名称变体**
   - 如果组件使用了不同的命名方式（kebab-case），需要验证匹配是否准确

3. **性能**
   - 对于大型项目，需要验证插件性能是否可接受

## 测试结论

✅ **测试用例结构正确**
- 所有文件格式正确
- Props 传递链完整
- 各层级组件正确使用 props

✅ **准备就绪进行手动测试**
- 代码结构支持嵌套组件场景
- 插件功能应该能够处理这个测试场景

**建议**: 进行实际的手动测试以验证插件在实际使用中的表现。

## 更新日志

- 修复了 App1.vue 中缺少 props 定义的问题
- 修复了 App1.vue 中导入组件名称错误的问题
- 修复了 App1-1.vue 中导入组件错误的问题

