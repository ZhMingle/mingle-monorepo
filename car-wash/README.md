# React Learning Project

A comprehensive React learning project featuring interactive components and modern development practices, deployed on Vercel.

## 🚀 Features

- **Car Wash Management System**: License plate recognition with service tracking
  - 📸 Camera capture for license plate photos
  - 🤖 AI-powered license plate recognition (Baidu AI OCR)
  - 📝 Service record management
  - 💾 Local data storage
- **Feedback System**: Interactive voting system for code review feedback
- **Article Sorting**: Dynamic table with sorting capabilities
- **Modern UI**: Built with Tailwind CSS and responsive design
- **React Router**: Client-side routing with sidebar navigation
- **Component Architecture**: Well-organized folder structure
- **PWA Support**: Progressive Web App capabilities

## 📁 Project Structure

```
my-react-app/
├── api/                    # Vercel Serverless Functions
│   ├── baidu-token.js     # Get Baidu API token
│   └── baidu-ocr.js       # License plate OCR
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx    # Main layout with sidebar
│   │   ├── Sidebar.jsx   # Navigation sidebar
│   │   ├── BottomNav.jsx # Mobile bottom navigation
│   │   ├── Articles.jsx  # Articles table component
│   │   └── CameraCapture.jsx # Camera component
│   ├── pages/            # Page components
│   │   ├── carwash/     # Car wash management
│   │   ├── feedback/    # Feedback system
│   │   └── sort/        # Sort articles
│   ├── services/        # Service layer
│   │   ├── licensePlateService.js  # OCR integration
│   │   └── dataStorage.js          # Local storage
│   └── App.jsx          # Main application
└── ...
```

## 🛠️ Technologies Used

### Frontend

- **React 19** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Ant Design Mobile** - Mobile UI components
- **PWA** - Progressive Web App features

### Backend

- **Vercel Serverless Functions** - API endpoints
- **Baidu AI OCR** - License plate recognition API

### APIs & Services

- **Baidu AI Cloud** - OCR and image recognition
- **MediaDevices API** - Camera access for photo capture
- **LocalStorage API** - Client-side data persistence

## 🎯 Learning Points

### Car Wash / License Plate Recognition

```js
// Camera API integration
navigator.mediaDevices.getUserMedia({ video: true });

// Convert image to Base64
const reader = new FileReader();
reader.readAsDataURL(file);
const base64 = reader.result.split(',')[1];

// Service layer pattern for API calls
class LicensePlateService {
  async recognizeLicensePlate(imageBase64) {
    // API logic with error handling and fallbacks
  }
}

// Environment variables in Vite
const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
```

### Vercel Serverless Functions

```js
// Serverless function for API proxy
export default async function handler(req, res) {
  const apiKey = process.env.BAIDU_API_KEY;
  const response = await fetch(baiduUrl);
  res.json(await response.json());
}
```

### Feedback System

```js
// Array initialization
new Array(10).fill(0); // Initialize an array with zeros

// State management with useState
const [data, setData] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

// Prefer using ternary operator for conditional rendering
{
  isVisible ? <Component /> : null;
}
```

### Sort Functionality

```js
// Sort comparison function should return number, not boolean
const sorted = articles.sort((a, b) => b.upvotes - a.upvotes);

// Date comparison - convert string to Date object
const sorted = articles.sort((a, b) => new Date(b.date) - new Date(a.date));
```

## 🚀 Getting Started

