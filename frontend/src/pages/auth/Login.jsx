import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// FIXED: Go up two levels to find components
import AuthLayout from '../../layout/AuthLayout';
import { Mail, Lock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Use dynamic API URL from centralized config

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock login removed - using real backend API now

    try {
      console.log('🔐 Attempting login for:', email);
      console.log('📡 API Base URL:', api.defaults.baseURL);
      console.log('🌐 Current Origin:', window.location.origin);
      console.log('🔗 Full URL:', window.location.href);

      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response received:', response.status);

      if (response.status === 200 && response.data.token) {
        // Extract all fields, including the new Identity fields
        const {
          token,
          email: userEmail,
          role,
          plan,
          username, // New Gamertag
          avatar    // New Pixel Avatar URL
        } = response.data;

        // 1. Update Global Context State with Identity Data
        console.log("Login successful! Token:", token);
        // alert(`DEBUG: Login Success! \nToken: ${token.substring(0, 10)}...`);

        try {
          login(token, {
            email: userEmail,
            role,
            plan,
            username,
            avatar
          });
          // alert("DEBUG: Context Updated. Redirecting...");
        } catch (e) {
          console.error("Context update failed:", e);
          alert("DEBUG: Context update failed: " + e.message);
        }

        // 2. Redirect all users to User Dashboard (Orbit)
        // This ensures admins can access the user portal when logging in from the main page.
        navigate('/');
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          setError("Invalid email or password.");
        } else if (err.response.status === 403) {
          setError(err.response.data?.message || "Access denied. Your account may be suspended.");
        } else if (err.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          const errorMessage = err.response.data?.message ||
            (typeof err.response.data === 'string' ? err.response.data : null) ||
            `Server Error: ${err.response.status}`;
          setError(errorMessage);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError("Unable to connect to server. Please ensure the backend is running on port 8080.");
      } else {
        // Error setting up the request
        setError(err.message || "Login failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access the command center."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none transition-all 
                focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 
                dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="relative z-50 text-xs text-zinc-400 hover:text-brand-500 transition-colors cursor-pointer">
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none transition-all 
                focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 
                dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all 
            hover:bg-zinc-800 hover:shadow-lg hover:shadow-brand-500/20
            disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </button>

        <p className="text-center text-xs text-zinc-500 mt-4 relative z-50 pointer-events-auto">
          Don't have an account?
          <Link to="/register" className="ml-1 font-medium text-zinc-900 underline hover:text-brand-600 dark:text-white cursor-pointer transition-colors">
            Register Now
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}