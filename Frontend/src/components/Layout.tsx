import { useState } from 'react';
import { NavigationMenu } from './NavigationMenu';
import { Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    headerContent?: React.ReactNode;
}

export function Layout({ children, showHeader = true, headerContent }: LayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Navigation Menu - Always available */}
            <NavigationMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Standard Header */}
            {showHeader ? (
                <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 pointer-events-none">
                    {/* Hamburger Menu Button - Pointer events enabled */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/10 transition-all duration-300 rounded-full group bg-black/20 backdrop-blur-md border border-white/5 shadow-lg"
                    >
                        <Menu className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    {/* Custom header content */}
                    <div className="pointer-events-auto flex items-center">
                        {headerContent}
                    </div>
                </header>
            ) : (
                /* Floating Menu Trigger for Immersive Pages (like DoctorConnect) - Now on Left */
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="absolute top-6 left-6 z-[60] w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white transition-all duration-300 hover:scale-110 shadow-lg group"
                >
                    <Menu className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                </button>
            )}

            {/* Page Content */}
            {children}
        </div>
    );
}
