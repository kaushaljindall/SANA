import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import {
    User, Bell, Lock, MessageSquare,
    Trash2, Info, ChevronRight, LogOut,
    Save, X
} from 'lucide-react';

interface SettingsState {
    notifications: {
        sessionReminders: boolean;
        peerSupport: boolean;
        systemUpdates: boolean;
    };
    privacy: {
        anonymousMode: boolean;
        saveHistory: boolean;
        dataSharing: boolean;
    };
    preferences: {
        soundEffects: boolean;
        voiceMode: boolean;
        autoPlay: boolean;
    };
}

const defaultSettings: SettingsState = {
    notifications: {
        sessionReminders: true,
        peerSupport: false,
        systemUpdates: true
    },
    privacy: {
        anonymousMode: true,
        saveHistory: true,
        dataSharing: false
    },
    preferences: {
        soundEffects: true,
        voiceMode: false,
        autoPlay: false
    }
};

function Settings() {
    // Load settings from localStorage or use defaults
    const [settings, setSettings] = useState<SettingsState>(() => {
        const saved = localStorage.getItem('sanaSettings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearStatus, setClearStatus] = useState<string>('');
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    // Profile & Password Edit State
    const [editProfileData, setEditProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '' });
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        // Load user data for edit profile
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setEditProfileData({ name: user.name || '', email: user.email || '' });
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('sanaSettings', JSON.stringify(settings));
    }, [settings]);

    const updateNotification = (key: keyof SettingsState['notifications']) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
        }));
    };

    const updatePrivacy = (key: keyof SettingsState['privacy']) => {
        setSettings(prev => ({
            ...prev,
            privacy: { ...prev.privacy, [key]: !prev.privacy[key] }
        }));
    };

    const updatePreference = (key: keyof SettingsState['preferences']) => {
        setSettings(prev => ({
            ...prev,
            preferences: { ...prev.preferences, [key]: !prev.preferences[key] }
        }));
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage('Updating profile...');
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('http://localhost:3000/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editProfileData.name })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            const updatedUser = await response.json();
            sessionStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
            setStatusMessage('✅ Profile updated successfully');
            setTimeout(() => setStatusMessage(''), 3000);

            // Allow email to display as updated in form but note that it might not be updated on server mock
            setEditProfileData(prev => ({ ...prev, name: updatedUser.name }));
            // Close after short delay or keep open to show success
        } catch (error) {
            setStatusMessage('❌ Update failed');
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatusMessage('Updating password...');
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('http://localhost:3000/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to change password');

            setStatusMessage('✅ Password changed successfully');
            setPasswordData({ current_password: '', new_password: '' });
            setTimeout(() => setStatusMessage(''), 3000);
            setShowChangePassword(false);
        } catch (error: any) {
            setStatusMessage(`❌ ${error.message}`);
            setTimeout(() => setStatusMessage(''), 3000);
        }
    };

    const handleClearHistory = async () => {
        try {
            setClearStatus('Clearing...');

            // Clear chat history from backend (session)
            const sessionId = 'default';
            // Also call API if token exists
            const response = await fetch(`http://localhost:3000/clear-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                setClearStatus('✅ History cleared successfully');
                setShowClearConfirm(false);
                setTimeout(() => setClearStatus(''), 2000);
            } else {
                throw new Error('Failed to clear history');
            }
        } catch (error) {
            console.error(error);
            setClearStatus('❌ Failed to clear history');
            setTimeout(() => setClearStatus(''), 2000);
        }
    };

    return (
        <Layout
            headerContent={
                <>
                    <h1 className="h1-display text-2xl">Settings</h1>
                    <div></div>
                </>
            }
        >
            <div className="relative w-full h-full">

                {/* Content */}
                <div className="absolute inset-0 overflow-y-auto pt-24 pb-8 px-4 sm:px-8 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6 pb-12">

                        {/* Status Message Toast */}
                        {statusMessage && (
                            <div className="fixed top-24 right-4 sm:right-8 bg-slate-800 border border-white/20 px-4 py-2 rounded-xl shadow-xl z-50 animate-fade-in-down text-white text-sm">
                                {statusMessage}
                            </div>
                        )}

                        {/* Account Section */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 transition-all duration-300">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Account
                            </h2>
                            <div className="space-y-3">
                                {/* Edit Profile */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowEditProfile(!showEditProfile)}
                                        className={`w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 ${showEditProfile ? 'bg-white/10 border border-white/20' : ''}`}
                                    >
                                        <div>
                                            <p className="text-white text-sm font-medium">Edit Profile</p>
                                            <p className="text-white/50 text-xs">Update your name and email</p>
                                        </div>
                                        {showEditProfile ? <X className="w-5 h-5 text-white/70" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
                                    </button>

                                    {showEditProfile && (
                                        <form onSubmit={handleUpdateProfile} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 animate-fade-in text-left">
                                            <div>
                                                <label className="text-white/70 text-xs uppercase font-semibold block mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={editProfileData.name}
                                                    onChange={e => setEditProfileData({ ...editProfileData, name: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    placeholder="Your name"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-white/70 text-xs uppercase font-semibold block mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={editProfileData.email}
                                                    disabled
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white/50 cursor-not-allowed"
                                                />
                                            </div>
                                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                                <Save className="w-4 h-4" /> Save Changes
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Change Password */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowChangePassword(!showChangePassword)}
                                        className={`w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 ${showChangePassword ? 'bg-white/10 border border-white/20' : ''}`}
                                    >
                                        <div>
                                            <p className="text-white text-sm font-medium">Change Password</p>
                                            <p className="text-white/50 text-xs">Update your security credentials</p>
                                        </div>
                                        {showChangePassword ? <X className="w-5 h-5 text-white/70" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
                                    </button>

                                    {showChangePassword && (
                                        <form onSubmit={handleChangePassword} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 animate-fade-in text-left">
                                            <div>
                                                <label className="text-white/70 text-xs uppercase font-semibold block mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.current_password}
                                                    onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    placeholder="Enter current password"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-white/70 text-xs uppercase font-semibold block mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.new_password}
                                                    onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                                    placeholder="Enter new password"
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                                <Save className="w-4 h-4" /> Update Password
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifications
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Session Reminders</p>
                                        <p className="text-white/50 text-xs">Get reminded about scheduled sessions</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotification('sessionReminders')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.notifications.sessionReminders ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.notifications.sessionReminders ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Peer Support Updates</p>
                                        <p className="text-white/50 text-xs">Notifications from the forum</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotification('peerSupport')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.notifications.peerSupport ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.notifications.peerSupport ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">System Updates</p>
                                        <p className="text-white/50 text-xs">Important app announcements</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotification('systemUpdates')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.notifications.systemUpdates ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.notifications.systemUpdates ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Privacy */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Privacy & Safety
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Anonymous Mode</p>
                                        <p className="text-white/50 text-xs">Hide your identity in forums</p>
                                    </div>
                                    <button
                                        onClick={() => updatePrivacy('anonymousMode')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.privacy.anonymousMode ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.privacy.anonymousMode ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Save Chat History</p>
                                        <p className="text-white/50 text-xs">Keep conversations for continuity</p>
                                    </div>
                                    <button
                                        onClick={() => updatePrivacy('saveHistory')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.privacy.saveHistory ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.privacy.saveHistory ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Share Analytics</p>
                                        <p className="text-white/50 text-xs">Help us improve SANA</p>
                                    </div>
                                    <button
                                        onClick={() => updatePrivacy('dataSharing')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.privacy.dataSharing ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.privacy.dataSharing ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Chat Preferences
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Sound Effects</p>
                                        <p className="text-white/50 text-xs">UI interaction sounds</p>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('soundEffects')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.preferences.soundEffects ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.preferences.soundEffects ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Voice Mode</p>
                                        <p className="text-white/50 text-xs">Enable voice responses</p>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('voiceMode')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.preferences.voiceMode ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.preferences.voiceMode ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">Auto-play Audio</p>
                                        <p className="text-white/50 text-xs">Play AI responses automatically</p>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('autoPlay')}
                                        className={`w-12 h-6 rounded-full transition-all duration-300 ${settings.preferences.autoPlay ? 'bg-blue-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${settings.preferences.autoPlay ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Data Management */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                Data Management
                            </h2>
                            {!showClearConfirm ? (
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all duration-300"
                                >
                                    <div className="text-left">
                                        <p className="text-red-300 text-sm font-medium">Clear Chat History</p>
                                        <p className="text-red-300/60 text-xs">Permanently delete all conversations</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-red-300/60" />
                                </button>
                            ) : (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                                    <p className="text-red-300 text-sm font-medium">Are you sure?</p>
                                    <p className="text-red-300/60 text-xs">This action cannot be undone.</p>
                                    {clearStatus && (
                                        <p className="text-white text-xs">{clearStatus}</p>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowClearConfirm(false)}
                                            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleClearHistory}
                                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-semibold transition-all duration-300"
                                        >
                                            Clear History
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* About */}
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                About SANA
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3">
                                    <p className="text-white/70 text-sm">Version</p>
                                    <p className="text-white text-sm font-medium">1.0.0</p>
                                </div>
                                <div className="flex items-center justify-between p-3">
                                    <p className="text-white/70 text-sm">AI Model</p>
                                    <p className="text-white text-sm font-medium">Groq (llama-3.3)</p>
                                </div>
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all duration-300"
                                >
                                    <p className="text-white/70 text-sm">Terms of Service</p>
                                    <ChevronRight className="w-4 h-4 text-white/50" />
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all duration-300"
                                >
                                    <p className="text-white/70 text-sm">Privacy Policy</p>
                                    <ChevronRight className="w-4 h-4 text-white/50" />
                                </a>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('token');
                                sessionStorage.removeItem('user');
                                localStorage.removeItem('sanaSettings');
                                window.location.href = '/login';
                            }}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl transition-all duration-300 text-red-300 hover:text-red-200"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Sign Out</span>
                        </button>

                        {/* Footer Message */}
                        <div className="text-center py-4">
                            <p className="text-white/30 text-xs">
                                SANA is here to support you. 💙
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Settings;
