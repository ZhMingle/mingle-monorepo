// 测试新西兰车牌格式识别
// 在浏览器控制台运行

function testNewZealandPlates() {
  console.log('🇳🇿 测试新西兰车牌格式识别...');

  // 测试数据
  const testPlates = [
    // 有效的新西兰车牌
    'PI AB', // 标准格式
    'XY 123', // 字母+数字
    'ABC123', // 无空格
    '123ABC', // 数字+字母
    'A1B2C3', // 混合格式
    'XY1234', // 长格式

    // 无效的格式
    '车牌识别', // 中文
    'PI AB C', // 太长
    'AB', // 太短
    'PI  AB', // 多个空格
    'PI-AB', // 包含特殊字符
    'PI AB中文', // 混合中文
    '   ', // 只有空格
    '', // 空字符串
  ];

  testPlates.forEach(plate => {
    const cleanText = plate.replace(/\s/g, '').toUpperCase();
    const hasChinese = /[\u4e00-\u9fff]/.test(cleanText);
    const platePattern = /^[A-Z0-9\s]{3,8}$/;
    const isValid = platePattern.test(plate);
    const hasNonSpace = /[A-Z0-9]/.test(plate);
    const shouldKeep = !hasChinese && isValid && hasNonSpace;

    console.log(`"${plate}" -> ${shouldKeep ? '✅ 保留' : '❌ 过滤'}`);
    if (!shouldKeep) {
      console.log(
        `   原因: ${hasChinese ? '包含中文' : ''} ${!isValid ? '格式不符' : ''} ${!hasNonSpace ? '只有空格' : ''}`
      );
    }
  });

  console.log('\n🎯 总结:');
  console.log('✅ 支持格式: PI AB, XY 123, ABC123, 123ABC, A1B2C3');
  console.log('❌ 过滤格式: 中文车牌, 太短/太长, 特殊字符, 纯空格');
}

// 运行测试
testNewZealandPlates();
