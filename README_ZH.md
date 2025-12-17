## 语言 / Languages

- [English README](./README.md)
- [简体中文 README](./README_ZH.md)

# VSCode Vue3 智能重命名插件

一个专为 Vue3 项目设计的智能重命名插件，能够自动同步更新组件参数、函数和变量名在项目中的所有引用。

## 功能特性

### 1. 组件参数和函数同步更新

当 Vue3 组件向外暴露的参数（props）或函数发生命名变化时，插件会自动查找并更新工程中所有引用该组件的地方：

- ✅ 支持 `defineProps` - 组件参数声明
- ✅ 支持 `defineEmits` - 组件事件声明
- ✅ 支持 `defineExpose` - 组件暴露的方法或属性
- ✅ 支持选项式 API 的 `props` 和 `emits` 选项
- ✅ 自动检测跨文件引用并全局更新

### 2. 单文件内变量和函数同步更新

当文件中的变量名或函数发生命名变化时，插件会自动更新当前文件中的所有引用：

- ✅ 支持普通变量和函数
- ✅ 支持 Vue 模板中的插值语法 `{{ variable }}`
- ✅ 支持 Vue 指令绑定（`:prop`、`v-bind`、`v-model`、`v-slot` 等）
- ✅ 支持事件绑定（`@event`、`v-on`）

## 使用方法

### 基本使用

1. **定位到要重命名的符号**：将光标放在变量、函数或组件参数名称上
2. **触发命令**：
   - 按快捷键 `Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac)
   - 或通过命令面板 (`Ctrl+Shift+P`) 搜索 "智能同步更新变量/函数名"
3. **输入新名称**：在弹出的输入框中输入新的名称
4. **选择更新范围**：
   - 如果检测到跨文件引用，插件会自动执行全局更新
   - 如果未检测到跨文件引用，可以选择"仅更新当前文件"或"全局更新"

### 使用示例

#### 示例 1：重命名组件 Props

**组件定义** (`ChildComponent.vue`)：
```vue
<script setup>
const props = defineProps({
  selectedIds: {
    type: Array,
    default: () => []
  }
})
</script>
```

**父组件使用** (`ParentComponent.vue`)：
```vue
<template>
  <ChildComponent :selectedIds="ids" />
</template>
```

当你在 `ChildComponent.vue` 中将 `selectedIds` 重命名为 `selectedItems` 时，插件会自动更新：
- ✅ `ChildComponent.vue` 中的 `defineProps` 声明
- ✅ `ParentComponent.vue` 中的 `:selectedIds="ids"` → `:selectedItems="ids"`

#### 示例 2：重命名文件内变量

**文件内容**：
```vue
<script setup>
const userName = ref('John')
</script>

<template>
  <div>
    <p>{{ userName }}</p>
    <button @click="updateUserName">更新</button>
  </div>
</template>
```

将光标放在 `userName` 上并重命名为 `user` 时，插件会自动更新：
- ✅ `const user = ref('John')`
- ✅ `{{ user }}`
- ✅ 所有在 `<script setup>` 中的引用

#### 示例 3：重命名组件事件

**子组件** (`ChildComponent.vue`)：
```vue
<script setup>
const emit = defineEmits(['updateValue'])
</script>
```

**父组件** (`ParentComponent.vue`)：
```vue
<template>
  <ChildComponent @updateValue="handleUpdate" />
</template>
```

当重命名 `updateValue` 为 `valueUpdated` 时，插件会自动更新：
- ✅ `defineEmits(['valueUpdated'])`
- ✅ `@valueUpdated="handleUpdate"`

## 支持的 Vue3 语法

### Props 绑定
- `:propName="value"` - 简写绑定
- `v-bind:propName="value"` - 完整语法
- `v-model:propName="value"` - 双向绑定
- `propName="value"` - 静态绑定

### 模板语法
- `{{ variable }}` - 插值表达式
- `{{ obj.property }}` - 对象属性访问

### 事件绑定
- `@eventName="handler"` - 简写语法
- `v-on:eventName="handler"` - 完整语法

### Slot 语法
- `v-slot:slotName` - 具名插槽
- `#slotName` - 插槽简写

## 技术实现

### 符号检测
- 使用 VSCode 的 Language Server Protocol (LSP) 获取符号定义和引用
- 结合文本搜索确保找到所有引用，包括模板中的引用

### 组件关联分析
- 支持 PascalCase 和 kebab-case 组件名称转换
- 分析组件使用关系，追踪 props 传递

### 智能更新范围
- 自动检测符号是否被导出
- 区分单文件引用和跨文件引用
- 提供用户选择更新范围的选项

## 注意事项

1. **工作区要求**：插件需要工作区支持，确保项目文件在同一工作区中
2. **文件保存**：全局更新会自动保存所有修改的文件
3. **撤销操作**：可以使用 VSCode 的撤销功能 (`Ctrl+Z`) 恢复更改
4. **匹配准确性**：插件使用单词边界匹配，避免误替换部分匹配的字符串

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式编译
npm run watch

# 打包插件
npm run vscode:prepublish
```

## 许可证

MIT


