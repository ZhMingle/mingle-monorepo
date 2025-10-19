// 调试清晰图片识别问题
// 在浏览器控制台运行这个代码

async function debugClearImage() {
  console.log('🔍 开始调试清晰图片识别问题...');

  try {
    // 1. 检查环境变量
    console.log('📋 环境变量检查:');
    console.log('- VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
    console.log('- VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);

    // 2. 测试 token 获取
    console.log('\n🔑 测试 Token 获取:');
    const tokenResponse = await fetch('/api/baidu-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const tokenData = await tokenResponse.json();
    console.log('Token 响应:', tokenData);

    if (!tokenData.access_token) {
      console.log('❌ 无法获取 token:', tokenData);
      return;
    }

    // 3. 创建测试图片 (模拟你上传的图片)
    console.log('\n📷 创建测试图片:');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // 绘制白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);

    // 绘制黑色矩形模拟车牌
    ctx.fillStyle = 'black';
    ctx.fillRect(100, 400, 200, 50);

    // 绘制白色文字 "QZN376"
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QZN376', 200, 430);

    // 转换为 base64
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    console.log('图片 Base64 长度:', base64.length);
    console.log('图片 Base64 预览:', base64.substring(0, 100) + '...');

    // 4. 测试 OCR API
    console.log('\n🔍 测试 OCR API:');
    const ocrResponse = await fetch('/api/baidu-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        accessToken: tokenData.access_token,
      }),
    });

    const ocrData = await ocrResponse.json();
    console.log('OCR 响应:', ocrData);

    // 5. 分析结果
    if (ocrData.error_code) {
      console.log('\n❌ 错误分析:');
      switch (ocrData.error_code) {
        case 282103:
          console.log('282103: 目标识别错误');
          console.log('可能原因: 图片中没有车牌或车牌不清晰');
          console.log('建议: 检查图片质量和车牌是否明显');
          break;
        case 216201:
          console.log('216201: 图像格式错误');
          console.log('可能原因: Base64 编码问题或图片格式不支持');
          console.log('建议: 检查图片编码和格式');
          break;
        case 110:
          console.log('110: Access token 无效');
          console.log('可能原因: Token 过期或 API 密钥错误');
          console.log('建议: 检查 API 密钥配置');
          break;
        default:
          console.log(`未知错误: ${ocrData.error_code} - ${ocrData.error_msg}`);
      }
    } else if (ocrData.words_result && ocrData.words_result.length > 0) {
      console.log('\n✅ 识别成功!');
      ocrData.words_result.forEach((plate, index) => {
        console.log(`车牌 ${index + 1}:`, plate.number);
        console.log(`置信度: ${(plate.probability * 100).toFixed(2)}%`);
        console.log(`颜色: ${plate.color || '未知'}`);
      });
    } else {
      console.log('\n⚠️ 未识别到车牌');
      console.log('可能原因: 图片中没有明显的车牌');
    }

    // 6. 测试服务层
    console.log('\n🔧 测试服务层:');
    const service = await import('./src/services/licensePlateService.js');
    const serviceResult = await service.default.recognizeLicensePlate(base64);
    console.log('服务层结果:', serviceResult);
  } catch (error) {
    console.log('❌ 调试过程出错:', error);
  }
}

// 运行调试
debugClearImage();
