import React, { useState } from 'react';
import { Search, HardDrive, FileText, Image, Video, File, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_FILES = [
    { id: 1, name: 'presentation.pdf', type: 'pdf', size: '2.4 MB', sender: 'alice@example.com', receiver: 'bob@example.com', date: '2024-01-15 14:32' },
    { id: 2, name: 'vacation_photos.zip', type: 'archive', size: '156 MB', sender: 'charlie@example.com', receiver: 'diana@example.com', date: '2024-01-14 09:15' },
    { id: 3, name: 'project_video.mp4', type: 'video', size: '1.2 GB', sender: 'evan@example.com', receiver: 'alice@example.com', date: '2024-01-13 16:48' },
    { id: 4, name: 'document.docx', type: 'doc', size: '512 KB', sender: 'bob@example.com', receiver: 'charlie@example.com', date: '2024-01-12 11:20' },
    { id: 5, name: 'banner.png', type: 'image', size: '4.8 MB', sender: 'diana@example.com', receiver: 'evan@example.com', date: '2024-01-11 08:55' },
];

const getFileIcon = (type) => {
    switch (type) {
        case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
        case 'image': return <Image className="h-5 w-5 text-emerald-500" />;
        case 'video': return <Video className="h-5 w-5 text-violet-500" />;
        default: return <File className="h-5 w-5 text-zinc-500" />;
    }
};

export default function Files() {
    const [searchTerm, setSearchTerm] = useState("");
    const [files, setFiles] = useState(MOCK_FILES);

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            setFiles(files.filter(f => f.id !== id));
            toast.success("File deleted");
        }
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.receiver.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Storage stats
    const totalStorage = "2 TB";
    const usedStorage = "856 GB";
    const usedPercent = 42;

    return (
        <>
            {/* Storage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Storage Overview</h3>
                        <HardDrive className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex items-end gap-4">
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white">{usedStorage}</div>
                        <div className="text-zinc-500 mb-1">of {totalStorage} used</div>
                    </div>
                    <div className="mt-4 h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-500" style={{ width: `${usedPercent}%` }}></div>
                    </div>
                    <div className="mt-4 flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-violet-500"></span>
                            <span className="text-zinc-600 dark:text-zinc-400">Documents: 320 GB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-violet-500"></span>
                            <span className="text-zinc-600 dark:text-zinc-400">Media: 480 GB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-zinc-400"></span>
                            <span className="text-zinc-600 dark:text-zinc-400">Other: 56 GB</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Total Files</span>
                            <span className="font-bold text-zinc-900 dark:text-white">12,847</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Transfers Today</span>
                            <span className="font-bold text-zinc-900 dark:text-white">342</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Avg File Size</span>
                            <span className="font-bold text-zinc-900 dark:text-white">24.5 MB</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Table Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Recent Transfers</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">View and manage file transfer logs.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search files..."
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
                            <th className="px-6 py-4 font-medium">File</th>
                            <th className="px-6 py-4 font-medium">Size</th>
                            <th className="px-6 py-4 font-medium">Sender</th>
                            <th className="px-6 py-4 font-medium">Receiver</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredFiles.map((file) => (
                            <tr key={file.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {getFileIcon(file.type)}
                                        <span className="font-medium text-zinc-900 dark:text-zinc-200">{file.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{file.size}</td>
                                <td className="px-6 py-4 text-zinc-500">{file.sender}</td>
                                <td className="px-6 py-4 text-zinc-500">{file.receiver}</td>
                                <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{file.date}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button className="p-2 text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-md transition-colors" title="Download">
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
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
