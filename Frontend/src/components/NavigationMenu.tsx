import { Link, useLocation } from 'react-router-dom';
import { Home, Video, MessageSquare, User, Settings, X, Calendar, BarChart2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface NavLink {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const navLinks: NavLink[] = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/doctor-connect', label: 'Doctor Connect', icon: <Video className="w-5 h-5" /> },
    { path: '/chat', label: 'Peer Support', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/assessment', label: 'Self Assessment', icon: <BarChart2 className="w-5 h-5" /> },
    { path: '/auth', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

interface NavigationMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
    const location = useLocation();
    const { appointment } = useStore();

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-72 glass-panel border-r-0 border-r-white/5 z-[110] transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-8">
                    <h2 className="text-2xl font-display font-medium text-white tracking-widest text-shadow-glow">SANA</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="px-6 py-2 space-y-3">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={onClose}
                                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-gradient-to-r from-sana-primary/20 to-sana-secondary/20 text-white border border-sana-primary/20 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]'
                                    : 'text-sana-text-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {link.icon}
                                </div>
                                <span className="font-medium tracking-wide text-sm">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Upcoming Appt Card */}
                {(appointment.status === 'booked' || appointment.status === 'upcoming_appointment') && (
                    <div className="mx-6 mt-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-3 mb-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-purple-300">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white text-sm font-semibold tracking-wide">Next Session</h4>
                                <p className="text-white/50 text-xs font-light">Dr. Sarah • {appointment.details?.time || 'Upcoming'}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between relative z-10">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium border border-emerald-500/20">
                                Confirmed
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                    <Link
                        to="/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sana-text-muted hover:text-white hover:bg-white/5 transition-all duration-300 w-full"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium text-sm">Settings</span>
                    </Link>

                    <div className="px-5 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-light">
                            Developed by Kaushal Jindal
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
