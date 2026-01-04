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
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/Users';
import AdminFiles from './pages/admin/Files';
import AdminPlans from './pages/admin/Plans';
import AdminCoupons from './pages/admin/Coupons';
import AdminTransactions from './pages/admin/Transactions';
import AdminSystemHealth from './pages/admin/SystemHealth';

// --- Protected Route Wrapper ---
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center text-zinc-900 dark:text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!isAuthenticated) {
    // Redirect to appropriate login page
    const loginPath = requireAdmin ? '/admin' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check admin role for admin routes
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

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

        {/* --- Admin Login (Public) --- */}
        <Route path="/admin" element={<AdminLogin />} />

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

        {/* --- Admin Dashboard Routes --- */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
        </Route>

        <Route path="/admin/users" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminUsers />} />
        </Route>

        <Route path="/admin/files" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminFiles />} />
        </Route>

        <Route path="/admin/plans" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminPlans />} />
        </Route>

        <Route path="/admin/coupons" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminCoupons />} />
        </Route>

        <Route path="/admin/transactions" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminTransactions />} />
        </Route>

        <Route path="/admin/health" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminSystemHealth />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}