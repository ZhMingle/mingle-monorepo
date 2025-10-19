// 测试中文过滤功能
// 在浏览器控制台运行

async function testChineseFilter() {
  console.log('🧪 测试中文过滤功能...');

  try {
    // 1. 获取 token
    const tokenResponse = await fetch('/api/baidu-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const tokenData = await tokenResponse.json();
    console.log('✅ Token 获取成功');

    // 2. 创建测试图片 - 包含中文和英文数字
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // 白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 600, 300);

    // 绘制中文文字
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('车牌识别测试', 50, 50);
    ctx.fillText('中国车牌', 50, 100);

    // 绘制英文车牌
    ctx.fillStyle = 'blue';
    ctx.fillRect(50, 150, 200, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('ABC123', 130, 190);

    // 绘制带空格的新西兰车牌
    ctx.fillStyle = 'green';
    ctx.fillRect(300, 150, 200, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('PI AB', 370, 190);

    // 绘制另一个新西兰车牌
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 220, 200, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('XY 123', 120, 260);

    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    console.log('📷 测试图片已创建，包含中文和英文车牌');

    // 3. 调用通用 OCR
    const ocrResponse = await fetch('/api/baidu-general-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        accessToken: tokenData.access_token,
      }),
    });

    const ocrData = await ocrResponse.json();
    console.log('🔍 原始 OCR 结果:', ocrData);

    if (ocrData.words_result) {
      console.log('\n📋 所有识别到的文字:');
      ocrData.words_result.forEach((item, index) => {
        console.log(`${index + 1}. "${item.words}"`);
      });

      // 4. 测试过滤逻辑
      console.log('\n🔍 过滤测试:');
      const plateTexts = ocrData.words_result
        .map(item => item.words)
        .filter(text => {
          const cleanText = text.replace(/\s/g, '').toUpperCase();
          const hasChinese = /[\u4e00-\u9fff]/.test(cleanText);
          const platePattern = /^[A-Z0-9\s]{3,8}$/;
          const isValid = platePattern.test(cleanText);
          const hasNonSpace = /[A-Z0-9]/.test(cleanText);

          console.log(`"${text}" -> "${cleanText}"`);
          console.log(`  - 包含中文: ${hasChinese}`);
          console.log(`  - 符合车牌格式: ${isValid}`);
          console.log(`  - 包含字母数字: ${hasNonSpace}`);
          console.log(`  - 结果: ${!hasChinese && isValid && hasNonSpace ? '✅ 保留' : '❌ 过滤'}`);

          return !hasChinese && isValid && hasNonSpace;
        });

      console.log('\n🎯 过滤后的车牌:');
      plateTexts.forEach((plate, index) => {
        console.log(`${index + 1}. ${plate}`);
      });

      if (plateTexts.length > 0) {
        console.log('\n✅ 中文过滤功能正常工作！');
        console.log(`最佳车牌: ${plateTexts.reduce((a, b) => (a.length > b.length ? a : b))}`);
      } else {
        console.log('\n⚠️ 没有找到有效的英文车牌');
      }
    }
  } catch (error) {
    console.log('❌ 测试出错:', error);
  }
}

// 运行测试
testChineseFilter();
