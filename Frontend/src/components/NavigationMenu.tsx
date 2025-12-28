import { Link, useLocation } from 'react-router-dom';
import { Home, Video, MessageSquare, User, Settings, X } from 'lucide-react';

interface NavLink {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const navLinks: NavLink[] = [
    { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { path: '/doctor-connect', label: 'Doctor Connect', icon: <Video className="w-5 h-5" /> },
    { path: '/chat', label: 'Peer Support', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/auth', label: 'Profile', icon: <User className="w-5 h-5" /> },
];

interface NavigationMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NavigationMenu({ isOpen, onClose }: NavigationMenuProps) {
    const location = useLocation();

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
            <div className={`fixed top-0 left-0 h-full w-64 sm:w-80 bg-slate-900/95 backdrop-blur-md border-r border-white/10 shadow-2xl z-[110] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white tracking-wider">SANA</h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                    >
                        <X className="w-6 h-6 text-white/80" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="px-4 py-6 space-y-2">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={onClose}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {link.icon}
                                <span className="font-medium">{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 space-y-4">
                    <Link
                        to="/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 w-full"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </Link>

                    <div className="px-4">
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-light">
                            Developed by Kaushal Jindal
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
