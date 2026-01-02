import { useState } from 'react';
import { NavigationMenu } from './NavigationMenu';
import { Menu, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    headerContent?: React.ReactNode;
}

export function Layout({ children, showHeader = true, headerContent }: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { emergencyMode } = useStore();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-sana-bg text-sana-text selection:bg-sana-primary/30">
            {/* Global Gradient Background */}
            <div className="absolute inset-0 bg-sana-gradient pointer-events-none z-0"></div>

            {/* Emergency Mode Tint */}
            {emergencyMode && (
                <div className="fixed inset-0 bg-red-950/20 z-[40] pointer-events-none animate-fade-in mix-blend-overlay"></div>
            )}

            {/* Navigation Menu - Always available */}
            <NavigationMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Emergency Banner */}
            {emergencyMode && (
                <div className="fixed top-0 left-0 right-0 z-[120] bg-rose-950/90 backdrop-blur-md border-b border-rose-500/20 px-4 py-2 flex items-center justify-center gap-3 text-rose-200 shadow-2xl">
                    <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
                    <p className="text-xs sm:text-sm font-medium tracking-wide">Emergency Support Active. Priority Routing Enabled.</p>
                </div>
            )}

            {/* Standard Header */}
            {showHeader ? (
                <header className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-6 pointer-events-none ${emergencyMode ? 'mt-10' : ''}`}>
                    {/* Hamburger Menu Button - Pointer events enabled */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="pointer-events-auto w-12 h-12 flex items-center justify-center hover:bg-white/5 transition-all duration-300 rounded-2xl group bg-white/5 backdrop-blur-md border border-white/5 shadow-lg hover:shadow-sana-primary/10 hover:border-white/10"
                    >
                        <Menu className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                    </button>

                    {/* Custom header content */}
                    <div className="pointer-events-auto flex items-center">
                        {headerContent}
                    </div>
                </header>
            ) : (
                /* Floating Menu Trigger for Immersive Pages */
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`absolute top-6 left-6 z-[60] w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 rounded-2xl text-white transition-all duration-300 hover:scale-105 shadow-lg group ${emergencyMode ? 'mt-10' : ''}`}
                >
                    <Menu className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                </button>
            )}

            {/* Page Content Container */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>

            {/* Emergency Disclaimer Bottom */}
            {emergencyMode && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 shadow-xl">
                    <p className="text-[10px] text-white/60 font-medium tracking-wider uppercase">Not a replacement for emergency services</p>
                </div>
            )}
        </div>
    );
}
