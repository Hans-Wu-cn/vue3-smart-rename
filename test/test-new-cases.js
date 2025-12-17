/**
 * 新测试用例验证脚本
 * 测试场景：嵌套组件 props 传递链
 * - ChildComponent1.vue (定义了 props a1)
 * - App1.vue (接收 props a1，传递给 ChildComponent1)
 * - App1-1.vue (使用 App1，传递 props a1)
 */

const fs = require('fs');
const path = require('path');

console.log('=== 新测试用例验证 ===\n');

const testVueDir = path.join(__dirname, '../test-vue/src');

function readTestFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`无法读取文件 ${filePath}:`, error.message);
    return null;
  }
}

// 测试场景1: ChildComponent1.vue - 最底层组件
console.log('测试场景 1: ChildComponent1.vue (最底层组件)');
const childComponent1Path = path.join(testVueDir, 'components/ChildComponent1.vue');
const childComponent1 = readTestFile(childComponent1Path);

if (childComponent1) {
  // 检查 defineProps
  const hasDefineProps = childComponent1.includes('defineProps');
  console.log(`  ${hasDefineProps ? '✓' : '✗'} defineProps 定义: ${hasDefineProps ? '找到' : '未找到'}`);
  
  // 检查 props a1 定义
  const hasPropA1 = childComponent1.match(/defineProps\s*\([^)]*a1[^)]*\)/);
  console.log(`  ${hasPropA1 ? '✓' : '✗'} props 'a1' 定义: ${hasPropA1 ? '找到' : '未找到'}`);
  
  // 检查模板中使用
  const templateMatches = childComponent1.match(/\{\{\s*a1\s*\}\}/g);
  const templateCount = templateMatches ? templateMatches.length : 0;
  console.log(`  ${templateCount > 0 ? '✓' : '✗'} 模板中使用 {{ a1 }}: 找到 ${templateCount} 处`);
  
  console.log('');
} else {
  console.log('  ✗ 文件不存在\n');
}

// 测试场景2: App1.vue - 中间组件
console.log('测试场景 2: App1.vue (中间组件)');
const app1Path = path.join(testVueDir, 'App1.vue');
const app1 = readTestFile(app1Path);

if (app1) {
  // 检查是否使用 ChildComponent1
  const usesChildComponent1 = app1.includes('ChildComponent1');
  console.log(`  ${usesChildComponent1 ? '✓' : '✗'} 使用 ChildComponent1: ${usesChildComponent1 ? '找到' : '未找到'}`);
  
  // 检查是否有 props 定义（作为中间组件，应该接收 props）
  const hasDefineProps = app1.includes('defineProps');
  console.log(`  ${hasDefineProps ? '✓' : '✗'} defineProps 定义: ${hasDefineProps ? '找到' : '未找到'}`);
  
  // 检查是否有 props 绑定传递给子组件
  const hasPropBinding = app1.includes(':a1=') || app1.includes('v-bind:a1=');
  console.log(`  ${hasPropBinding ? '✓' : '✗'} 传递 props :a1= 给子组件: ${hasPropBinding ? '找到' : '未找到'}`);
  
  // 检查模板中使用
  const usesInTemplate = app1.includes('{{ a1 }}');
  console.log(`  ${usesInTemplate ? '✓' : '✗'} 模板中使用 {{ a1 }}: ${usesInTemplate ? '找到' : '未找到'}`);
  
  console.log('');
} else {
  console.log('  ✗ 文件不存在\n');
}

// 测试场景3: App1-1.vue - 最顶层组件
console.log('测试场景 3: App1-1.vue (最顶层组件)');
const app1_1Path = path.join(testVueDir, 'App1-1.vue');
const app1_1 = readTestFile(app1_1Path);

