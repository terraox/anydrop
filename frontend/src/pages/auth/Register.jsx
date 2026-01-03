import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from "../../layout/AuthLayout";
import { Mail, User, Building2, Phone, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_URL = "http://localhost:8080/api/auth/register";

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(API_URL, formData);

            if (response.status === 200 || response.status === 201) {
                setSuccess(true);
                // After a brief delay, redirect to login
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.response?.data) {
                setError(typeof err.response.data === 'string' ? err.response.data : 'Registration failed.');
            } else {
                setError('Registration failed. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Success State (Neon Mint Theme) ---
    if (success) {
        return (
            <AuthLayout
                title="Request Submitted!"
                subtitle="We'll review your application and send credentials to your email."
            >
                <div className="text-center space-y-6 py-4">
                    <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20 animate-pulse">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            Check your inbox soon.
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            You will be redirected to the login page shortly...
                        </p>
                    </div>

                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors"
                    >
                        Go to Login <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Request Access"
            subtitle="Join the network. Fill in your details to get started."
        >
            <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Name Field */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none transition-all
                                focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 
                                dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
                        />
                    </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none transition-all
                                focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 
                                dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
                        />
                    </div>
                </div>

                {/* Company Field */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Company (Optional)</label>
                    <div className="relative group">
                        <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="text"
                            name="company"
                            placeholder="Acme Inc."
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-zinc-200 bg-white/50 pl-10 py-2.5 text-sm outline-none transition-all
                                focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 
                                dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white dark:focus:border-brand-500 dark:focus:ring-brand-500/10"
                        />
                    </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Phone (Optional)</label>
                    <div className="relative group">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
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
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            Request Access <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                    )}
                </button>

                <p className="text-center text-xs text-zinc-500 mt-4 relative z-50 pointer-events-auto">
                    Already have an account?
                    <Link to="/login" className="ml-1 font-medium text-zinc-900 underline hover:text-brand-600 dark:text-white cursor-pointer transition-colors">
                        Sign In
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}