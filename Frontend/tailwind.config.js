/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                sana: {
                    bg: '#0F172A', // Slate 900
                    dark: '#020617', // Slate 950
                    glass: 'rgba(255, 255, 255, 0.05)',
                    'glass-hover': 'rgba(255, 255, 255, 0.1)',
                    'glass-border': 'rgba(255, 255, 255, 0.1)',
                    primary: '#38BDF8', // Sky 400
                    secondary: '#818CF8', // Indigo 400
                    accent: '#2DD4BF', // Teal 400
                    danger: '#F87171', // Red 400
                    success: '#34D399', // Emerald 400
                    warning: '#FBBF24', // Amber 400
                    text: '#F1F5F9', // Slate 100
                    'text-muted': '#94A3B8', // Slate 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'], // Premium display font
            },
            backgroundImage: {
                'sana-gradient': 'radial-gradient(circle at top center, #1e293b 0%, #0f172a 50%, #020617 100%)',
                'glow-gradient': 'conic-gradient(from 180deg at 50% 50%, #2DD4BF 0deg, #38BDF8 180deg, #818CF8 360deg)',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                }
            }
        },
    },
    plugins: [],
}
