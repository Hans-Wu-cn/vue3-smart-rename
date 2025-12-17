/**
 * 核心功能测试 - 验证插件的关键逻辑
 */

// 模拟测试数据
const testCases = [
  {
    name: '测试用例1: defineProps 对象语法识别',
    componentContent: `
<template>
  <div>{{ a1 }}</div>
</template>
<script setup>
const props = defineProps({
  a1: {
    type: String,
    default: ''
  }
})
</script>`,
    parentContent: `
<template>
  <ChildComponent :a1="value" />
</template>`,
    symbolName: 'a1',
    shouldDetectAsExported: true,
    shouldFindInParent: true
  },
  {
    name: '测试用例2: defineProps 数组语法识别',
    componentContent: `
<template>
  <div>{{ selectedIds }}</div>
</template>
<script setup>
const props = defineProps(['selectedIds'])
</script>`,
    parentContent: `
<template>
  <ChildComponent :selectedIds="ids" />
</template>`,
    symbolName: 'selectedIds',
    shouldDetectAsExported: true,
    shouldFindInParent: true
  },
  {
    name: '测试用例3: 模板插值识别',
    componentContent: `
<template>
  <div>
    <p>{{ userName }}</p>
    <span>{{ userName }} 元</span>
  </div>
</template>
<script setup>
const userName = ref('John')
</script>`,
    symbolName: 'userName',
    shouldFindInTemplate: true,
    expectedMatches: 2  // 应该找到2处使用
  }
];

// 测试函数：检查 defineProps 识别
function testDefinePropsDetection(content, symbolName) {
  const patterns = [
    // 对象语法：defineProps({ propName: ... })
    new RegExp(`defineProps\\s*\\([^)]*['"]?${symbolName}['"]?\\s*:`, 'i'),
    // 数组语法：defineProps(['propName'])
    new RegExp(`defineProps\\s*\\([^)]*['"]${symbolName}['"]`, 'i'),
    // 更宽松的匹配
    new RegExp(`defineProps[^)]*\\b${symbolName}\\b`, 'i')
  ];
  
  return patterns.some(pattern => pattern.test(content));
}

// 测试函数：检查模板中的引用
function testTemplateUsage(content, symbolName) {
  const patterns = [
    // 插值：{{ symbolName }}
    new RegExp(`{{\\s*[^}]*\\b${symbolName}\\b[^}]*}}`, 'gi'),
    // props 绑定：:symbolName=
    new RegExp(`[:]\\s*${symbolName}\\s*=`, 'gi'),
    // v-bind:symbolName=
    new RegExp(`v-bind:${symbolName}\\s*=`, 'gi')
  ];
  
  const matches = [];
  patterns.forEach(pattern => {
    pattern.lastIndex = 0; // 重置正则表达式
    const patternMatches = content.match(pattern);
    if (patternMatches) {
      matches.push(...patternMatches);
    }
  });
  
  return { found: matches.length > 0, count: matches.length, matches };
}

// 运行测试
console.log('=== 核心功能测试 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  
  if (testCase.shouldDetectAsExported !== undefined) {
    const detected = testDefinePropsDetection(testCase.componentContent, testCase.symbolName);
    const passed = detected === testCase.shouldDetectAsExported;
    console.log(`   ${passed ? '✓' : '✗'} Props 导出检测: ${detected ? '检测到' : '未检测到'} (期望: ${testCase.shouldDetectAsExported ? '检测到' : '未检测到'})`);
  }
  
  if (testCase.shouldFindInParent) {
    const parentResult = testTemplateUsage(testCase.parentContent, testCase.symbolName);
    const passed = parentResult.found === testCase.shouldFindInParent;
    console.log(`   ${passed ? '✓' : '✗'} 父组件引用查找: ${parentResult.found ? '找到' : '未找到'} ${parentResult.count}处 (期望: 找到)`);
    if (parentResult.matches.length > 0) {
      console.log(`     匹配项: ${parentResult.matches.join(', ')}`);
    }
  }
  
  if (testCase.shouldFindInTemplate) {
    const templateResult = testTemplateUsage(testCase.componentContent, testCase.symbolName);
    const passed = templateResult.count >= (testCase.expectedMatches || 1);
    console.log(`   ${passed ? '✓' : '✗'} 模板引用查找: 找到 ${templateResult.count}处 (期望: >= ${testCase.expectedMatches || 1})`);
    if (templateResult.matches.length > 0) {
      console.log(`     匹配项: ${templateResult.matches.join(', ')}`);
    }
  }
  
  console.log('');
});

// 测试实际文件
console.log('=== 实际文件测试 ===\n');

const fs = require('fs');
const path = require('path');

const testVueDir = path.join(__dirname, '../test-vue/src');

// 读取实际测试文件
const childComponentPath = path.join(testVueDir, 'components/ChildComponent.vue');
const appPath = path.join(testVueDir, 'App.vue');

try {
  const childComponent = fs.readFileSync(childComponentPath, 'utf-8');
  const appComponent = fs.readFileSync(appPath, 'utf-8');
  
  console.log('测试实际文件: ChildComponent.vue');
  const propsDetected = testDefinePropsDetection(childComponent, 'a1');
  console.log(`  ${propsDetected ? '✓' : '✗'} Props 'a1' 导出检测: ${propsDetected ? '检测到' : '未检测到'}`);
  
  const templateResult = testTemplateUsage(childComponent, 'a1');
  console.log(`  ${templateResult.found ? '✓' : '✗'} 模板中使用 'a1': 找到 ${templateResult.count}处`);
  if (templateResult.matches.length > 0) {
    templateResult.matches.forEach(match => {
      console.log(`     - ${match.trim()}`);
    });
  }
  
  console.log('\n测试实际文件: App.vue');
  const parentResult = testTemplateUsage(appComponent, 'a1');
  console.log(`  ${parentResult.found ? '✓' : '✗'} Props 绑定 ':a1=': ${parentResult.found ? '找到' : '未找到'}`);
  if (parentResult.matches.length > 0) {
    parentResult.matches.forEach(match => {
      console.log(`     - ${match.trim()}`);
    });
  }
  
} catch (error) {
  console.error('读取测试文件失败:', error.message);
}

console.log('\n=== 测试完成 ===');
console.log('\n提示: 这些测试验证了模式匹配逻辑。');
console.log('要完整测试插件，请在 VSCode 中安装并运行插件进行实际重命名操作。');

