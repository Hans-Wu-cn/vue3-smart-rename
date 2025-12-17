## Languages / 语言

- [English README](./README.md)
- [简体中文 README](./README_ZH.md)

# VSCode Vue3 Smart Rename Extension

An intelligent rename extension designed specifically for Vue 3 projects.  
It automatically synchronizes updates of component props, functions, and variable names across all references in your project.

## Features

### 1. Synchronized updates for component props and functions

When the name of a Vue 3 component’s exposed prop or function changes, the extension automatically finds and updates all usages of that component in the project:

- ✅ Supports `defineProps` – component props declaration
- ✅ Supports `defineEmits` – component events declaration
- ✅ Supports `defineExpose` – exposed methods and properties
- ✅ Supports Options API `props` and `emits`
- ✅ Automatically detects cross‑file references and performs global updates

### 2. Synchronized updates within a single file

When a variable or function name changes within a file, the extension updates all references in that file:

- ✅ Supports normal variables and functions
- ✅ Supports Vue template interpolation `{{ variable }}`
- ✅ Supports Vue directive bindings (`:prop`, `v-bind`, `v-model`, `v-slot`, etc.)
- ✅ Supports event bindings (`@event`, `v-on`)

## How to Use

### Basic usage

1. **Place cursor on the symbol to rename**: put the caret on a variable, function, or component prop name.
2. **Trigger the command**:
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac), or
   - Open Command Palette (`Ctrl+Shift+P`) and search for “智能同步更新变量/函数名” (Smart Sync Rename).
3. **Enter the new name** in the input box.
4. **Choose the update scope**:
   - If cross‑file references are detected, the extension will automatically perform a global update.
   - If no clear cross‑file references are detected, you can choose either **“Only update current file”** or **“Global update”**.

### Examples

#### Example 1: Renaming component props

**Component definition** (`ChildComponent.vue`):
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

**Parent component usage** (`ParentComponent.vue`):
```vue
<template>
  <ChildComponent :selectedIds="ids" />
</template>
```

When you rename `selectedIds` to `selectedItems` in `ChildComponent.vue`, the extension will automatically update:
- ✅ The `defineProps` declaration in `ChildComponent.vue`
- ✅ `:selectedIds="ids"` → `:selectedItems="ids"` in `ParentComponent.vue`

#### Example 2: Renaming variables inside a file

**File content**:
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

When you place the cursor on `userName` and rename it to `user`, the extension will automatically update:
- ✅ `const user = ref('John')`
- ✅ `{{ user }}`
- ✅ All references inside `<script setup>`

#### Example 3: Renaming component events

**Child component** (`ChildComponent.vue`):
```vue
<script setup>
const emit = defineEmits(['updateValue'])
</script>
```

**Parent component** (`ParentComponent.vue`):
```vue
<template>
  <ChildComponent @updateValue="handleUpdate" />
</template>
```

When you rename `updateValue` to `valueUpdated`, the extension will automatically update:
- ✅ `defineEmits(['valueUpdated'])`
- ✅ `@valueUpdated="handleUpdate"`

## Supported Vue 3 Syntax

### Props binding
- `:propName="value"` – shorthand binding
- `v-bind:propName="value"` – full syntax
- `v-model:propName="value"` – two‑way binding
- `propName="value"` – static binding

### Template syntax
- `{{ variable }}` – interpolation
- `{{ obj.property }}` – object property access

### Event binding
- `@eventName="handler"` – shorthand syntax
- `v-on:eventName="handler"` – full syntax

### Slot syntax
- `v-slot:slotName` – named slot
- `#slotName` – shorthand for named slot

## Implementation Details

### Symbol detection
- Uses VS Code’s Language Server Protocol (LSP) to get symbol definitions and references.
- Combines text search to make sure all references are found, including those in templates.

### Component relationship analysis
- Supports converting between PascalCase and kebab‑case component names.
- Analyzes component usage graph to track prop passing.

### Smart update scope
- Automatically detects whether a symbol is exported.
- Distinguishes between single‑file and cross‑file references.
- Provides options for the user to choose the update scope.

## Notes

1. **Workspace requirement**: the extension requires a VS Code workspace; make sure project files are opened in the same workspace.
2. **File saving**: global updates will automatically save all modified files.
3. **Undo**: you can use VS Code’s undo (`Ctrl+Z`) to revert changes.
4. **Matching accuracy**: the extension uses word‑boundary matching to avoid partially replacing similar strings.

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode compile
npm run watch

# Package extension
npm run vscode:prepublish
```

## License

MIT

