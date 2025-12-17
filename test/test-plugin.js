/**
 * 插件功能测试脚本
 * 用于验证智能重命名功能是否正确工作
 */

const fs = require('fs');
const path = require('path');

// 测试用例目录
const testVueDir = path.join(__dirname, '../test-vue/src');

console.log('=== VSCode Vue3 智能重命名插件测试 ===\n');

// 读取测试文件
function readTestFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`无法读取文件 ${filePath}:`, error.message);
    return null;
  }
}

// 测试场景1: 检查 ChildComponent 中的 props 定义
console.log('测试场景 1: 检查子组件 props 定义');
const childComponentPath = path.join(testVueDir, 'components/ChildComponent.vue');
const childComponent = readTestFile(childComponentPath);

if (childComponent) {
  // 检查是否有 defineProps
  const hasDefineProps = childComponent.includes('defineProps');
  console.log(`  ✓ defineProps 定义: ${hasDefineProps ? '找到' : '未找到'}`);
  
  // 检查是否有 props 名称 a1
  const hasPropA1 = childComponent.includes('a1:') || childComponent.match(/['"]a1['"]/);
  console.log(`  ✓ props 'a1' 定义: ${hasPropA1 ? '找到' : '未找到'}`);
  
  // 检查模板中使用
  const hasTemplateUsage = childComponent.includes('{{ a1 }}');
  console.log(`  ✓ 模板中使用 {{ a1 }}: ${hasTemplateUsage ? '找到' : '未找到'}`);
  
  console.log('');
}

// 测试场景2: 检查父组件中的 props 传递
console.log('测试场景 2: 检查父组件 props 传递');
const appPath = path.join(testVueDir, 'App.vue');
const appComponent = readTestFile(appPath);

if (appComponent) {
  // 检查是否有组件使用
  const hasComponentUsage = appComponent.includes('<ChildComponent');
  console.log(`  ✓ 使用 ChildComponent: ${hasComponentUsage ? '找到' : '未找到'}`);
  
  // 检查是否有 props 绑定
  const hasPropBinding = appComponent.includes(':a1=') || appComponent.includes('v-bind:a1=');
  console.log(`  ✓ props 绑定 :a1=: ${hasPropBinding ? '找到' : '未找到'}`);
  
  // 检查父组件变量
  const hasParentVar = appComponent.includes('parentA1');
  console.log(`  ✓ 父组件变量 parentA1: ${hasParentVar ? '找到' : '未找到'}`);
  
  console.log('');
}

// 测试场景3: 验证插件应该能识别的模式
console.log('测试场景 3: 验证插件识别模式');
console.log('  应该能够识别以下模式：');

const patterns = [
  {
    name: 'defineProps 对象语法',
    pattern: /defineProps\s*\(\s*\{[^}]*a1[^}]*\}/,
    description: 'defineProps({ a1: { type: ... } })'
  },
  {
    name: 'defineProps 数组语法',
    pattern: /defineProps\s*\(\s*\[[^\]]*['"]a1['"][^\]]*\]/,
    description: "defineProps(['a1'])"
  },
  {
    name: 'Vue props 绑定',
    pattern: /[:]\s*a1\s*=/,
    description: ':a1="value"'
  },
  {
    name: '模板插值',
    pattern: /\{\{\s*a1\s*\}\}/,
    description: '{{ a1 }}'
  }
];

patterns.forEach(({ name, pattern, description }) => {
  let found = false;
  if (childComponent && pattern.test(childComponent)) {
    found = true;
  } else if (appComponent && pattern.test(appComponent)) {
    found = true;
  }
  console.log(`  ${found ? '✓' : '✗'} ${name} (${description}): ${found ? '找到' : '未找到'}`);
});

console.log('\n=== 测试总结 ===');
console.log('这些测试验证了测试用例的基本结构。');
console.log('要完整测试插件功能，请在 VSCode 中：');
console.log('1. 安装插件 (api-tracking-0.0.1.vsix)');
console.log('2. 打开 test-vue 目录');
console.log('3. 在 ChildComponent.vue 中将光标放在 a1 上');
console.log('4. 按 Ctrl+Shift+R 触发重命名');
console.log('5. 输入新名称（如 a2）');
console.log('6. 选择"全局更新"');
console.log('7. 验证 App.vue 中的 :a1= 是否同步更新为 :a2=');

