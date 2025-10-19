# React Learning Project

A comprehensive React learning project featuring interactive components and modern development practices.

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

## 📁 Project Structure

```
my-react-app/
├── src/
│   ├── components/           # Reusable components
│   │   ├── Layout.jsx       # Main layout with sidebar
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   ├── Articles.jsx     # Articles table component
│   │   └── CameraCapture.jsx # Camera component for photos
│   ├── pages/               # Page components
│   │   ├── carwash/        # Car wash management page
│   │   │   ├── CarWashPage.jsx
│   │   │   └── CarWashPage.css
│   │   ├── feedback/        # Feedback system page
│   │   │   ├── FeedbackPage.jsx
│   │   │   └── FeedbackPage.css
│   │   └── sort/           # Sort articles page
│   │       └── SortPage.jsx
│   ├── services/           # Service layer
│   │   ├── licensePlateService.js  # Baidu AI OCR integration
│   │   └── dataStorage.js          # Local storage management
│   └── App.jsx             # Main application
├── server/                 # Backend proxy server
│   ├── index.js           # Express server for Baidu API
│   └── package.json       # Server dependencies
└── ENV_SETUP.md           # Environment variables guide
```

## 🛠️ Technologies Used

### Frontend

- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
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
const backendUrl = import.meta.env.VITE_BACKEND_URL;
```

### Backend Proxy Pattern

```js
// Server-side API proxy to avoid CORS
app.post('/api/baidu/token', async (req, res) => {
  const response = await fetch(baiduUrl);
  res.json(await response.json());
});

// Environment variables in Node.js
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.BAIDU_API_KEY;
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

For real license plate recognition using Baidu AI:

1. **Get Baidu AI Credentials**
   - Visit [Baidu AI Console](https://console.bce.baidu.com/ai/)
   - Create an application and get your API Key and Secret Key

2. **Configure Backend Environment**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your Baidu AI credentials
   npm install
   ```

3. **Configure Frontend Environment**

   ```bash
   # In project root
   cp .env.example .env
   # Edit .env and set VITE_USE_MOCK_DATA=false
   ```

4. **Start Backend Server**

   ```bash
   cd server
   npm run dev
   ```

5. **Start Frontend (in new terminal)**
   ```bash
   npm run dev
   ```

📖 For detailed setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md)

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
- **Dark Mode**: Automatic dark/light theme detection
- **Sidebar Navigation**: Clean navigation with icons
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

### Backend & Integration

- Node.js and Express server setup
- RESTful API design
- CORS handling
- Environment variables management
- Third-party API integration (Baidu AI)
- Token management and caching
- Error handling and fallbacks

### Best Practices

- Secure API key management
- Backend proxy pattern for CORS
- Graceful error handling
- Mock data for development
- Service layer architecture

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
- **Backend**: Uses dotenv for Node.js environment variables
- **API Keys**: Stored in `.env` files (never committed to version control)

### Environment Files Structure:

```
.env                    # Frontend config (in project root)
server/.env            # Backend config with Baidu AI credentials
```

**Important**:

- Never commit `.env` files to Git
- Use `.env.example` as a template
- Keep API credentials secure

## 🤖 Baidu AI Integration

This project integrates with Baidu AI Cloud for license plate recognition:

### Features:

- **OCR API**: Recognizes license plate numbers from images
- **High Accuracy**: Baidu's AI provides reliable recognition
- **Backend Proxy**: Secure API key management via Express server
- **Fallback Mode**: Mock data for development without API keys

### API Flow:

1. User captures/uploads license plate image
2. Frontend converts image to Base64
3. Backend proxy authenticates with Baidu AI
4. OCR service processes the image
5. License plate number returned to frontend

### Why Backend Proxy?

- **Security**: API keys stay on the server
- **CORS**: Avoids browser cross-origin restrictions
- **Token Management**: Caches access tokens (valid for 30 days)

📚 Learn more: [Baidu AI Documentation](https://ai.baidu.com/ai-doc/OCR/zk3h7xz52)

## 📝 License

This is a learning project for educational purposes.
