import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FeedbackPage from './pages/feedback/FeedbackPage';
import SortPage from './pages/sort/SortPage';
import CarWashPage from './pages/carwash/CarWashPage';
import CarHistoryPage from './pages/carwash/CarHistoryPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <>
              <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
                Code Review Feedback System
              </h1>
              <FeedbackPage />
            </>
          } />
          <Route path="sort" element={<SortPage />} />
          <Route path="carwash" element={<CarWashPage />} />
          <Route path="car-history" element={<CarHistoryPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;