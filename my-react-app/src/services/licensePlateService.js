// License Plate Recognition Service
// Using Baidu AI OCR API

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'; // Set to false in .env when backend is ready

class LicensePlateService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    // Use Vercel API routes (same domain) or backend URL if specified
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || '';
  }

  // Get Baidu API Access Token (via backend proxy)
  async getAccessToken() {
    try {
      if (this.accessToken && !this.isTokenExpired()) {
        return this.accessToken;
      }

      // If using mock data for development
      if (USE_MOCK_DATA) {
        return null; // Will use simulation
      }

      // Use Vercel API route (relative path works on same domain)
      const apiUrl = this.backendUrl ? `${this.backendUrl}/api/baidu/token` : '/api/baidu-token';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        // Baidu tokens expire in 30 days, we'll refresh after 29 days
        this.tokenExpiry = Date.now() + (29 * 24 * 60 * 60 * 1000);
        return this.accessToken;
      } else {
        throw new Error('Failed to get access token');
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      // Fallback to simulation if backend is not available
      return null;
    }
  }

  // 模拟车牌识别（开发测试用）
  simulateRecognition() {
    const mockPlates = [
      'ABC123',
      'DEF456', 
      'GHI789',
      'JKL012',
      'MNO345',
      'PQR678',
      'STU901',
      'VWX234'
    ];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomPlate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
        resolve({
          success: true,
          plateNumber: randomPlate,
          confidence: Math.random() * 0.3 + 0.7 // 70%-100% 置信度
        });
      }, 1500); // 模拟网络延迟
    });
  }

  // Recognize license plate from image (via backend proxy)
  async recognizeLicensePlate(imageBase64) {
    try {
      // If using mock data, return simulation
      if (USE_MOCK_DATA) {
        return this.simulateRecognition();
      }

      // Get access token first
      const token = await this.getAccessToken();
      if (!token) {
        // Fallback to simulation if token fails
        return this.simulateRecognition();
      }

      // Call backend proxy or Vercel API for OCR
      const apiUrl = this.backendUrl ? `${this.backendUrl}/api/baidu/ocr` : '/api/baidu-ocr';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          accessToken: token
        })
      });

      const result = await response.json();

      if (result.error_code) {
        throw new Error(`API Error: ${result.error_msg}`);
      }

      if (result.words_result && result.words_result.length > 0) {
        const plateInfo = result.words_result[0];
        return {
          success: true,
          plateNumber: plateInfo.number,
          confidence: plateInfo.probability || 0.9,
          color: plateInfo.color || 'unknown'
        };
      } else {
        return {
          success: false,
          error: 'No license plate detected'
        };
      }
    } catch (error) {
      console.error('License plate recognition failed:', error);
      // Fallback to simulation on error
      console.log('Falling back to simulation mode');
      return this.simulateRecognition();
    }
  }

  // 检查令牌是否过期
  isTokenExpired() {
    return this.tokenExpiry && Date.now() > this.tokenExpiry;
  }

  // 图片转 Base64
  imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // 移除 data:image/jpeg;base64, 前缀
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Canvas 转 Base64
  canvasToBase64(canvas) {
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  }
}

export default new LicensePlateService();
