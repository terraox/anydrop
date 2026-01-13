import React, { useState, useEffect } from 'react';
import { Save, Check, Loader2, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export default function Plans() {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Free Tier Config
    const [freeMaxFileSize, setFreeMaxFileSize] = useState(100);
    const [freeDailyLimit, setFreeDailyLimit] = useState(3);
    const [freeStorageLimit, setFreeStorageLimit] = useState(1);
    const [freePrice, setFreePrice] = useState(0);

    // Pro Tier Config
    const [proMaxFileSize, setProMaxFileSize] = useState(2048);
    const [proStorageLimit, setProStorageLimit] = useState(50);
    const [proPriorityProcessing, setProPriorityProcessing] = useState(true);
    const [proDailyLimit, setProDailyLimit] = useState(-1);
    const [proPrice, setProPrice] = useState(9.99);

    const fetchConfigs = async () => {
        try {
            const res = await api.get('/admin/plans/config');
            const free = res.data.free;
            const pro = res.data.pro;
            setFreeMaxFileSize(free.maxFileSizeMB || 100);
            setFreeDailyLimit(free.dailyTransferLimit ?? 3);
            setFreeStorageLimit(free.storageLimitGB || 1);
            setFreePrice(free.monthlyPrice ?? 0);

            setProMaxFileSize(pro.maxFileSizeMB || 2048);
            setProDailyLimit(pro.dailyTransferLimit ?? -1);
            setProStorageLimit(pro.storageLimitGB || 50);
            setProPriorityProcessing(!!pro.priorityProcessing);
            setProPrice(pro.monthlyPrice ?? 9.99);
        } catch (e) {
            console.error('Failed to load plan configs', e);
            toast.error('Failed to load plan configs');
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Save FREE plan config
            await api.put('/admin/plans/config', {
                planName: 'FREE',
                maxFileSizeMB: freeMaxFileSize,
                dailyTransferLimit: freeDailyLimit,
                storageLimitGB: freeStorageLimit,
                priorityProcessing: false,
                monthlyPrice: freePrice,
            });

            // Save PRO plan config
            await api.put('/admin/plans/config', {
                planName: 'PRO',
                maxFileSizeMB: proMaxFileSize,
                dailyTransferLimit: proDailyLimit,
                storageLimitGB: proStorageLimit,
                priorityProcessing: proPriorityProcessing,
                monthlyPrice: proPrice,
            });

            setSaved(true);
            toast.success("Configuration saved successfully!");
            setTimeout(() => setSaved(false), 2000);
            // Refresh configs to show updated values
            await fetchConfigs();
        } catch (e) {
            console.error('Failed to save plan configs', e);
            toast.error('Failed to save plan configs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Plans & Configuration</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Configure limits for Free and Pro tiers.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 h-10 rounded-lg bg-violet-600 px-6 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-sm"
                >
                    {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check className="h-4 w-4" /> Saved</>
                    ) : (
                        <><Save className="h-4 w-4" /> Save Changes</>
                    )}
                </button>
            </div>

            {saved && (
                <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">Configuration saved successfully! Changes are now active.</p>
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
                {/* FREE TIER CONFIG */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Free Tier Limits</h3>
                        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Default</span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Price (₹/month)</label>
                            <input
                                type="number"
                                value={freePrice}
                                onChange={(e) => setFreePrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Free plan price (should remain 0).</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Max File Size (MB)</label>
                            <input
                                type="number"
                                value={freeMaxFileSize}
                                onChange={(e) => setFreeMaxFileSize(parseInt(e.target.value) || 100)}
                                min="10"
                                max="500"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Files larger than this will be rejected for free users.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily Transfer Limit</label>
                            <input
                                type="number"
                                value={freeDailyLimit}
                                onChange={(e) => setFreeDailyLimit(parseInt(e.target.value) || 3)}
                                min="1"
                                max="100"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Maximum transfers per day for free users.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Storage Limit (GB)</label>
                            <input
                                type="number"
                                value={freeStorageLimit}
                                onChange={(e) => setFreeStorageLimit(parseInt(e.target.value) || 1)}
                                min="1"
                                max="10"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Total storage available for free users.</p>
                        </div>
                    </div>
                </div>

                {/* PRO TIER CONFIG */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-zinc-900 p-6 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="h-24 w-24 text-amber-500" />
                    </div>
                    <div className="mb-6 flex items-center justify-between relative z-10">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Pro Tier Limits</h3>
                        <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-500">Premium</span>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Price (₹/month)</label>
                            <input
                                type="number"
                                value={proPrice}
                                onChange={(e) => setProPrice(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Pro monthly subscription price.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Max File Size (MB)</label>
                            <input
                                type="number"
                                value={proMaxFileSize}
                                onChange={(e) => setProMaxFileSize(parseInt(e.target.value) || 2048)}
                                min="100"
                                max="10240"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Maximum file size for Pro users (up to 10 GB).</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily Transfer Limit</label>
                            <input
                                type="number"
                                value={proDailyLimit}
                                onChange={(e) => setProDailyLimit(parseInt(e.target.value) || -1)}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Set to -1 for unlimited daily transfers.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Storage Limit (GB)</label>
                            <input
                                type="number"
                                value={proStorageLimit}
                                onChange={(e) => setProStorageLimit(parseInt(e.target.value) || 50)}
                                min="10"
                                max="500"
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none shadow-sm"
                            />
                            <p className="text-xs text-zinc-500">Total storage available for Pro users.</p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                            <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Priority Processing</p>
                                <p className="text-xs text-zinc-500">Faster queue processing for Pro users</p>
                            </div>
                            <button
                                onClick={() => setProPriorityProcessing(!proPriorityProcessing)}
                                className={`relative w-11 h-6 rounded-full transition-all ${proPriorityProcessing ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${proPriorityProcessing ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
