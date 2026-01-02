import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '../components/canvas/Scene';
import { ApiService } from '../services/ApiService';
import VoiceInput from '../components/VoiceInput';
import { Layout } from '../components/Layout';
import { Chatbot } from '../components/Chatbot';
import { useStore } from '../store/useStore';
import { BookingOverlay } from '../components/BookingOverlay';
import { WeeklyAssignment } from '../components/WeeklyAssignment';

function LandingPage() {
    const { user, updateUser, updateAgent, updateAppointment } = useStore();

    // Local visual states
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [expression, setExpression] = useState("default");
    const [animation, setAnimation] = useState("Idle");
    const [animationTrigger, setAnimationTrigger] = useState(0);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    // Booking States
    const [isBooking, setIsBooking] = useState(false);
    const [bookingTime, setBookingTime] = useState<string>();

    // Assignment State
    const [isAssignmentActive, setIsAssignmentActive] = useState(false);

    useEffect(() => {
        // User Auth initialization
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                updateUser({ name: userData.name, authenticated: true });
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }

        // First time user check
        const visited = localStorage.getItem('sana_visited');
        if (!visited) {
            setIsFirstVisit(true);
            localStorage.setItem('sana_visited', 'true');
        }
    }, [updateUser]);

    const handleVoiceInput = async (audioBlob: Blob) => {
        try {
            updateAgent('processing');
            const response = await ApiService.sendVoice(audioBlob);

            setExpression(response.facialExpression);
            setAnimation(response.animation);
            setAnimationTrigger(prev => prev + 1);

            if (response.audio) setAudioUrl(response.audio);

            // Handle actions like booking confirmation
            if (response.data?.action === 'appointment_booked') {
                // Extract time if available in the fake data, otherwise default
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const time = (response.data as any)?.details?.time || "6:30 PM";
                setBookingTime(time);

                // Trigger Visual Sequence
                setIsBooking(true);

                // Actual Store Update (delayed slightly to match visual)
                setTimeout(() => {
                    updateAppointment('booked', {
                        doctorId: 'Sana AI',
                        time: time
                    });
                }, 3000);
            }
        } catch (error) {
            console.error("Failed to process voice:", error);
        } finally {
            updateAgent('idle');
        }
    };

    // Helper for shift logic
    const isShifted = isBooking || isAssignmentActive;

    return (
        <Layout
            headerContent={
                <>
                    <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-full">
                        <span className="text-white/90 text-sm font-medium hidden sm:inline font-display tracking-wide">
                            Hello, {user.name || 'Guest'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sana-primary to-sana-secondary flex items-center justify-center shadow-lg ring-2 ring-white/10">
                            <span className="text-white text-xs font-bold">{user.name?.[0] || 'G'}</span>
                        </div>
                    </div>
                </>
            }
        >
            <div className="relative w-full h-full bg-sana-bg overflow-hidden flex items-center justify-center">
                {/* Enhanced Stars Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-sana-gradient opacity-90"></div>

                    {/* Atmospheric Glows */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sana-primary/10 via-sana-bg to-transparent opacity-60"></div>

                    {/* Twinkling stars */}
                    <div className="absolute inset-0">
                        {[...Array(60)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-[2px] h-[2px] bg-white rounded-full animate-pulse"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 5}s`,
                                    opacity: Math.random() * 0.5 + 0.1
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Unified Content Wrapper (Shifts Left when booking or assignment) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-in-out z-10 ${isShifted ? '-translate-x-[20%]' : 'translate-x-0'}`}>

                    {/* Central Focus Glow */}
                    <div className="absolute pointer-events-none z-0">
                        <div className="w-[600px] h-[600px] bg-gradient-to-tr from-sana-primary/20 via-sana-secondary/10 to-transparent blur-[120px] rounded-full animate-pulse-slow"></div>
                    </div>

                    {/* Avatar Frame - Glassmorphic Circle */}
                    <div className="absolute pointer-events-none z-0">
                        <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] rounded-full border border-white/10 shadow-[0_0_80px_-10px_rgba(56,189,248,0.3)] bg-white/5 backdrop-blur-[2px]">
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
                        </div>
                    </div>

                    {/* 3D Avatar Canvas */}
                    <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] z-10">
                        <Canvas
                            shadows
                            dpr={window.devicePixelRatio}
                            gl={{ antialias: true, alpha: true }}
                            camera={{ position: [0, 0, 5], fov: 30 }}
                            style={{ background: 'transparent' }}
                        >
                            <Scene
                                audioUrl={audioUrl}
                                expression={expression}
                                animation={animation}
                                animationTrigger={animationTrigger}
                            />
                        </Canvas>
                    </div>
                </div>

                {/* Booking Progress Overlay (Right Side) */}
                <BookingOverlay isOpen={isBooking} onClose={() => setIsBooking(false)} time={bookingTime} />

                {/* Weekly Assignment Overlay (Right Side - Proactive) */}
                <WeeklyAssignment
                    onAvatarSpeak={(url, _text, expr, anim) => {
                        setAudioUrl(url);
                        if (expr) setExpression(expr);
                        if (anim) setAnimation(anim);
                        setAnimationTrigger(prev => prev + 1);
                    }}
                    onStatusChange={(status) => {
                        setIsAssignmentActive(status === 'active' || status === 'greeting' || status === 'completed');
                    }}
                />

                {/* Bottom Controls Container */}
                <div className="absolute bottom-10 left-0 right-0 z-50 flex items-center justify-between px-8 sm:px-16 max-w-7xl mx-auto pointer-events-none">

                    {/* Chat Trigger */}
                    <button
                        onClick={() => setIsChatbotOpen(true)}
                        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-sana-primary/20"
                    >
                        <div className="absolute inset-0 bg-sana-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <svg className="w-6 h-6 text-white/80 group-hover:text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sana-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sana-accent"></span>
                        </span>
                    </button>

                    {/* Status Text */}
                    <div className="flex flex-col items-center gap-2 pointer-events-auto">
                        <p className={`text-xs font-medium tracking-wide transition-all duration-700 ${isFirstVisit ? 'text-sana-primary' : 'text-sana-text-muted'}`}>
                            {isFirstVisit ? "Tap the microphone to speak" : "SANA is listening..."}
                        </p>
                    </div>

                    {/* Voice Input Trigger */}
                    <div className="pointer-events-auto relative z-50">
                        <VoiceInput onInput={handleVoiceInput} />
                    </div>
                </div>

                {/* Chatbot Overlay */}
                <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} userName={user?.name || undefined} />
            </div>
        </Layout>
    );
}

export default LandingPage;
