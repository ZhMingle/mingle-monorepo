// 车牌识别调试工具
// 在你的生产网站上运行这个代码来测试不同的图片

async function testOCRWithDifferentImages() {
  console.log('🔍 开始测试车牌识别...');

  // 测试图片列表（你可以添加更多）
  const testImages = [
    {
      name: '标准测试图片',
      url: 'https://example.com/license-plate.jpg', // 替换为实际的车牌图片URL
      description: '清晰的车牌照片',
    },
  ];

  for (const testImage of testImages) {
    console.log(`\n📷 测试图片: ${testImage.name}`);

    try {
      // 获取 access token
      const tokenResponse = await fetch('/api/baidu-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        console.log('❌ 无法获取 access token:', tokenData);
        continue;
      }

      console.log('✅ 获取到 access token');

      // 测试 OCR
      const ocrResponse = await fetch('/api/baidu-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: 'test_base64_data', // 这里需要实际的 base64 数据
          accessToken: tokenData.access_token,
        }),
      });

      const ocrData = await ocrResponse.json();
      console.log('🔍 OCR 响应:', ocrData);

      // 分析错误码
      if (ocrData.error_code) {
        switch (ocrData.error_code) {
          case 282103:
            console.log('❌ 282103: 目标识别错误 - 无法识别到车牌');
            console.log('💡 建议: 检查图片质量，确保车牌清晰可见');
            break;
          case 216201:
            console.log('❌ 216201: 图像格式错误');
            console.log('💡 建议: 检查图像格式和编码');
            break;
          case 110:
            console.log('❌ 110: Access token 无效');
            console.log('💡 建议: 检查 API 密钥配置');
            break;
          default:
            console.log(`❌ 未知错误: ${ocrData.error_code} - ${ocrData.error_msg}`);
        }
      } else {
        console.log('✅ 识别成功!', ocrData);
      }
    } catch (error) {
      console.log('❌ 测试出错:', error);
    }
  }
}

// 手动测试函数
async function testWithManualImage() {
  console.log('📷 请上传一张车牌图片进行测试...');

  // 创建文件输入
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📷 选择的文件:', file.name, file.size, 'bytes');

    // 转换为 base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      console.log('📷 Base64 长度:', base64.length);

      try {
        // 获取 token
        const tokenResponse = await fetch('/api/baidu-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          console.log('❌ 无法获取 access token:', tokenData);
          return;
        }

        // 调用 OCR
        const ocrResponse = await fetch('/api/baidu-ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            accessToken: tokenData.access_token,
          }),
        });

        const ocrData = await ocrResponse.json();
        console.log('🔍 识别结果:', ocrData);

        if (ocrData.words_result && ocrData.words_result.length > 0) {
          const plate = ocrData.words_result[0];
          console.log('✅ 识别成功!');
          console.log('🚗 车牌号:', plate.number);
          console.log('🎯 置信度:', plate.probability);
          console.log('🎨 颜色:', plate.color);
        } else {
          console.log('❌ 未识别到车牌');
          if (ocrData.error_code) {
            console.log('错误码:', ocrData.error_code);
            console.log('错误信息:', ocrData.error_msg);
          }
        }
      } catch (error) {
        console.log('❌ 测试出错:', error);
      }
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

// 运行测试
console.log('🚀 车牌识别调试工具已加载');
console.log('📝 使用方法:');
console.log('1. 运行 testOCRWithDifferentImages() 测试预设图片');
console.log('2. 运行 testWithManualImage() 手动上传图片测试');

// 自动运行手动测试
testWithManualImage();
