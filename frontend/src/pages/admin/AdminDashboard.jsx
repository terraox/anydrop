import React, { useState } from 'react';
import { Search, MoreVertical, Shield, ShieldOff, Activity, HardDrive, Wifi } from 'lucide-react';
import NumberTicker from '../../components/magicui/NumberTicker';
import { toast } from 'sonner';

const MOCK_USERS = [
    { id: 1, name: 'Alice Walker', email: 'alice@example.com', role: 'admin', status: 'online', joined: '2023-01-15' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'offline', joined: '2023-02-20' },
    { id: 3, name: 'Charlie Day', email: 'charlie@example.com', role: 'user', status: 'online', joined: '2023-03-10' },
    { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'pro', status: 'online', joined: '2023-04-05' },
    { id: 5, name: 'Evan Peters', email: 'evan@example.com', role: 'user', status: 'banned', joined: '2023-05-12' },
];

export default function AdminDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState(MOCK_USERS);

    const handleBan = (id) => {
        setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'banned' ? 'offline' : 'banned' } : u));
        toast.success("User status updated");
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 min-h-screen">

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    System Operational
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Users', value: 1240, icon: Activity, color: 'text-violet-400' },
                    { label: 'Storage Used (GB)', value: 856, icon: HardDrive, color: 'text-cyan-400' },
                    { label: 'Bandwidth (TB)', value: 42, icon: Wifi, color: 'text-emerald-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{stat.label}</span>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className={`text-4xl font-bold ${stat.color}`}>
                            <NumberTicker value={stat.value} />
                        </div>
                    </div>
                ))}
            </div>

            {/* User Table Card */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl backdrop-blur-xl overflow-hidden">

                {/* Table Header / Toolbar */}
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white">User Database</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-white/5 text-zinc-300 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{user.name}</p>
                                                <p className="text-zinc-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                                                user.role === 'pro' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                                    'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                            {user.status === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                                            {user.status === 'banned' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                            <span className={
                                                user.status === 'online' ? 'text-emerald-400' :
                                                    user.status === 'banned' ? 'text-red-400' : 'text-zinc-500'
                                            }>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-500">{user.joined}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleBan(user.id)}
                                            className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                            title={user.status === 'banned' ? 'Unban User' : 'Ban User'}
                                        >
                                            {user.status === 'banned' ? <ShieldOff className="w-4 h-4 text-red-400" /> : <Shield className="w-4 h-4" />}
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors ml-1">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
