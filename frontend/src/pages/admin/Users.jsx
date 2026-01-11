import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, CheckCircle2, XCircle, Download, MoreVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export default function Users() {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [stats, setStats] = useState({ totalElements: 0, totalPages: 0 });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users', {
                params: {
                    search: searchTerm,
                    status: activeTab,
                    page: page,
                    size: 20
                }
            });
            setUsers(response.data.content);
            setStats({
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, activeTab, page]);

    const handleBan = async (id, currentStatus) => {
        try {
            if (currentStatus === 'banned') {
                await api.post(`/admin/users/${id}/unban`);
                toast.success("User unbanned successfully");
            } else {
                await api.post(`/admin/users/${id}/ban`);
                toast.success("User banned successfully");
            }
            fetchUsers(); // Refresh list
        } catch (error) {
            console.error("Action failed:", error);
            toast.error("Failed to update user status");
        }
    };

    const handleExportCsv = async () => {
        try {
            toast.promise(
                async () => {
                    const response = await api.get('/admin/users', {
                        params: {
                            search: searchTerm,
                            status: activeTab,
                            page: 0,
                            size: 10000 // Fetch a large number for export
                        }
                    });

                    const data = response.data.content;
                    if (!data || data.length === 0) throw new Error("No users to export");

                    const headers = ['ID', 'Username', 'Email', 'Role', 'Plan', 'Status', 'Joined'];
                    const csvContent = [
                        headers.join(','),
                        ...data.map(u => [
                            u.id,
                            `"${u.username}"`, // Quote to handle commas
                            `"${u.email}"`,
                            u.role,
                            u.plan?.name || 'FREE',
                            u.enabled ? 'Active' : 'Banned',
                            new Date(u.createdAt).toISOString().split('T')[0]
                        ].join(','))
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                },
                {
                    loading: 'Preparing download...',
                    success: 'Users exported successfully',
                    error: 'Failed to export users'
                }
            );
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

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
                            value={searchTerm}
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
                        onClick={() => { setActiveTab(tab); setPage(0); }}
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
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center p-12 text-zinc-500">
                        No users found.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Plan</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {users.map((user) => (
                                <tr key={user.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">
                                                {(user.username || user.email).substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900 dark:text-zinc-200">{user.username}</p>
                                                <p className="text-xs text-zinc-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'ROLE_ADMIN' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
                                            {user.role === 'ROLE_ADMIN' && <Shield className="h-3 w-3" />}
                                            {user.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${user.plan?.name === 'TITAN' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                                            {user.plan?.name || 'FREE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleBan(user.id, user.enabled ? 'active' : 'banned')}
                                            className={`p-2 rounded-md transition-colors ${!user.enabled ? 'text-emerald-500 hover:text-white hover:bg-emerald-600' : 'text-red-500 hover:text-white hover:bg-red-600'}`}
                                            title={!user.enabled ? 'Unban User' : 'Ban User'}
                                        >
                                            {!user.enabled ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {stats.totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                        Page {page + 1} of {stats.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(stats.totalPages - 1, p + 1))}
                        disabled={page >= stats.totalPages - 1}
                        className="px-3 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}
