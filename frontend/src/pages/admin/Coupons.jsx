import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Loader2, AlertTriangle, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export default function Coupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount: 10,
        usageLimit: 100,
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/coupons');
            setCoupons(response.data);
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
            const msg = error.response?.data?.error || error.message || "Unknown error";
            toast.error(`Failed to load coupons: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/coupons', {
                code: newCoupon.code,
                discount: newCoupon.discount,
                usageLimit: newCoupon.usageLimit,
                validUntil: newCoupon.validUntil,
                validFrom: new Date(),
                // planType is not in Model but we can ignore or add if needed. Coupon model in backend treats it global.
            });

            toast.success(`Coupon ${newCoupon.code} created!`);
            setIsModalOpen(false);
            setNewCoupon({
                code: '',
                discount: 10,
                usageLimit: 100,
                validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            });
            fetchCoupons();
        } catch (error) {
            console.error("Failed to create coupon:", error);
            const msg = error.response?.data?.error || error.message || "Unknown error";
            toast.error(`Failed to create coupon: ${msg}`);
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (window.confirm('Delete this coupon?')) {
            try {
                await api.delete(`/admin/coupons/${id}`);
                setCoupons(coupons.filter(c => c.id !== id));
                toast.success("Coupon deleted");
            } catch (error) {
                console.error("Failed to delete coupon:", error);
                toast.error("Failed to delete coupon");
            }
        }
    };

    const getStatus = (coupon) => {
        const isExpired = new Date(coupon.validUntil) < new Date();
        const limitReached = coupon.usageLimit !== -1 && coupon.usedCount >= coupon.usageLimit;
        if (limitReached) return { text: "LIMIT REACHED", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20" };
        if (isExpired) return { text: "EXPIRED", color: "text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-700" };
        return { text: "ACTIVE", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20" };
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Coupon Manager</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Create and track discount campaigns.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" /> Create Coupon
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center shadow-sm">
                    <Ticket className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400">No coupons found. Create your first coupon to get started.</p>
                </div>
            ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Code</th>
                                <th className="px-6 py-4 font-medium">Discount</th>
                                <th className="px-6 py-4 font-medium">Usage</th>
                                <th className="px-6 py-4 font-medium">Expires</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {coupons.map((coupon) => {
                                const status = getStatus(coupon);
                                return (
                                    <tr key={coupon.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200 tracking-wide">{coupon.code}</span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">{coupon.discount}%</td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{coupon.usedCount} / {coupon.usageLimit === -1 ? '∞' : coupon.usageLimit}</td>
                                        <td className="px-6 py-4 text-zinc-500">{new Date(coupon.validUntil).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- CREATE COUPON MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Create New Coupon</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-white p-1 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-400">Code</label>
                                    <input
                                        type="text"
                                        value={newCoupon.code}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                        required
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                                        placeholder="STUDENT50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-400">Discount %</label>
                                    <input
                                        type="number"
                                        value={newCoupon.discount}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, discount: parseInt(e.target.value) || 0 })}
                                        min="1"
                                        max="100"
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-400">Max Uses</label>
                                    <input
                                        type="number"
                                        value={newCoupon.usageLimit}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: parseInt(e.target.value) || 100 })}
                                        min="1"
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-400">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={newCoupon.validUntil}
                                        onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check className="h-4 w-4" /> Create Coupon
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
