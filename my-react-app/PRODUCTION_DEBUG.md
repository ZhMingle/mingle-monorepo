# 🐛 Production Debugging Guide - License Plate Recognition

## Problem: Getting Wrong/Random Plate Numbers in Production

If you're seeing random plate numbers like `ABC123`, `DEF456`, `GHI789` in production, the app is using **mock data** instead of real Baidu AI OCR.

---

## 🔍 Quick Diagnosis Checklist

Follow these steps in order:

### Step 1: Check Browser Console

Open your production website and check the browser console (F12):

**Look for these messages:**

✅ **If you see**: `"Falling back to simulation mode"`

- This means the API call failed
- The app automatically used mock data as fallback

✅ **If you see**: `"Error getting access token"`

- The Baidu API token request failed
- Check Vercel environment variables

✅ **If you see**: Network errors for `/api/baidu-token` or `/api/baidu-ocr`

- Serverless Functions are failing
- Check Vercel Function logs

---

## 🛠️ Fix Step-by-Step

### Fix 1: Check Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Check Settings → Environment Variables**

   You MUST have these **THREE** variables:

   ```
   Name: BAIDU_API_KEY
   Value: [Your 24-character Baidu API Key]
   Applied to: Production, Preview, Development

   Name: BAIDU_SECRET_KEY
   Value: [Your 24-character Baidu Secret Key]
   Applied to: Production, Preview, Development

   Name: VITE_USE_MOCK_DATA
   Value: false
   Applied to: Production (at minimum)
   ```

3. **Critical: Check the value of `VITE_USE_MOCK_DATA`**

   ❌ **WRONG VALUES (will use mock data):**
   - `true`
   - `True`
   - `FALSE` (uppercase)
   - Empty/not set
   - Any value except lowercase `false`

   ✅ **CORRECT VALUE:**
   - `false` (lowercase, no quotes)

### Fix 2: Verify API Credentials

1. **Test your Baidu API Keys**

   Open terminal and run:

   ```bash
   # Replace YOUR_API_KEY and YOUR_SECRET_KEY with your actual keys
   curl -X POST "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=YOUR_API_KEY&client_secret=YOUR_SECRET_KEY"
   ```

   ✅ **Expected response** (keys are valid):

   ```json
   {
     "access_token": "24.xxxxx...",
     "expires_in": 2592000
   }
   ```

   ❌ **Error response** (keys are invalid):

   ```json
   {
     "error": "invalid_client",
     "error_description": "unknown client id"
   }
   ```

