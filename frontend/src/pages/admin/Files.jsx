import React, { useState, useEffect } from 'react';
import { Search, HardDrive, FileText, Image, Video, File, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

const getFileIcon = (type) => {
    if (!type) return <File className="h-5 w-5 text-zinc-500" />;
    const t = type.toLowerCase();
    if (t.includes('pdf') || t.includes('doc') || t.includes('txt')) return <FileText className="h-5 w-5 text-red-500" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <Image className="h-5 w-5 text-emerald-500" />;
    if (t.includes('video') || t.includes('mp4')) return <Video className="h-5 w-5 text-violet-500" />;
    return <File className="h-5 w-5 text-zinc-500" />;
};

const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function Files() {
    const [searchTerm, setSearchTerm] = useState("");
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalElements: 0, totalPages: 0, totalSize: 0, totalFiles: 0 });
    const [page, setPage] = useState(0);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/files', {
                params: {
                    search: searchTerm,
                    page: page,
                    size: 20
                }
            });
            setFiles(response.data.content);
            setStats(prev => ({
                ...prev,
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages
            }));

            // Also fetch dashboard stats for the cards if possible or use header returned data
            const statsRes = await api.get('/admin/dashboard/stats');
            if (statsRes.data) {
                setStats(prev => ({
                    ...prev,
                    totalSize: statsRes.data.totalSize,
                    totalFiles: statsRes.data.totalFiles
                }));
            }

        } catch (error) {
            console.error("Failed to fetch files:", error);
            toast.error("Failed to load file history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchFiles();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, page]);


    return (
        <>
            {/* Storage Overview - simplified for now */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Total Transfer Volume</h3>
                        <HardDrive className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white">{formatBytes(stats.totalSize)}</div>
                        <div className="text-zinc-500 mb-1">processed</div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Total Files</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{stats.totalFiles}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Table Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Recent Transfers</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">View file transfer logs.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="h-10 w-64 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:border-violet-500 focus:outline-none shadow-sm"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        value={searchTerm}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center p-12 text-zinc-500">
                        No transfers found.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">File Name</th>
                                <th className="px-6 py-4 font-medium">Size</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Sender Email</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {files.map((file) => (
                                <tr key={file.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(file.fileType)}
                                            <span className="font-medium text-zinc-900 dark:text-zinc-200">{file.fileName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{formatBytes(file.fileSize)}</td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                                            {file.fileType || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">{file.user ? file.user.email : 'Unknown'}</td>
                                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                                        {new Date(file.createdAt).toLocaleString()}
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