### Quick Start (Mock Data Mode)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start development server**

   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:5173
   ```

The application will run with simulated license plate recognition (no API key required).

### Full Setup (Real Baidu AI Integration)

For real license plate recognition using Baidu AI on Vercel:

1. **Get Baidu AI Credentials**
   - Visit [Baidu AI Console](https://console.bce.baidu.com/ai/)
   - Create an application and get your API Key and Secret Key

2. **Deploy to Vercel**
   - Push your code to GitHub
   - Connect repository to Vercel
   - Vercel will auto-detect and deploy

3. **Configure Environment Variables in Vercel**
   - Go to your project settings on Vercel
   - Add environment variables:
     ```
     BAIDU_API_KEY=your_api_key
     BAIDU_SECRET_KEY=your_secret_key
     VITE_USE_MOCK_DATA=false
     ```

4. **Redeploy**
   - Trigger a redeploy in Vercel
   - Your app now uses real AI recognition!

📖 For detailed setup instructions, see:

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel deployment guide
- [BAIDU_AI_SETUP_CN.md](./BAIDU_AI_SETUP_CN.md) - Baidu AI setup (中文)

## 📱 Pages

### Car Wash Management (`/carwash`)

- 📸 Camera capture for license plate photos
- 🤖 AI-powered license plate recognition (Baidu OCR)
- 📝 Service record tracking (engine oil, tires, wipers, etc.)
- 💾 Local storage for service history
- 📤 Image upload support
- ✍️ Manual license plate entry option

### Feedback System (`/feedback`)

- Interactive voting system
- Real-time vote counting
- Responsive card layout
- Dark mode support

### Sort Articles (`/sort`)

- Dynamic table with sorting
- Sort by upvotes or date
- Sample data included
- Modern table design

## 🎨 UI Features

- **Responsive Design**: Works on all screen sizes
- **Mobile-First**: Optimized for mobile with bottom navigation
- **Dark Mode**: Automatic dark/light theme detection
- **Sidebar Navigation**: Clean navigation with icons (desktop)
- **Bottom Navigation**: Mobile-friendly navigation bar
- **Hover Effects**: Interactive button and card animations
- **Modern Styling**: Professional Tailwind CSS design

## 📚 Learning Outcomes

### Frontend

- React hooks (useState, useEffect)
- Component composition and props
- React Router for navigation
- State management patterns
- Array methods and sorting
- Date handling in JavaScript
- CSS-in-JS with Tailwind
- Modern JavaScript features
- Camera/Media API integration
- File handling and image processing
- Base64 encoding/decoding
- Progressive Web Apps (PWA)
- Mobile UI patterns

### Backend & Integration

- Vercel Serverless Functions
- RESTful API design
- Environment variables management
- Third-party API integration (Baidu AI)
- Token management and caching
- Error handling and fallbacks

### Best Practices

- Secure API key management
- Serverless architecture
- Graceful error handling
- Mock data for development
- Service layer architecture
- Mobile-first responsive design

## 🔧 Development Notes

- Use functional components with hooks
- Implement proper state management
- Follow React best practices
- Maintain clean component structure
- Use semantic HTML elements
- Implement accessibility features

## 🔐 Security & Environment Variables

This project uses environment variables to securely manage API credentials:

- **Frontend**: Uses Vite's environment variables (`VITE_*`)
- **Serverless Functions**: Environment variables managed by Vercel
- **API Keys**: Never exposed to the browser

### Environment Variables:

```bash
# Development (.env file - not committed)
VITE_USE_MOCK_DATA=true    # Use mock data for development

# Production (Vercel Dashboard)
BAIDU_API_KEY=your_key
BAIDU_SECRET_KEY=your_secret
VITE_USE_MOCK_DATA=false
```

**Important**:

- Never commit `.env` files to Git
- Use Vercel Dashboard for production secrets
- Keep API credentials secure

## 🤖 Baidu AI Integration

This project integrates with Baidu AI Cloud for license plate recognition:

### Features:

- **OCR API**: Recognizes license plate numbers from images
- **High Accuracy**: Baidu's AI provides reliable recognition
- **Serverless Architecture**: Secure API key management via Vercel Functions
- **Fallback Mode**: Mock data for development without API keys

### API Flow:

```
User → Frontend → Vercel Function → Baidu AI → Response
```

1. User captures/uploads license plate image
2. Frontend converts image to Base64
3. Vercel Function authenticates with Baidu AI
4. OCR service processes the image
5. License plate number returned to frontend

### Why Serverless Functions?

- **Security**: API keys stay on the server
- **No CORS Issues**: Same domain for frontend and API
- **Auto-scaling**: Vercel handles traffic automatically
- **Free Tier**: Generous free usage limits

📚 Learn more: [Baidu AI Documentation](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)

## 🚀 Deployment

This project is optimized for Vercel deployment:

- **Automatic Builds**: Push to GitHub triggers deployment
- **Serverless Functions**: API endpoints automatically deployed
- **Environment Variables**: Managed in Vercel Dashboard
- **Custom Domains**: Easy to configure
- **HTTPS**: Automatic SSL certificates

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed deployment instructions.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 📝 License

This is a learning project for educational purposes.

## 🙏 Acknowledgments

- Baidu AI Cloud for OCR API
- Vercel for hosting platform
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