2. **If keys are invalid:**
   - Go to [Baidu AI Console](https://console.bce.baidu.com/ai/)
   - Check your application credentials
   - Copy the correct keys
   - Update Vercel environment variables

### Fix 3: Redeploy After Changes

**After updating environment variables, you MUST redeploy:**

1. **Option A: Trigger Redeploy in Vercel**
   - Go to Deployments tab
   - Click "..." menu on the latest deployment
   - Click "Redeploy"
   - ✅ Check "Use existing Build Cache" (faster)

2. **Option B: Push a New Commit**
   ```bash
   git commit --allow-empty -m "Trigger redeploy with correct env vars"
   git push
   ```

⚠️ **Important**: Environment variable changes don't take effect until you redeploy!

### Fix 4: Check Vercel Function Logs

1. **Go to your Vercel project**
2. **Click on "Functions" tab**
3. **Select a function** (`baidu-token` or `baidu-ocr`)
4. **View the logs**

**Look for errors:**

❌ `"Baidu API credentials not configured"`

- Environment variables not set

❌ `"Error getting Baidu access token"`

- API keys are wrong or network issue

❌ `"OCR failed"`

- Image format issue or API quota exceeded

---

## 🧪 Test Your Production Environment

After making changes, test the production deployment:

### Test 1: Check Environment Variables in Browser

Add this temporary code to your app to verify env vars:

```javascript
// In browser console on your production site
console.log('Mock mode:', import.meta.env.VITE_USE_MOCK_DATA);
console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL || 'using relative paths');
```

Expected output:

```
Mock mode: false
Backend URL: using relative paths
```

### Test 2: Test API Endpoints Directly

**Test Token Endpoint:**

```bash
# Replace YOUR_PRODUCTION_URL with your actual Vercel URL
curl -X POST https://YOUR_PRODUCTION_URL.vercel.app/api/baidu-token \
  -H "Content-Type: application/json"
```

✅ **Success response:**

```json
{
  "access_token": "24.xxxx...",
  "expires_in": 2592000
}
```

❌ **Error response:**

```json
{
  "error": "Server configuration error",
  "message": "Baidu API credentials not configured"
}
```

### Test 3: Upload a Clear License Plate Image

1. Go to your production site
2. Navigate to Car Wash page (`/carwash`)
3. Upload a **clear, high-quality** license plate photo
4. Check the result

**Tips for best results:**

- Use good lighting
- Clear focus on the plate
- Plate should be horizontal
- Minimum 200x200 pixels
- JPG or PNG format

---

## 📊 Common Issues & Solutions

### Issue 1: Always Getting Random Plates (ABC123, DEF456...)

**Cause:** App is using mock data

**Solution:**

1. Check `VITE_USE_MOCK_DATA` is set to `false` (lowercase)
2. Redeploy after changing
3. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Issue 2: "Server configuration error"

**Cause:** Baidu API credentials not set in Vercel

**Solution:**

1. Add `BAIDU_API_KEY` and `BAIDU_SECRET_KEY` in Vercel
2. Make sure they're applied to Production
3. Redeploy

### Issue 3: API Works Locally But Not in Production

**Cause:** Environment variables not synced

**Solution:**

1. Local `.env` file is different from Vercel settings
2. Set variables in Vercel Dashboard, not in code
3. Redeploy

### Issue 4: Inconsistent Results (Sometimes Works, Sometimes Mock)

**Cause:** API errors cause fallback to mock data

**Solution:**

1. Check Vercel Function logs for errors
2. Verify API quota not exceeded
3. Check image quality and format

### Issue 5: "No license plate detected"

**Cause:** Valid API response but plate not recognized

**Solution:**

- ✅ This is actually WORKING (real API)!
- The image quality is poor or no plate visible
- Try a clearer image
- This is different from mock data

---

## 🎯 Verification Checklist

After fixing, verify everything works:

- [ ] Vercel environment variables are set correctly
- [ ] `VITE_USE_MOCK_DATA=false` (lowercase)
- [ ] Baidu API keys are valid (tested with curl)
- [ ] Redeployed after changes
- [ ] Browser console shows no errors
- [ ] `/api/baidu-token` endpoint returns token
- [ ] Uploaded test image and got real recognition (not ABC123)
- [ ] Function logs show no errors

---

## 💡 How to Tell If It's Working

### Mock Data (NOT working):

```
Plate Number: ABC123, DEF456, GHI789, etc.
Confidence: Random between 70-100%
Always different random plates
```

### Real API (WORKING):

```
Plate Number: Actual recognized plate
Confidence: Real confidence score
Color: Blue, Yellow, etc.
Consistent results for same image
```

---

## 🆘 Still Not Working?

### Debug Output

Add this to your `licensePlateService.js` temporarily:

```javascript
async recognizeLicensePlate(imageBase64) {
  console.log('🔍 Debug - USE_MOCK_DATA:', USE_MOCK_DATA);
  console.log('🔍 Debug - VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
  console.log('🔍 Debug - Backend URL:', this.backendUrl);

  try {
    if (USE_MOCK_DATA) {
      console.log('⚠️ Using mock data mode');
      return this.simulateRecognition();
    }

    const token = await this.getAccessToken();
    console.log('🔍 Debug - Token obtained:', token ? 'Yes' : 'No');

    // ... rest of the code
  }
  // ...
}
```

Check the browser console for these debug messages.

### Contact Support

If still having issues:

1. **Check Vercel Function Logs**
   - Functions tab → baidu-token
   - Look for specific error messages

2. **Check Baidu API Usage**
   - Visit [Baidu Console](https://console.bce.baidu.com/ai/)
   - Check API call statistics
   - Verify quota not exceeded

3. **Verify Network**
   - Use browser DevTools → Network tab
   - Check if `/api/baidu-token` and `/api/baidu-ocr` are being called
   - Check response status codes

---

## 📚 Related Documents

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Complete Vercel deployment guide
- [BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md) - Baidu AI setup (中文)
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment variables guide

---

## ✅ Quick Fix Summary

Most common fix (90% of cases):

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add or update: `VITE_USE_MOCK_DATA` = `false` (lowercase)
4. Ensure `BAIDU_API_KEY` and `BAIDU_SECRET_KEY` are set
5. Deployments → Redeploy
6. Wait for deployment to complete
7. Hard refresh your browser (Ctrl+Shift+R)
8. Test with a clear license plate image

**That's it!** 🎉
