# Backend Proxy Server

This is a Node.js/Express backend server that acts as a proxy for Baidu AI OCR API to handle license plate recognition.

## Purpose

The backend server is necessary to:

- Avoid CORS (Cross-Origin Resource Sharing) issues when calling Baidu AI API from the browser
- Keep API credentials secure on the server side
- Handle authentication token management

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in this directory with your Baidu AI credentials:

```bash
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_SECRET_KEY=your_baidu_secret_key_here
PORT=3001
```

**How to get Baidu AI credentials:**

1. Visit https://console.bce.baidu.com/ai/
2. Create or select an application
3. Find your API Key and Secret Key in the application details

### 3. Run the Server

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in .env)

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Get Access Token

```
POST /api/baidu/token
```

Gets an access token from Baidu AI. Tokens are valid for 30 days.

### License Plate OCR

```
POST /api/baidu/ocr
```

Performs license plate recognition on a base64-encoded image.

Request body:

```json
{
  "image": "base64_encoded_image",
  "accessToken": "baidu_access_token"
}
```

Response:

```json
{
  "words_result": [
    {
      "number": "ABC123",
      "probability": 0.95,
      "color": "blue"
    }
  ]
}
```

## Security Notes

- Never commit the `.env` file to version control
- Keep your API credentials secure
- In production, use proper authentication and rate limiting
- Consider using HTTPS in production

## Troubleshooting

**Server won't start:**

- Check that the port is not already in use
- Verify Node.js is installed (version 14+ recommended)

**API calls fail:**

- Verify your Baidu AI credentials in `.env`
- Check your Baidu AI account quota
- Ensure your network can reach Baidu AI servers
