// Vercel Serverless Function - Baidu License Plate OCR

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, accessToken } = req.body;

    if (!image || !accessToken) {
      return res.status(400).json({
        error: 'Image and access token are required',
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
        multi_detect: 'false',
      }),
    });

    const data = await response.json();

    if (data.error_code) {
      return res.status(400).json({
        error_code: data.error_code,
        error_msg: data.error_msg,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error performing OCR:', error);
    res.status(500).json({
      error: 'OCR failed',
      message: error.message,
    });
  }
}
