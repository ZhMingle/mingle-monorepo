# Environment Variables Setup Guide

This project uses environment variables to securely store API credentials and configuration settings. The project is designed for Vercel deployment using Serverless Functions.

## Local Development (Mock Mode)

For local development, you don't need any environment variables. The app will use mock data by default.

Simply run:

```bash
npm run dev
```

## Production Deployment (Vercel)

For production deployment with real Baidu AI API:

### Step 1: Get Baidu AI Credentials

1. Visit [Baidu AI Console](https://console.bce.baidu.com/ai/)
2. Create a new application or use an existing one
3. Navigate to the application details to find your API Key and Secret Key

### Step 2: Configure Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
Name: BAIDU_API_KEY
Value: your_baidu_api_key_here

Name: BAIDU_SECRET_KEY
Value: your_baidu_secret_key_here

Name: VITE_USE_MOCK_DATA
Value: false
```

### Step 3: Redeploy

- Go to **Deployments** and click **Redeploy**
- Or push a new commit to trigger automatic deployment

## Environment Variables Description

### For Vercel Dashboard

| Variable             | Description             | Required           | Default |
| -------------------- | ----------------------- | ------------------ | ------- |
| `BAIDU_API_KEY`      | Baidu AI API Key        | Yes (for real API) | -       |
| `BAIDU_SECRET_KEY`   | Baidu AI Secret Key     | Yes (for real API) | -       |
| `VITE_USE_MOCK_DATA` | Use mock data if "true" | No                 | true    |

### For Local Development (Optional)

You can create a `.env` file in the project root to override mock mode locally:

```bash
# .env (optional - for local development)
VITE_USE_MOCK_DATA=true
```

## Vercel Serverless Functions Architecture

```
User Request → Vercel → Serverless Function → Baidu AI API
                    ↓
                 Response
```

- **API Routes**: Located in `/api` directory
  - `/api/baidu-token.js` - Get Baidu access token
  - `/api/baidu-ocr.js` - License plate recognition
- **Security**: API keys stored in Vercel environment variables
- **No CORS**: Functions run on same domain as frontend

## Testing Locally with Vercel CLI (Optional)

If you want to test Serverless Functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Create local .env file for Vercel CLI
# vercel env pull .env.local

# Or manually create .env.local with your keys
# BAIDU_API_KEY=your_key
# BAIDU_SECRET_KEY=your_secret

# Run local development server
vercel dev
```

Note: For most development, mock mode is sufficient and faster.

## Important Security Notes

⚠️ **NEVER commit `.env` files to version control!**

- `.env` files are already added to `.gitignore`
- Always use Vercel Dashboard to manage production secrets
- Keep your API credentials secure
- Never hardcode API keys in your source code

## Environment Variables vs Mock Data

### Mock Data Mode (Default - Development)

```
VITE_USE_MOCK_DATA=true (or not set)
```

- ✅ No API keys needed
- ✅ No network requests
- ✅ Fast development
- ✅ Works offline
- ❌ Fake recognition results

### Real API Mode (Production)

```
VITE_USE_MOCK_DATA=false
+ BAIDU_API_KEY
+ BAIDU_SECRET_KEY
```

- ✅ Real AI recognition
- ✅ Accurate results
- ✅ Production-ready
- ❌ Requires API keys
- ❌ Uses Baidu API quota

## Deployment Checklist

Before deploying to production:

- [ ] Got Baidu AI credentials
- [ ] Added environment variables in Vercel Dashboard
- [ ] Set `VITE_USE_MOCK_DATA=false` in Vercel
- [ ] Tested local build with `npm run build`
- [ ] Pushed code to GitHub
- [ ] Deployed to Vercel
- [ ] Tested license plate recognition on production

## Troubleshooting

### Issue: "Server configuration error"

**Cause**: Baidu API credentials not configured in Vercel

**Solution**:

1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure `BAIDU_API_KEY` and `BAIDU_SECRET_KEY` are set
3. Redeploy the project

### Issue: License plate recognition not working

**Cause**: Either using mock mode or API error

**Solution**:

1. Check `VITE_USE_MOCK_DATA` is set to `false` in Vercel
2. Verify API credentials are correct
3. Check browser console for errors
4. View Vercel function logs in Functions tab

### Issue: Local development shows errors

**Cause**: Trying to use real API locally without configuration

**Solution**:

1. Use mock mode (default) for local development
2. Or install Vercel CLI and use `vercel dev`
3. Mock mode is recommended for faster development

## Learn More

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Detailed Vercel deployment guide
- [BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md) - Baidu AI setup (中文)
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---

**Summary**: For development use mock mode (no config needed). For production, deploy to Vercel and add API keys in Dashboard. Simple! 🚀
