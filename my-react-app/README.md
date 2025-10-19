# React Learning Project

A comprehensive React learning project featuring interactive components and modern development practices.

## 🚀 Features

- **Feedback System**: Interactive voting system for code review feedback
- **Article Sorting**: Dynamic table with sorting capabilities
- **Modern UI**: Built with Tailwind CSS and responsive design
- **React Router**: Client-side routing with sidebar navigation
- **Component Architecture**: Well-organized folder structure

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── Layout.jsx       # Main layout with sidebar
│   ├── Sidebar.jsx      # Navigation sidebar
│   └── Articles.jsx     # Articles table component
├── pages/               # Page components
│   ├── feedback/        # Feedback system page
│   │   ├── FeedbackPage.jsx
│   │   └── FeedbackPage.css
│   └── sort/           # Sort articles page
│       └── SortPage.jsx
└── App.jsx             # Main application
```

## 🛠️ Technologies Used

- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

## 🎯 Learning Points

### Feedback System
```js
// Array initialization
new Array(10).fill(0); // Initialize an array with zeros

// State management with useState
const [data, setData] = useState([0,0,0,0,0,0,0,0,0,0]);

// Prefer using ternary operator for conditional rendering
{isVisible ? <Component /> : null}
```

### Sort Functionality
```js
// Sort comparison function should return number, not boolean
const sorted = articles.sort((a, b) => b.upvotes - a.upvotes);

// Date comparison - convert string to Date object
const sorted = articles.sort(
  (a, b) => new Date(b.date) - new Date(a.date)
);
```

## 🚀 Getting Started

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

## 📱 Pages

### Feedback System (`/`)
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

- React hooks (useState, useEffect)
- Component composition and props
- React Router for navigation
- State management patterns
- Array methods and sorting
- Date handling in JavaScript
- CSS-in-JS with Tailwind
- Modern JavaScript features

## 🔧 Development Notes

- Use functional components with hooks
- Implement proper state management
- Follow React best practices
- Maintain clean component structure
- Use semantic HTML elements
- Implement accessibility features