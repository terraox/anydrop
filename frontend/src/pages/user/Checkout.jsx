import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, Sparkles, Tag, ShieldCheck, ArrowLeft, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import api from '../../services/api';

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Checkout State
    const [isAnnual, setIsAnnual] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [discount, setDiscount] = useState(null); // { percent: 10, code: 'SAVE10' }

    // Payment State
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvc, setCvc] = useState('');

    const [monthlyPrice, setMonthlyPrice] = useState(499);
    const [annualPrice, setAnnualPrice] = useState(4999);

    useEffect(() => {
        const fetchPlanPrice = async () => {
            try {
                // Note: baseURL already includes /api, so use /plans not /api/plans
                const res = await api.get('/plans');
                const pro = res.data.pro;
                if (pro && pro.monthlyPrice) {
                    const mPrice = parseFloat(pro.monthlyPrice);
                    setMonthlyPrice(mPrice);
                    // Calculate annual price: Monthly * 12 * 0.83 (17% off approx)
                    // Or just use Monthly * 10 (common SaaS heuristic for 2 months free)
                    // Let's stick to the UI "Save 17%" logic:
                    // 17% off annual means: Annual = Monthly * 12 * (1 - 0.17) = Monthly * 9.96
                    // Rounding to nearest 9 or appropriate integer.
                    // For 9.99 -> 99.99 (x10).
                    setAnnualPrice(Math.round(mPrice * 10));
                }
            } catch (error) {
                console.error("Failed to fetch plan price", error);
            }
        };
        fetchPlanPrice();
    }, []);

    const basePrice = isAnnual ? annualPrice : monthlyPrice;
    const finalPrice = discount
        ? Math.round(basePrice * (1 - discount.percent / 100))
        : basePrice;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsVerifying(true);
        try {
            const response = await api.post('/coupons/verify', { code: couponCode });
            setDiscount({
                percent: response.data.discountPercent,
                code: response.data.code
            });
            toast.success(`Coupon applied! ${response.data.discountPercent}% off.`);
        } catch (error) {
            console.error("Coupon error:", error);
            setDiscount(null);
            toast.error(error.response?.data?.error || "Invalid coupon code");
        } finally {
            setIsVerifying(false);
        }
    };

    const finishCheckout = () => {
        // Here you would trigger actual context update
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };

    const isFormValid = (cardholderName && cardNumber && expiryDate && cvc);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black transition-colors duration-300 flex flex-col">
            {/* Header */}
            <header className="flex h-16 items-center border-b border-zinc-200/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl dark:border-white/5 px-6 lg:px-12 sticky top-0 z-50">
                <Link to="/pricing" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mr-auto">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Link>
                <div className="absolute left-1/2 -translate-x-1/2">
                    <Logo className="scale-75 origin-center" />
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                    {/* Left Column: Plan Details */}
                    <div className="space-y-8 lg:sticky lg:top-32">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-4">Complete your upgrade</h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400">
                                Unlock the full power of AnyDrop with the Pro plan.
                            </p>
                        </div>

                        <div className="flex justify-center items-center gap-4 mb-8">
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

                        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-100 dark:border-white/5">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Pro Plan ({isAnnual ? 'Yearly' : 'Monthly'})</h3>
                                    <p className="text-sm text-zinc-500">Billed {isAnnual ? 'annually' : 'monthly'} at ₹{basePrice}</p>
                                </div>
                                <div className="text-right">
                                    {discount ? (
                                        <>
                                            <p className="text-sm text-zinc-400 line-through">₹{basePrice}</p>
                                            <p className="text-2xl font-bold text-emerald-500">₹{finalPrice}</p>
                                            <p className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {discount.code} applied (-{discount.percent}%)
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-violet-600">₹{basePrice}</p>
                                            {isAnnual && <p className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Save 17%</p>}
                                        </>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-4">
                                {[
                                    'Unlimited File Transfers',
                                    '100MB Max File Size',
                                    'Priority Processing (3x Speed)',
                                    'Ad-free Experience',
                                    'Premium Support'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
                                            <Check className="h-3 w-3" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Secure SSL Encryption. 30-day money-back guarantee.</span>
                        </div>
                    </div>

                    {/* Right Column: Payment Form */}
                    <div className="bg-white dark:bg-zinc-900/50 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/5 dark:shadow-black/20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Details</h3>
                                <p className="text-sm text-zinc-500">Enter your card information.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Card Form */}
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Cardholder Name</label>
                                        <input
                                            type="text"
                                            value={cardholderName}
                                            onChange={(e) => setCardholderName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Card Number</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                placeholder="0000 0000 0000 0000"
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">Expiry</label>
                                            <input
                                                type="text"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                placeholder="MM / YY"
                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5 ml-1">CVC</label>
                                            <input
                                                type="text"
                                                value={cvc}
                                                onChange={(e) => setCvc(e.target.value)}
                                                placeholder="123"
                                                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Section */}
                            <div className="pt-6 border-t border-zinc-200 dark:border-white/5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Promo Code</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Enter code (optional)"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono text-sm uppercase"
                                        />
                                    </div>
                                    {couponCode && (
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isVerifying}
                                            className="text-xs font-bold text-violet-600 hover:text-violet-500 px-3 bg-violet-50 dark:bg-violet-500/10 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isVerifying ? 'Verifying...' : 'APPLY'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={finishCheckout}
                                disabled={isVerifying || !isFormValid}
                                className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay ₹{finalPrice} & Subscribe <Sparkles className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-zinc-400 mt-4">
                                Powered by Stripe. <br />
                                By continuing, you agree to our Terms of Service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
