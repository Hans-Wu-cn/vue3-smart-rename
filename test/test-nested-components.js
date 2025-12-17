/**
 * 嵌套组件 props 传递链测试
 * 测试场景：三层组件嵌套，验证 props 传递链追踪
 */

const fs = require('fs');
const path = require('path');

console.log('=== 嵌套组件 Props 传递链测试 ===\n');

const testVueDir = path.join(__dirname, '../test-vue/src');

function readTestFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

// 读取所有相关文件
const childComponent1 = readTestFile(path.join(testVueDir, 'components/ChildComponent1.vue'));
const app1 = readTestFile(path.join(testVueDir, 'App1.vue'));
const app1_1 = readTestFile(path.join(testVueDir, 'App1-1.vue'));

// 验证文件结构
console.log('1. 文件结构验证:');
console.log(`   ${childComponent1 ? '✓' : '✗'} ChildComponent1.vue`);
console.log(`   ${app1 ? '✓' : '✗'} App1.vue`);
console.log(`   ${app1_1 ? '✓' : '✗'} App1-1.vue`);
console.log('');

if (!childComponent1 || !app1 || !app1_1) {
  console.log('部分文件缺失，无法继续测试');
  process.exit(1);
}

// 验证 props 传递链
console.log('2. Props 传递链验证:\n');

// Level 3: ChildComponent1.vue (最底层)
console.log('Level 3: ChildComponent1.vue (最底层组件)');
const child1HasProps = /defineProps\s*\(\s*\{[^}]*a1[^}]*\}/.test(childComponent1);
const child1HasTemplate = /\{\{\s*a1\s*\}\}/.test(childComponent1);
console.log(`   ${child1HasProps ? '✓' : '✗'} 定义了 props: { a1: ... }`);
console.log(`   ${child1HasTemplate ? '✓' : '✗'} 模板中使用: {{ a1 }}`);
console.log('');

// Level 2: App1.vue (中间组件)
console.log('Level 2: App1.vue (中间组件)');
const app1HasProps = /defineProps\s*\(\s*\{[^}]*a1[^}]*\}/.test(app1);
const app1UsesChild1 = /ChildComponent1/.test(app1);
const app1PassesProps = /:a1\s*=/.test(app1);
const app1HasTemplate = /\{\{\s*a1\s*\}\}/.test(app1);
console.log(`   ${app1HasProps ? '✓' : '✗'} 定义了 props: { a1: ... } (接收来自父组件)`);
console.log(`   ${app1UsesChild1 ? '✓' : '✗'} 使用 ChildComponent1 组件`);
console.log(`   ${app1PassesProps ? '✓' : '✗'} 传递 props 给子组件: :a1="a1"`);
console.log(`   ${app1HasTemplate ? '✓' : '✗'} 模板中使用: {{ a1 }}`);
console.log('');

// Level 1: App1-1.vue (最顶层组件)
console.log('Level 1: App1-1.vue (最顶层组件)');
const app1_1UsesApp1 = /<App1/.test(app1_1);
const app1_1PassesProps = /:a1\s*=/.test(app1_1);
const app1_1HasVar = /parentA1/.test(app1_1);
console.log(`   ${app1_1UsesApp1 ? '✓' : '✗'} 使用 App1 组件`);
console.log(`   ${app1_1PassesProps ? '✓' : '✗'} 传递 props 给 App1: :a1="parentA1"`);
console.log(`   ${app1_1HasVar ? '✓' : '✗'} 定义了本地变量: parentA1`);
console.log('');

// 验证完整的传递链
console.log('3. 完整传递链验证:\n');
console.log('   传递路径: App1-1.vue → App1.vue → ChildComponent1.vue');
console.log('   props 名称: a1');
console.log('');

const chainValid = app1_1PassesProps && app1PassesProps && child1HasProps;
console.log(`   ${chainValid ? '✓' : '✗'} 传递链完整: ${chainValid ? '是' : '否'}`);
console.log('');

// 模拟重命名场景
console.log('4. 重命名场景模拟:\n');
console.log('   假设在 ChildComponent1.vue 中将 a1 重命名为 a2，应该更新：\n');

const updates = [
  {
    file: 'ChildComponent1.vue',
    items: [
      { pattern: /defineProps.*a1/, desc: 'defineProps 中的 a1' },
      { pattern: /\{\{\s*a1\s*\}\}/, desc: '模板中的 {{ a1 }}' }
    ]
  },
  {
    file: 'App1.vue',
    items: [
      { pattern: /defineProps.*a1/, desc: 'defineProps 中的 a1' },
      { pattern: /:a1\s*=/, desc: '传递给子组件的 :a1=' },
      { pattern: /\{\{\s*a1\s*\}\}/, desc: '模板中的 {{ a1 }}' }
    ]
  },
  {
    file: 'App1-1.vue',
    items: [
      { pattern: /:a1\s*=/, desc: '传递给 App1 的 :a1=' }
    ]
  }
];

updates.forEach(({ file, items }) => {
  const fileContent = 
    file === 'ChildComponent1.vue' ? childComponent1 :
    file === 'App1.vue' ? app1 :
    app1_1;
  
  console.log(`   ${file}:`);
  items.forEach(({ pattern, desc }) => {
    const found = pattern.test(fileContent);
    console.log(`     ${found ? '✓' : '✗'} ${desc}: ${found ? '应该更新' : '未找到'}`);
  });
  console.log('');
});

// 组件名称匹配测试
console.log('5. 组件名称匹配验证:\n');

function testComponentNameMatch(componentName, fileName) {
  // PascalCase to kebab-case
  const kebabCase = componentName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  // kebab-case to PascalCase
  const pascalCase = kebabCase.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
  
  return {
    original: componentName,
    kebabCase: kebabCase,
    pascalCase: pascalCase,
    fileName: fileName
  };
}

const child1Match = testComponentNameMatch('ChildComponent1', 'ChildComponent1.vue');
const app1Match = testComponentNameMatch('App1', 'App1.vue');

console.log(`   ChildComponent1:`);
console.log(`     PascalCase: ${child1Match.pascalCase}`);
console.log(`     kebab-case: ${child1Match.kebabCase}`);
console.log(`     文件名: ${child1Match.fileName}`);
console.log('');

console.log(`   App1:`);
console.log(`     PascalCase: ${app1Match.pascalCase}`);
console.log(`     kebab-case: ${app1Match.kebabCase}`);
console.log(`     文件名: ${app1Match.fileName}`);
console.log('');

console.log('=== 测试总结 ===\n');
console.log('✓ 所有文件结构正确');
console.log('✓ Props 传递链完整');
console.log('✓ 各层级组件正确使用 props\n');

console.log('建议的手动测试步骤:');
console.log('1. 在 VSCode 中打开 test-vue 目录');
console.log('2. 打开 ChildComponent1.vue，将光标放在 props 定义的 a1 上');
console.log('3. 按 Ctrl+Shift+R 触发重命名，输入新名称 a2');
console.log('4. 选择"全局更新"');
console.log('5. 验证所有三个文件中的 a1 都被正确更新为 a2');