if (app1_1) {
  // 检查是否使用 App1
  const usesApp1 = app1_1.includes('<App1') || app1_1.includes('<app1');
  console.log(`  ${usesApp1 ? '✓' : '✗'} 使用 App1 组件: ${usesApp1 ? '找到' : '未找到'}`);
  
  // 检查是否有 props 绑定
  const hasPropBinding = app1_1.includes(':a1=') || app1_1.includes('v-bind:a1=');
  console.log(`  ${hasPropBinding ? '✓' : '✗'} 传递 props :a1= 给 App1: ${hasPropBinding ? '找到' : '未找到'}`);
  
  // 检查是否有本地变量
  const hasLocalVar = app1_1.includes('parentA1');
  console.log(`  ${hasLocalVar ? '✓' : '✗'} 本地变量 parentA1: ${hasLocalVar ? '找到' : '未找到'}`);
  
  // 检查变量定义
  const hasVarDef = app1_1.includes('const parentA1') || app1_1.includes('let parentA1') || app1_1.includes('var parentA1');
  console.log(`  ${hasVarDef ? '✓' : '✗'} parentA1 变量定义: ${hasVarDef ? '找到' : '未找到'}`);
  
  console.log('');
} else {
  console.log('  ✗ 文件不存在\n');
}

// 测试场景4: 验证完整的 props 传递链
console.log('测试场景 4: 验证完整的 props 传递链');
console.log('  当在 ChildComponent1.vue 中将 a1 重命名为 a2 时：\n');

const chainTest = {
  'App1-1.vue': {
    file: app1_1,
    shouldUpdate: ':a1="parentA1"',
    expected: ':a2="parentA1"'
  },
  'App1.vue': {
    file: app1,
    shouldUpdate: ['defineProps({ a1:', ':a1="a1"', '{{ a1 }}'],
    expected: ['defineProps({ a2:', ':a2="a2"', '{{ a2 }}']
  },
  'ChildComponent1.vue': {
    file: childComponent1,
    shouldUpdate: ['defineProps({ a1:', '{{ a1 }}'],
    expected: ['defineProps({ a2:', '{{ a2 }}']
  }
};

Object.entries(chainTest).forEach(([fileName, test]) => {
  if (!test.file) {
    console.log(`  ✗ ${fileName}: 文件不存在`);
    return;
  }
  
  console.log(`  ${fileName}:`);
  if (Array.isArray(test.shouldUpdate)) {
    test.shouldUpdate.forEach((pattern, index) => {
      const found = test.file.includes(pattern);
      console.log(`    ${found ? '✓' : '✗'} 应更新: ${pattern} → ${test.expected[index]}`);
    });
  } else {
    const found = test.file.includes(test.shouldUpdate);
    console.log(`    ${found ? '✓' : '✗'} 应更新: ${test.shouldUpdate} → ${test.expected}`);
  }
  console.log('');
});

// 组件关联检查
console.log('测试场景 5: 组件关联检查');
console.log('  检查组件名称匹配：\n');

const componentChecks = [
  {
    name: 'ChildComponent1',
    fileName: 'ChildComponent1.vue',
    variants: ['ChildComponent1', 'child-component1', 'childComponent1']
  },
  {
    name: 'App1',
    fileName: 'App1.vue',
    variants: ['App1', 'app1', 'app-1']
  }
];

componentChecks.forEach(check => {
  console.log(`  ${check.name} (${check.fileName}):`);
  console.log(`    PascalCase: ${check.variants[0]}`);
  console.log(`    kebab-case: ${check.variants[1]}`);
  console.log(`    camelCase: ${check.variants[2]}`);
  console.log('');
});

console.log('=== 测试总结 ===');
console.log('\n这个测试场景验证了嵌套组件的 props 传递链：');
console.log('App1-1.vue → App1.vue → ChildComponent1.vue');
console.log('\n当在 ChildComponent1.vue 中重命名 props a1 时，插件应该：');
console.log('1. 更新 ChildComponent1.vue 中所有 a1 的引用');
console.log('2. 更新 App1.vue 中所有 a1 的引用（props 定义、传递、模板使用）');
console.log('3. 更新 App1-1.vue 中传递给 App1 的 props 绑定');
console.log('\n提示: 请在 VSCode 中手动测试这个场景以确保插件正常工作。');

