// Backend proxy server for Baidu AI API
// This server handles API calls to avoid CORS issues

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Baidu AI credentials from environment variables
const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Get Baidu Access Token
app.post('/api/baidu/token', async (req, res) => {
  try {
    // Check if credentials are configured
    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Baidu API credentials are not configured. Please set BAIDU_API_KEY and BAIDU_SECRET_KEY in .env file.'
      });
    }

    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        error: data.error,
        error_description: data.error_description
      });
    }

    res.json({
      access_token: data.access_token,
      expires_in: data.expires_in
    });

  } catch (error) {
    console.error('Error getting Baidu access token:', error);
    res.status(500).json({ 
      error: 'Failed to get access token',
      message: error.message 
    });
  }
});

// License Plate OCR
app.post('/api/baidu/ocr', async (req, res) => {
  try {
    const { image, accessToken } = req.body;

    if (!image || !accessToken) {
      return res.status(400).json({ 
        error: 'Image and access token are required' 
      });
    }

    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate?access_token=${accessToken}`;
    
    const response = await fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image: image,
        multi_detect: 'false'
      })
    });

    const data = await response.json();

    if (data.error_code) {
      return res.status(400).json({
        error_code: data.error_code,
        error_msg: data.error_msg
      });
    }

    res.json(data);

  } catch (error) {
    console.error('Error performing OCR:', error);
    res.status(500).json({ 
      error: 'OCR failed',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

