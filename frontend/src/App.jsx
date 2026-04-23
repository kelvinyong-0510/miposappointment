import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }) {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
