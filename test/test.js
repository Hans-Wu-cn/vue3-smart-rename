// 测试文件：用于验证插件的智能重命名功能

// 测试1：当前文件内的变量重命名
let testVar = 10;
console.log(testVar);
function useTestVar() {
  return testVar * 2;
}

// 测试2：当前文件内的函数重命名
function testFunction() {
  return 'test';
}
console.log(testFunction());
const result = testFunction();

// 测试3：导出函数，用于跨文件测试
export function exportedFunction() {
  return 'exported';
}

export const exportedVar = 'exported variable';
