import { User, Mail, Lock, Shield, LogOut, Monitor, Moon, Sun, Laptop, Camera, Key, RefreshCw, LayoutGrid, Volume2, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import ChangePasswordModal from '../../components/user/ChangePasswordModal';
import { useState, useRef, useEffect } from 'react';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import api from '../../services/api';


const SoundEffectsToggle = () => {
    const { toggleSoundEffects, getSoundEnabled, playUploadSuccess } = useSoundEffects();
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        setEnabled(getSoundEnabled());
    }, [getSoundEnabled]);

    const handleToggle = () => {
        const newValue = !enabled;
        setEnabled(newValue);
        toggleSoundEffects(newValue);
        if (newValue) {
            playUploadSuccess(); // Play a test sound
        }
        toast.success(`Sound Effects ${newValue ? 'Enabled' : 'Disabled'}`);
    };

    return (
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <Volume2 className="w-4 h-4" />
                    <span className="font-medium">Sound Effects</span>
                </div>
                <button
                    onClick={handleToggle}
                    className={`
                        relative w-11 h-6 rounded-full transition-all duration-300
                        ${enabled
                            ? 'bg-violet-500'
                            : 'bg-zinc-300 dark:bg-zinc-700'
                        }
                    `}
                >
                    <span
                        className={`
                            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300
                            ${enabled ? 'translate-x-5' : 'translate-x-0'}
                        `}
                    />
                </button>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
                Play audio feedback on successful uploads and downloads.
            </p>
        </div>
    );
};


const DashboardViewToggle = () => {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('orbit_view_mode') || 'classic');

    return (
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-200 dark:bg-zinc-900 rounded-lg">
            {['classic', 'bento'].map((mode) => {
                const isActive = viewMode === mode;
                return (
                    <button
                        key={mode}
                        onClick={() => {
                            setViewMode(mode);
                            localStorage.setItem('orbit_view_mode', mode);
                            window.dispatchEvent(new Event('orbit-view-change'));
                            toast.success(`Active View: ${mode === 'classic' ? 'Classic Orbit' : 'Bento Grid'}`);
                        }}
                        className={`
                            px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200
                            ${isActive
                                ? 'bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                            }
                        `}
                    >
                        {mode === 'classic' ? 'Orbit' : 'Bento'}
                    </button>
                );
            })}
        </div>
    );
};

export default function Settings() {
    const { user, logout, updateProfile, changePassword } = useAuth();
    const { theme, setTheme } = useTheme();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [isLoadingDeviceName, setIsLoadingDeviceName] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Load device name
        api.get('/device/identity')
            .then(res => setDeviceName(res.data.deviceName))
            .catch(err => console.error('Failed to load device name:', err));
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error("Image size should be less than 2MB.");
            return;
        }

        // Simulating upload by converting to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            // Optimistic update
            updateProfile({ avatar: base64String });
            toast.success("Avatar updated successfully!");
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAvatar = (e) => {
        e.stopPropagation();
        const randomSeed = Math.random().toString(36).substring(7);
        const diceBearUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${randomSeed}`;
        updateProfile({ avatar: diceBearUrl });
        toast.success("New character generated!");
    };

    const handleSaveDeviceName = async () => {
        if (!deviceName || deviceName.trim() === '') {
            toast.error('Device name cannot be empty');
            return;
        }

        setIsLoadingDeviceName(true);
        try {
            await api.put('/device/name', { deviceName: deviceName.trim() });
            toast.success('Device name updated! Other devices will see the new name.');
        } catch (error) {
            toast.error('Failed to update device name');
            console.error(error);
        } finally {
            setIsLoadingDeviceName(false);
        }
    };

    const handleLogoutAll = () => {
        toast.error("Terminating all active sessions...");
        setTimeout(() => logout(), 1000);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-12 pb-20">

            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Settings</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Configure your neural interface.</p>
            </div>

            <div className="grid gap-8">

                {/* Profile Section */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Profile
                    </h2>

                    <div className="flex items-start gap-8">
                        {/* Glitch Avatar */}
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white dark:ring-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'User'}`}
                                        alt="Generated Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>

                            {/* Actions */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                                <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1 shadow-lg cursor-pointer hover:scale-105 transition-transform" title="Upload Image">
                                    <Camera className="w-3 h-3" />
                                </div>
                                <div
                                    onClick={handleGenerateAvatar}
                                    className="bg-violet-600 text-white px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1 shadow-lg cursor-pointer hover:bg-violet-500 hover:scale-105 transition-all"
                                    title="Generate Avatar"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="flex-1 space-y-4 max-w-md">
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase text-zinc-500">Username</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
                                    <User className="w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        defaultValue={user?.username || "Neon-Fox"}
                                        className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full placeholder:text-zinc-500"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase text-zinc-500">Email</label>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 opacity-70 cursor-not-allowed">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                    <input
                                        type="email"
                                        defaultValue={user?.email || "user@project-pup.com"}
                                        disabled
                                        className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-1.5">
                                <label className="text-xs font-semibold uppercase text-zinc-500">Device Name</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all flex-1">
                                        <Laptop className="w-4 h-4 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={deviceName}
                                            onChange={(e) => setDeviceName(e.target.value)}
                                            placeholder={user?.username + "'s Computer"}
                                            className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full placeholder:text-zinc-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveDeviceName}
                                        disabled={isLoadingDeviceName}
                                        className={`px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-lg transition-all ${isLoadingDeviceName ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoadingDeviceName ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-zinc-400">
                                    This name will be visible to other devices on the network.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Security
                    </h2>
                    <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-between gap-6">
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Key className="w-4 h-4 text-violet-500" /> Password
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Change your password periodically to keep your account secure.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                            Change Password
                        </button>
                    </div>
                </section>

                {/* Appearance */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Appearance
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Theme Toggle */}
                        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                <span className="font-medium">Interface Theme</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {['light', 'dark', 'system'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`
                                            px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300
                                            ${theme === t
                                                ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }
                                        `}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                                <LayoutGrid className="w-4 h-4" />
                                <span className="font-medium">Dashboard View</span>
                            </div>

                            <DashboardViewToggle />
                            <p className="text-[10px] text-zinc-400 leading-tight">
                                Select "Orbit" for the classic radar view or "Bento" for a data-rich grid layout.
                            </p>
                        </div>

                        {/* Sound Effects Toggle */}
                        <SoundEffectsToggle />

                    </div>
                </section>

                {/* Danger Zone */}
                <section className="space-y-6">
                    <h2 className="text-lg font-semibold text-red-500 border-b border-red-200 dark:border-red-900/30 pb-2 flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Danger Zone
                    </h2>

                    <div className="p-6 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10 flex items-center justify-between gap-6">
                        <div>
                            <h3 className="font-semibold text-red-900 dark:text-red-200">Log out all devices</h3>
                            <p className="text-sm text-red-700 dark:text-red-300/70 mt-1">
                                This will terminate active sessions on all other devices (e.g. other logged in devices).
                            </p>
                        </div>
                        <button
                            onClick={handleLogoutAll}
                            className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:shake transition-all shadow-sm"
                        >
                            TERMINATE ALL
                        </button>
                    </div>
                </section>

            </div>


            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onChangePassword={changePassword}
            />
        </div >
    );
}
