import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import { useVAD } from '../hooks/useVAD';
import { Mic, MicOff, CheckCircle } from 'lucide-react';

interface WeeklyAssignmentProps {
    onAvatarSpeak: (audioUrl: string, text: string, expression?: string, animation?: string) => void;
    onStatusChange: (status: 'idle' | 'greeting' | 'active' | 'completed') => void;
}

export function WeeklyAssignment({ onAvatarSpeak, onStatusChange }: WeeklyAssignmentProps) {
    const [step, setStep] = useState<'idle' | 'greeting' | 'active' | 'completed'>('idle');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [processing, setProcessing] = useState(false);

    // VAD Hook
    const { start: startVAD, stop: stopVAD, onTimeout, isListening, isSpeaking } = useVAD({
        onSpeechStart: () => {
            console.log("User started speaking...");
        },
        onSpeechEnd: async (blob) => {
            console.log("User finished speaking. Processing...");
            await handleResponse(blob);
        }
    });

    // Handle VAD Timeout
    useEffect(() => {
        onTimeout(() => {
            console.log("VAD Timeout triggered in UI");
            setStep('idle');
            onStatusChange('idle');
        });
    }, [onTimeout, onStatusChange]);

    // Check Due Date on Mount
    useEffect(() => {
        const check = async () => {
            try {
                const { due } = await ApiService.checkWeeklyDue();
                if (due) {
                    setStep('greeting');
                    onStatusChange('greeting');
                    // Greet
                    // In a real app, generate TTS for this greeting dynamically
                    // For now, assume we trigger it.
                    // "Hello [Name], it's time for your weekly check-in. Would you like to do it now?"
                    // Simulating via text for now, assuming onAvatarSpeak will handle TTS generation if URL not provided? 
                    // No, ApiService usually provides URL. I'll just skip the automated TTS strictly here or fetch it.
                    // Let's assume the user has to click "Start" for the very first step to respect "Proactive" but not "Intrusive" 
                    // OR we trigger it if the user is idle.
                    // For this demo, let's just show the prompt.
                }
            } catch (e) {
                console.error(e);
            }
        };
        check();
    }, []);

    const startSession = async () => {
        try {
            const res = await ApiService.startWeeklySession();
            setSessionId(res.session_id);
            setCurrentQuestion(res.text);
            setProgress(res.progress);
            setStep('active');
            onStatusChange('active');

            if (res.audio_url) {
                onAvatarSpeak(res.audio_url, res.text, 'default', 'Talking');
            }

            // Start listening automatically after SANA speaks? 
            // We need a delay to avoid recording SANA's voice.
            // Ideally, we wait for audio 'ended' event, but for now a simple timeout is a MVP fix.
            if (res.session_id) {
                setTimeout(() => {
                    // Safety check if component is still mounted and function exists
                    if (startVAD) startVAD();
                }, 4000); // Wait for SANA to finish roughly
            }

        } catch (e) {
            console.error(e);
        }
    };

    const handleResponse = async (blob: Blob) => {
        if (!sessionId) return;
        setProcessing(true);
        stopVAD(); // Stop listening while processing

        try {
            const res = await ApiService.submitWeeklyResponse(sessionId, blob);

            if (res.status === 'completed') {
                setStep('completed');
                onStatusChange('completed');
                onAvatarSpeak(res.audio_url, res.text, 'happy', 'Clapping');
            } else {
                setCurrentQuestion(res.next_question);
                setProgress(res.progress);
                onAvatarSpeak(res.audio_url, res.text, 'default', 'Talking');

                // Resume listening
                setTimeout(() => {
                    startVAD();
                }, 4000);
            }
        } catch (e) {
            console.error(e);
            alert("Error processing response");
        } finally {
            setProcessing(false);
        }
    };

    // UI Renders
    if (step === 'idle') return null;

    if (step === 'greeting') {
        return (
            <div className="absolute top-24 right-8 w-80 glass-panel p-6 rounded-3xl animate-fade-in-right z-40 border border-sana-primary/30 shadow-2xl">
                <h3 className="text-white font-display text-lg mb-2">Weekly Check-in</h3>
                <p className="text-sana-text-muted text-sm mb-4">It's time for your weekly reflection. Ready to start?</p>
                <div className="flex gap-2">
                    <button onClick={startSession} className="flex-1 bg-sana-primary hover:bg-sana-primary/80 text-white rounded-xl py-2 text-sm font-medium transition-colors">
                        Yes, let's do it
                    </button>
                    <button onClick={() => { setStep('idle'); onStatusChange('idle'); }} className="px-4 py-2 hover:bg-white/10 rounded-xl text-white/60 text-sm transition-colors">
                        Later
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'completed') {
        return (
            <div className="absolute top-24 right-8 w-80 glass-panel p-6 rounded-3xl animate-fade-in-right z-40 border border-emerald-500/30 shadow-2xl flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-display text-lg mb-1">All Done!</h3>
                <p className="text-sana-text-muted text-sm">Great job reflecting today.</p>
                <button onClick={() => { setStep('idle'); onStatusChange('idle'); }} className="mt-4 text-xs text-white/40 hover:text-white transition-colors">Close</button>
            </div>
        );
    }

    return (
        <div className="absolute top-24 right-8 w-80 glass-panel p-6 rounded-3xl animate-fade-in-right z-[100] border border-sana-primary/30 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-display text-lg">Question {Math.floor(progress / 33) + 1}</h3>
                <span className="text-xs font-mono text-sana-primary bg-sana-primary/10 px-2 py-1 rounded-full">{Math.round(progress)}%</span>
            </div>

            <p className="text-white/90 text-lg font-light leading-relaxed mb-8">
                "{currentQuestion}"
            </p>

            {/* Status Indicator */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-sana-primary animate-pulse scale-110' : processing ? 'bg-yellow-500/20' : isListening ? 'bg-white/10' : 'bg-white/5'}`}>
                    {isSpeaking ? (
                        <Mic className="w-5 h-5 text-white" />
                    ) : processing ? (
                        <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : isListening ? (
                        <Mic className="w-5 h-5 text-white/50" />
                    ) : (
                        <MicOff className="w-5 h-5 text-white/30" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">
                        {isSpeaking ? "Listening..." : processing ? "Processing..." : isListening ? "Waiting for you..." : "Mic inactive"}
                    </p>
                    <p className="text-xs text-white/40">
                        {isSpeaking ? "Speak naturally" : isListening ? "Auto-detect active" : "paused"}
                    </p>
                </div>
            </div>

            <button onClick={() => { stopVAD(); setStep('idle'); onStatusChange('idle'); }} className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}
