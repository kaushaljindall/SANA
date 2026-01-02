import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            // Save JWT token
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to home
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Redirect to Google OAuth
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-sana-bg text-sana-text selection:bg-sana-primary/30">
            {/* Global Gradient Background */}
            <div className="absolute inset-0 bg-sana-gradient pointer-events-none"></div>

            {/* Stars */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            opacity: Math.random() * 0.7 + 0.3
                        }}
                    />
                ))}
            </div>

            {/* Login Form */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
                <div className="w-full max-w-md animate-fade-in-up">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="h1-display text-5xl mb-2 text-shadow-glow">SANA</h1>
                        <p className="text-sana-text-muted text-sm tracking-widest uppercase">Welcome back</p>
                    </div>

                    {/* Form Card */}
                    <div className="glass-panel p-8 space-y-6">
                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label className="text-sana-text/70 text-xs uppercase font-bold tracking-wider mb-2 block">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sana-text-muted" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="glass-input pl-12"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-sana-text/70 text-xs uppercase font-bold tracking-wider mb-2 block">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sana-text-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="glass-input pl-12 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sana-text-muted hover:text-sana-text transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <p className="text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="glass-button w-full justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                <span className="px-4 text-sana-text-muted bg-transparent">or continue with</span>
                            </div>
                        </div>

                        {/* Google OAuth */}
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-white/90 rounded-xl text-slate-900 font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>

                        {/* Sign Up Link */}
                        <p className="text-center text-sana-text-muted text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-sana-primary hover:text-sana-accent font-bold transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-white/30 text-xs mt-8">
                        By signing in, you agree to our Terms and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
