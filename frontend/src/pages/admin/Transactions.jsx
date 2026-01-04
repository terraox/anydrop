import React, { useState } from 'react';
import { Search, CreditCard, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

const MOCK_TRANSACTIONS = [
    { id: 1, user: 'alice@example.com', amount: 499, plan: 'PRO', status: 'completed', method: 'UPI', date: '2024-01-15 14:32' },
    { id: 2, user: 'bob@example.com', amount: 499, plan: 'PRO', status: 'completed', method: 'Card', date: '2024-01-14 09:15' },
    { id: 3, user: 'charlie@example.com', amount: 499, plan: 'PRO', status: 'failed', method: 'UPI', date: '2024-01-13 16:48' },
    { id: 4, user: 'diana@example.com', amount: 499, plan: 'PRO', status: 'refunded', method: 'Card', date: '2024-01-12 11:20' },
    { id: 5, user: 'evan@example.com', amount: 499, plan: 'PRO', status: 'completed', method: 'NetBanking', date: '2024-01-11 08:55' },
];

export default function Transactions() {
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions] = useState(MOCK_TRANSACTIONS);

    const filteredTransactions = transactions.filter(t =>
        t.user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
    const completedCount = transactions.filter(t => t.status === 'completed').length;
    const failedCount = transactions.filter(t => t.status === 'failed').length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20';
            case 'failed':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/20';
            case 'refunded':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20';
            default:
                return 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700';
        }
    };

    return (
        <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Revenue</h3>
                        <IndianRupee className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">₹{totalRevenue.toLocaleString()}</div>
                    <p className="flex items-center text-xs mt-2 text-emerald-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +18% from last month
                    </p>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Successful</h3>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{completedCount}</div>
                    <p className="text-xs text-zinc-500 mt-2">Transactions completed</p>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Failed</h3>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">{failedCount}</div>
                    <p className="text-xs text-zinc-500 mt-2">Transactions failed</p>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Transactions</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">View and manage payment history.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        className="h-10 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-violet-500 focus:outline-none shadow-sm"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Amount</th>
                            <th className="px-6 py-4 font-medium">Plan</th>
                            <th className="px-6 py-4 font-medium">Method</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredTransactions.map((txn) => (
                            <tr key={txn.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-zinc-900 dark:text-zinc-200">{txn.user}</span>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-200">₹{txn.amount}</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        {txn.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">{txn.method}</td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{txn.date}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${getStatusBadge(txn.status)}`}>
                                        {txn.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
