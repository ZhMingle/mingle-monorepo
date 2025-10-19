# Environment Variables Setup Guide

This project uses environment variables to securely store API credentials and configuration settings.

## Frontend Environment Variables

Create a `.env` file in the project root directory:

```bash
# .env
VITE_BACKEND_URL=http://localhost:3001
VITE_USE_MOCK_DATA=true
```

### Frontend Variables Description:

- `VITE_BACKEND_URL`: The URL of the backend proxy server (default: http://localhost:3001)
- `VITE_USE_MOCK_DATA`: Set to `true` to use mock data for development, `false` to use real Baidu API

## Backend Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# server/.env
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_SECRET_KEY=your_baidu_secret_key_here
PORT=3001
```

### Backend Variables Description:

- `BAIDU_API_KEY`: Your Baidu AI API Key
- `BAIDU_SECRET_KEY`: Your Baidu AI Secret Key
- `PORT`: The port number for the backend server (default: 3001)

## Getting Baidu AI Credentials

1. Visit [Baidu AI Console](https://console.bce.baidu.com/ai/)
2. Create a new application or use an existing one
3. Navigate to the application details to find your API Key and Secret Key
4. Copy the credentials to your `server/.env` file

## Important Security Notes

⚠️ **NEVER commit `.env` files to version control!**

- `.env` files are already added to `.gitignore`
- Always use `.env.example` or documentation to share required variables
- Keep your API credentials secret and secure

## Running the Application

### With Mock Data (Development):

```bash
# Frontend only
npm run dev
```

The application will use simulated license plate recognition.

### With Real Baidu API:

1. Set up backend `.env` with your Baidu credentials
2. Update frontend `.env`:
   ```
   VITE_USE_MOCK_DATA=false
   ```
3. Start the backend server:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. Start the frontend (in a new terminal):
   ```bash
   npm run dev
   ```

The application will now use real Baidu AI OCR for license plate recognition.

## Troubleshooting

### "Server configuration error"

- Make sure `BAIDU_API_KEY` and `BAIDU_SECRET_KEY` are set in `server/.env`
- Check that the backend server is running on the correct port

### "Failed to get access token"

- Verify your Baidu AI credentials are correct
- Check your Baidu AI account quota and status
- Ensure your network can access Baidu AI API

### CORS errors

- Make sure the backend server is running
- Check that `VITE_BACKEND_URL` in frontend `.env` matches the backend server URL
