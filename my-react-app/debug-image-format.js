// Quick test to debug image format issues
// Run this in your browser console on your production site

async function testImageFormat() {
  console.log('🔍 Testing image format...');

  // Create a simple test image (1x1 pixel)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 1, 1);

  // Convert to base64
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  console.log('📷 Test image base64 length:', base64.length);
  console.log('📷 Test image base64 preview:', base64.substring(0, 50) + '...');

  // Test the API
  try {
    // Get token
    const tokenResponse = await fetch('/api/baidu-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const tokenData = await tokenResponse.json();
    console.log('🔑 Token response:', tokenData);

    if (tokenData.access_token) {
      // Test OCR with our test image
      const ocrResponse = await fetch('/api/baidu-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          accessToken: tokenData.access_token,
        }),
      });
      const ocrData = await ocrResponse.json();
      console.log('🔍 OCR response:', ocrData);

      if (ocrData.error_code === 216201) {
        console.log('❌ Image format error - this is expected for a 1x1 pixel image');
        console.log('✅ But it means your API is working correctly!');
      } else {
        console.log('✅ Image format is OK');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testImageFormat();
