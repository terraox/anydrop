import React, { useState } from 'react';
import { Search, Shield, ShieldAlert, CheckCircle2, XCircle, Download, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_USERS = [
    { id: 1, email: 'alice@example.com', username: 'AliceW', role: 'ADMIN', plan: 'PRO', status: 'active', joined: '2024-01-15', storage: '2.4 GB' },
    { id: 2, email: 'bob@example.com', username: 'BobSmith', role: 'USER', plan: 'FREE', status: 'active', joined: '2024-02-20', storage: '512 MB' },
    { id: 3, email: 'charlie@example.com', username: 'CharlieD', role: 'USER', plan: 'PRO', status: 'active', joined: '2024-03-10', storage: '4.8 GB' },
    { id: 4, email: 'diana@example.com', username: 'DianaPr', role: 'USER', plan: 'FREE', status: 'banned', joined: '2024-04-05', storage: '0 MB' },
    { id: 5, email: 'evan@example.com', username: 'EvanP', role: 'USER', plan: 'PRO', status: 'active', joined: '2024-05-12', storage: '1.2 GB' },
];

export default function Users() {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState(MOCK_USERS);
    const [activeTab, setActiveTab] = useState('active');

    const handleBan = (id) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'banned' ? 'active' : 'banned' } : u));
        toast.success("User status updated");
    };

    const handleExportCsv = () => {
        toast.success("Exporting users to CSV...");
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'active' ? user.status === 'active' : user.status === 'banned';
        return matchesSearch && matchesTab;
    });

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">User Management</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage access, roles, and subscription status.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="h-10 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-violet-500 focus:outline-none shadow-sm"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700 shadow-sm flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800">
                {['active', 'banned'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-sm font-medium transition-colors relative capitalize ${activeTab === tab ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        {tab === 'active' ? 'Active Users' : 'Banned Users'}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                        <tr>
                            <th className="px-6 py-4 font-medium">User</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Plan</th>
                            <th className="px-6 py-4 font-medium">Storage</th>
                            <th className="px-6 py-4 font-medium">Joined</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">
                                            {user.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900 dark:text-zinc-200">{user.username}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
                                        {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${user.plan === 'PRO' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{user.storage}</td>
                                <td className="px-6 py-4 text-zinc-500">{user.joined}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => handleBan(user.id)}
                                        className={`p-2 rounded-md transition-colors ${user.status === 'banned' ? 'text-emerald-500 hover:text-white hover:bg-emerald-600' : 'text-red-500 hover:text-white hover:bg-red-600'}`}
                                        title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                                    >
                                        {user.status === 'banned' ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
