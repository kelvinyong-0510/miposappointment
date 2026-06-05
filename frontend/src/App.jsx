import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage    from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import Kiosk          from './pages/Kiosk';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<BookingPage />} />
        <Route path="/kiosk"   element={<Kiosk />} />
        <Route path="/login"   element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
