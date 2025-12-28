import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { LogOut, Calendar, Activity, Zap, Award, Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

function Profile() {
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        } else {
            // Fallback for dev/preview
            setUser({
                name: "Guest User",
                email: "guest@sana.ai"
            });
        }
    }, []);

    const handleSignOut = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <Layout
            headerContent={
                <>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Profile</h1>
                    <Link to="/settings" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <SettingsIcon className="w-5 h-5 text-white/70" />
                    </Link>
                </>
            }
        >
            <div className="relative w-full h-full bg-slate-900">
                {/* Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>

                {/* Content */}
                <div className="absolute inset-0 overflow-y-auto pt-20 pb-8 px-4 sm:px-8 custom-scrollbar">
                    <div className="max-w-md mx-auto space-y-8 animate-fade-in-up">

                        {/* Profile Card */}
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>

                            <div className="relative z-10 mt-8">
                                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-2xl shadow-purple-500/30">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-bold text-white uppercase">
                                        {user?.name?.[0] || 'G'}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-white mt-4">{user?.name}</h2>
                                <p className="text-white/40 text-sm mt-1">{user?.email}</p>

                                <div className="mt-6 flex justify-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs border border-white/5">Free Member</span>
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">Level 1</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 text-orange-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">2</p>
                                <p className="text-white/40 text-xs">Day Streak</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Activity className="w-5 h-5 text-blue-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">3</p>
                                <p className="text-white/40 text-xs">Total Sessions</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-4">
                            <h3 className="text-white/60 text-sm font-medium uppercase tracking-widest pl-2">Recent Journey</h3>

                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden">
                                <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium text-sm">Mindfulness Session</h4>
                                        <p className="text-white/40 text-xs">Yesterday • 15 mins</p>
                                    </div>
                                </div>
                                <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-medium text-sm">Joined SANA</h4>
                                        <p className="text-white/40 text-xs">Dec 2024 • Achievement</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/5 hover:bg-red-500/10 backdrop-blur-md border border-red-500/10 hover:border-red-500/20 rounded-2xl transition-all duration-300 text-red-400 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Sign Out</span>
                        </button>

                        <div className="text-center pb-4">
                            <p className="text-white/20 text-xs font-light">
                                User ID: {user?.email ? btoa(user.email).substring(0, 8) : '---'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Profile;
