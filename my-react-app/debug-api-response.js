// 调试 API 响应格式
// 在浏览器控制台运行

async function debugAPIResponse() {
  console.log('🔍 调试 API 响应格式...');

  try {
    // 1. 获取 token
    const tokenResponse = await fetch('/api/baidu-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const tokenData = await tokenResponse.json();
    console.log('✅ Token 获取成功:', tokenData);

    // 2. 创建测试图片
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');

    // 绘制车牌
    ctx.fillStyle = '#000080'; // 蓝色背景
    ctx.fillRect(50, 75, 300, 50);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QZN376', 200, 105);

    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    console.log('📷 测试图片已创建, Base64 长度:', base64.length);

    // 3. 调用 OCR API
    const ocrResponse = await fetch('/api/baidu-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        accessToken: tokenData.access_token,
      }),
    });

    const ocrData = await ocrResponse.json();
    console.log('🔍 原始 API 响应:', ocrData);

    // 4. 详细分析响应结构
    console.log('\n📋 响应结构分析:');
    console.log('- 响应类型:', typeof ocrData);
    console.log('- 响应键:', Object.keys(ocrData));

    if (ocrData.error_code) {
      console.log('- 错误码:', ocrData.error_code);
      console.log('- 错误信息:', ocrData.error_msg);
    }

    if (ocrData.words_result) {
      console.log('- words_result 存在:', !!ocrData.words_result);
      console.log('- words_result 类型:', typeof ocrData.words_result);
      console.log('- words_result 长度:', ocrData.words_result?.length);

      if (ocrData.words_result && ocrData.words_result.length > 0) {
        console.log('- 第一个结果:', ocrData.words_result[0]);
        console.log('- 第一个结果的键:', Object.keys(ocrData.words_result[0]));
      }
    }

    // 5. 测试我们的处理逻辑
    console.log('\n🔧 测试处理逻辑:');

    if (ocrData.error_code) {
      console.log('❌ 有错误码:', ocrData.error_code);
      if (ocrData.error_code === 282103) {
        console.log('→ 应该返回: 未识别到车牌');
      }
    } else if (ocrData.words_result && ocrData.words_result.length > 0) {
      console.log('✅ 有识别结果');
      const plateInfo = ocrData.words_result[0];
      console.log('→ 应该返回成功:', {
        success: true,
        plateNumber: plateInfo.number,
        confidence: plateInfo.probability || 0.9,
        color: plateInfo.color || 'unknown',
      });
    } else {
      console.log('⚠️ 没有识别结果');
      console.log('→ 应该返回: 未识别到车牌');
    }

    // 6. 测试服务层
    console.log('\n🎯 测试服务层实际返回:');
    try {
      const service = await import('./src/services/licensePlateService.js');
      const serviceResult = await service.default.recognizeLicensePlate(base64);
      console.log('服务层结果:', serviceResult);
    } catch (serviceError) {
      console.log('服务层错误:', serviceError);
    }
  } catch (error) {
    console.log('❌ 调试过程出错:', error);
  }
}

// 运行调试
debugAPIResponse();
