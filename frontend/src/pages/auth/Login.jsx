import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Mail, Lock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Ensure your backend allows CORS from this origin
const API_URL = "http://localhost:8080/api/auth/login";

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

    try {
      const response = await axios.post(API_URL, { email, password });

      if (response.status === 200 && response.data.token) {
        const { token, email: userEmail, role, plan, planExpiry, dailyUsageCount } = response.data;

        // 1. Update Global Context State
        login(token, userEmail, role, plan, planExpiry, dailyUsageCount);

        // 2. Redirect based on role
        if (role === 'ADMIN') {
          navigate('/admin'); 
        } else {
          navigate('/'); // User Dashboard
        }
      } else {
        setError("Invalid response from server.");
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setError(err.response.data || "Your account has been banned. Please contact admin.");
      } else if (err.response && err.response.status === 401) {
        setError("Invalid email or access key.");
      } else {
        setError("Login failed. Check server connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter the secure credentials sent to your email."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-800"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Password (Access Key)</label>
            <Link to="/forgot-password" className="relative z-50 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">Lost access key?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-zinc-700 dark:focus:ring-zinc-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
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
          Don't have an account? <Link to="/register" className="font-medium text-zinc-900 underline hover:text-red-600 dark:text-white cursor-pointer pointer-events-auto">Request Access</Link>
        </p>
      </form>
    </AuthLayout>
  );
}