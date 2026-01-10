import React, { useState, useEffect } from 'react';

/**
 * ProgressBar Component
 * Displays upload progress with percentage, speed, and visual bar
 * 
 * @param {number} progress - Progress percentage (0-100)
 * @param {number} receivedBytes - Bytes received so far
 * @param {number} totalBytes - Total bytes expected
 * @param {number} speed - Transfer speed in bytes per second (optional)
 */
export default function ProgressBar({ progress, receivedBytes, totalBytes, speed }) {
    const [displaySpeed, setDisplaySpeed] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [lastBytes, setLastBytes] = useState(receivedBytes || 0);

    // Calculate speed from received bytes if not provided
    useEffect(() => {
        if (receivedBytes !== undefined && totalBytes !== undefined) {
            const now = Date.now();
            const timeDiff = (now - lastUpdate) / 1000; // seconds
            const bytesDiff = receivedBytes - lastBytes;

            if (timeDiff > 0.5) { // Update speed every 500ms
                const calculatedSpeed = bytesDiff / timeDiff;
                setDisplaySpeed(calculatedSpeed);
                setLastUpdate(now);
                setLastBytes(receivedBytes);
            }
        }
    }, [receivedBytes, totalBytes, lastUpdate, lastBytes]);

    const formatSpeed = (bytesPerSecond) => {
        if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
        return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const currentSpeed = speed || displaySpeed;
    const safeProgress = Math.min(Math.max(progress || 0, 0), 100);

    return (
        <div className="space-y-2">
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${safeProgress}%` }}
                />
            </div>

            {/* Progress Info */}
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">
                    {safeProgress.toFixed(1)}%
                </span>
                <div className="flex items-center gap-3">
                    {receivedBytes && totalBytes && (
                        <span>
                            {formatBytes(receivedBytes)} / {formatBytes(totalBytes)}
                        </span>
                    )}
                    {currentSpeed > 0 && (
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                            {formatSpeed(currentSpeed)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
