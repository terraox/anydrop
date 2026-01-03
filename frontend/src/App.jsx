import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import DashboardLayout from './layout/DashboardLayout';
import AdminLayout from './layout/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import Orbit from './pages/user/Orbit';
import History from './pages/user/History';
import Devices from './pages/user/Devices';
import Pricing from './pages/user/Pricing';
import Checkout from './pages/user/Checkout';
import Settings from './pages/user/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth(); // Assuming user object has role
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-900 dark:text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NOTE: In a real app, check user.role here for Admin routes
  // for now we just allow access if authenticated

  return children;
};

export default function App() {
  return (
    <>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />

        {/* --- User Dashboard Routes --- */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Orbit />} />
          <Route path="history" element={<History />} />
          <Route path="devices" element={<Devices />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* --- Admin Routes --- */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          {/* Add more admin routes here like /admin/users if needed */}
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}