import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, CreditCard, Loader2, Tag } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NumberTicker from '../../components/magicui/NumberTicker';
import api from '../../services/api';
import { toast } from 'sonner';

export default function Pricing() {
    const { user, isAuthenticated, login } = useAuth();
    const [searchParams] = useSearchParams();

    // Config State
    const [freeLimit, setFreeLimit] = useState(3);
    const [freeMaxFileSize, setFreeMaxFileSize] = useState(10);
    const [proMaxFileSize, setProMaxFileSize] = useState(100);

    // UI State
    const [isAnnual, setIsAnnual] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, [searchParams]);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/tools/config');
            const configs = response.data;

            configs.forEach(config => {
                switch (config.configKey) {
                    case 'FREE_TIER_LIMIT':
                        setFreeLimit(parseInt(config.configValue) || 3);
                        break;
                    case 'FREE_MAX_FILE_SIZE':
                        setFreeMaxFileSize(parseInt(config.configValue) || 10);
                        break;
                    case 'PRO_MAX_FILE_SIZE':
                        setProMaxFileSize(parseInt(config.configValue) || 100);
                        break;
                    default:
                        break;
                }
            });
        } catch (error) {
            console.error('Failed to fetch config', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isPro = user?.plan === 'PRO';
    const isFree = user?.plan === 'FREE' || !isAuthenticated;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300 relative">
            <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">

                {isLoading ? (
                    <div className="mx-auto max-w-4xl text-center space-y-4">
                        <Skeleton className="h-4 w-20 mx-auto" />
                        <Skeleton className="h-12 w-3/4 mx-auto" />
                        <Skeleton className="h-6 w-1/2 mx-auto" />

                        <div className="mt-8 flex justify-center items-center gap-4">
                            <Skeleton className="h-6 w-48 rounded-full" />
                        </div>

                        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-y-8 sm:mt-10 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
                            <Skeleton className="h-[500px] w-full rounded-3xl" />
                            <Skeleton className="h-[500px] w-full rounded-3xl" />
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="text-base font-semibold leading-7 text-violet-600 dark:text-violet-400">Pricing</h2>
                            <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                                Simple, transparent bandwidth
                            </p>
                            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                                Choose the plan that's right for you. No hidden fees, cancel anytime.
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center items-center gap-4">
                            <span className={`text-sm font-semibold ${!isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Monthly</span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${isAnnual ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            >
                                <span
                                    className={`${isAnnual ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                            <span className={`text-sm font-semibold ${isAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                Yearly <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Save 17%</span>
                            </span>
                        </div>

                        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-y-8 sm:mt-10 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">

                            {/* FREE TIER */}
                            <div className={`rounded-3xl p-8 ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl ${isFree && isAuthenticated ? 'ring-2 ring-violet-500' : ''}`}>
                                <h3 className="text-lg font-semibold leading-8 text-zinc-900 dark:text-white">Free</h3>
                                <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-400">Perfect for quick, one-off tasks.</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">₹0</span>
                                    <span className="text-sm font-semibold leading-6 text-zinc-700 dark:text-zinc-400">/{isAnnual ? 'year' : 'month'}</span>
                                </p>
                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-400">
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600" /> {freeLimit} Tasks per day</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600" /> {freeMaxFileSize}MB Max File Size</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600" /> Standard Processing Speed</li>
                                    <li className="flex gap-x-3 text-zinc-500 dark:text-zinc-600"><X className="h-6 w-5 flex-none" /> No Advanced Tools</li>
                                    <li className="flex gap-x-3 text-zinc-500 dark:text-zinc-600"><X className="h-6 w-5 flex-none" /> Ads Supported</li>
                                </ul>
                                {isAuthenticated && isFree ? (
                                    <button disabled className="mt-8 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed">
                                        Current Plan
                                    </button>
                                ) : (
                                    <Link to="/register" className="mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 text-violet-600 ring-1 ring-inset ring-violet-200 hover:ring-violet-300 dark:ring-violet-900 dark:hover:ring-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all">
                                        Get Started Free
                                    </Link>
                                )}
                            </div>

                            {/* PRO TIER */}
                            <div className={`relative rounded-3xl p-8 ring-1 ring-violet-600 bg-white dark:bg-zinc-900 shadow-2xl ${isPro ? 'ring-2 ring-emerald-500' : ''}`}>
                                {isPro && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                        Active Plan
                                    </div>
                                )}
                                {!isPro && (
                                    <div className="absolute -top-4 right-8 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="flex items-center gap-2 text-lg font-semibold leading-8 text-zinc-900 dark:text-white">
                                    Pro <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                </h3>
                                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">For power users who need professional tools.</p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                                        ₹<NumberTicker value={isAnnual ? 4999 : 499} className="text-zinc-900 dark:text-white" />
                                    </span>
                                    <span className="text-sm font-semibold leading-6 text-zinc-600 dark:text-zinc-300">/{isAnnual ? 'year' : 'month'}</span>
                                </p>
                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600 dark:text-violet-400" /> Unlimited Tasks</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600 dark:text-violet-400" /> {proMaxFileSize}MB Max File Size</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600 dark:text-violet-400" /> Priority Processing (3x Faster)</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600 dark:text-violet-400" /> Advanced Tools (Crop, Redact, Organize)</li>
                                    <li className="flex gap-x-3"><Check className="h-6 w-5 flex-none text-violet-600 dark:text-violet-400" /> No Ads</li>
                                </ul>
                                {isPro ? (
                                    <button disabled className="mt-8 block w-full rounded-md bg-emerald-600/20 py-2 px-3 text-center text-sm font-semibold leading-6 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-500/30">
                                        Current Plan
                                    </button>
                                ) : (
                                    <Link
                                        to="/checkout"
                                        className="mt-8 block w-full rounded-md bg-violet-600 py-2 px-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 transition-all"
                                    >
                                        Upgrade to Pro
                                    </Link>
                                )}
                            </div>

                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
