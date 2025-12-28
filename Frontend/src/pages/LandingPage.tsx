import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '../components/canvas/Scene';
import { ApiService } from '../services/ApiService';
import VoiceInput from '../components/VoiceInput';
import { Layout } from '../components/Layout';
import { Chatbot } from '../components/Chatbot';

function LandingPage() {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [expression, setExpression] = useState("default");
    const [animation, setAnimation] = useState("Idle");
    const [animationTrigger, setAnimationTrigger] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    const handleVoiceInput = async (audioBlob: Blob) => {
        try {
            setIsListening(true);
            const response = await ApiService.sendVoice(audioBlob);

            setExpression(response.facialExpression);
            setAnimation(response.animation);
            setAnimationTrigger(prev => prev + 1);

            if (response.audio) setAudioUrl(response.audio);
        } catch (error) {
            console.error("Failed to process voice:", error);
        } finally {
            setIsListening(false);
        }
    };

    return (
        <Layout
            headerContent={
                <>
                    <div></div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20">
                        <span className="text-white/90 text-xs sm:text-sm font-medium hidden sm:inline">Hello, Kaushal</span>
                        <span className="text-white/90 text-xs font-medium sm:hidden">Hi, K</span>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs sm:text-sm font-bold">K</span>
                        </div>
                    </div>
                </>
            }
        >
            <div className="relative w-full h-full bg-[#0a0e27]">
                {/* Stars Background */}
                <div className="absolute inset-0">
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-purple-950/30 to-pink-950/20"></div>

                    {/* Twinkling stars */}
                    <div className="absolute inset-0">
                        {[...Array(100)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    opacity: Math.random() * 0.7 + 0.3
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Soft Glow Behind Avatar */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                    <div className="w-[550px] h-[550px] bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-[100px] rounded-full"></div>
                </div>

                {/* Avatar Frame */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] rounded-[30px] sm:rounded-[40px] md:rounded-[50px] border-4 sm:border-[5px] md:border-[6px] border-cyan-500/60 shadow-2xl shadow-cyan-500/30 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-indigo-900/20">
                        {/* Inner subtle glow */}
                        <div className="absolute inset-0 rounded-[26px] sm:rounded-[36px] md:rounded-[44px] bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5"></div>
                    </div>
                </div>

                {/* 3D Avatar Canvas */}
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px]">
                        <Canvas
                            shadows
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

                {/* Bottom Left: Chat Button - More Prominent */}
                <button
                    onClick={() => setIsChatbotOpen(true)}
                    className="absolute bottom-6 sm:bottom-10 left-4 sm:left-10 z-50 group"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer group-hover:border-white/30">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </button>

                {/* Chatbot */}
                <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

                {/* Bottom Center: Reassuring Text */}
                <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-30">
                    <p className="text-[10px] sm:text-xs text-white/40 font-medium text-center px-4">You're safe here. Take your time.</p>
                </div>

                {/* Bottom Right: Voice Button */}
                <div className="absolute bottom-6 sm:bottom-10 right-4 sm:right-10 z-50">
                    <VoiceInput onInput={handleVoiceInput} />
                </div>
            </div>
        </Layout>
    );
}

export default LandingPage;
