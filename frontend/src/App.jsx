import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage    from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<BookingPage />} />
        <Route path="/login"   element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
