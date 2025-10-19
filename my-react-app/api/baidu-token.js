// Vercel Serverless Function - Get Baidu Access Token

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
    const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;

    if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Baidu API credentials not configured'
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

    res.status(200).json({
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
}

