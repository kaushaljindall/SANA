import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/ApiService';
import { Layout } from '../components/Layout';
import { AvatarCanvas } from '../components/canvas/AvatarCanvas';
import { Send, BarChart2, CheckCircle, X, Mic, MicOff } from 'lucide-react';

interface AssessmentState {
    sessionId: string | null;
    nextQuestion: string | null;
    progress: number;
    shouldStop: boolean;
    feedback: string | null;
    audioUrl?: string | null;
}

export default function AssessmentPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [state, setState] = useState<AssessmentState>({
        sessionId: null,
        nextQuestion: null,
        progress: 0,
        shouldStop: false,
        feedback: null,
        audioUrl: null
    });

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const startAssessment = async () => {
        setLoading(true);
        try {
            const res = await ApiService.startAssessment();
            setState({
                sessionId: res.session_id,
                nextQuestion: res.next_question,
                progress: res.progress,
                shouldStop: res.should_stop,
                feedback: null,
                audioUrl: res.audio_url
            });
        } catch (e) {
            console.error(e);
            alert("Failed to start assessment");
        } finally {
            setLoading(false);
        }
    };

    // Start on mount
    useEffect(() => {
        startAssessment();
    }, []);

    // Voice Handling
    const toggleRecording = async () => {
        if (loading) return;

        if (isRecording) {
            // Stop
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // Start
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;
                chunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    // Submit
                    if (state.sessionId) {
                        setLoading(true);
                        try {
                            const res = await ApiService.submitAssessmentVoice(state.sessionId, blob);
                            setState(prev => ({
                                ...prev,
                                sessionId: res.session_id,
                                nextQuestion: res.next_question,
                                progress: res.progress,
                                shouldStop: res.should_stop,
                                feedback: res.feedback || null,
                                audioUrl: res.audio_url // Ensure this triggers re-render
                            }));
                        } catch (e) {
                            console.error(e);
                            alert("Failed to process voice response");
                        } finally {
                            setLoading(false);
                        }
                    }

                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Mic Error:", err);
                alert("Could not access microphone");
            }
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!userInput.trim() || !state.sessionId) return;

        const currentInput = userInput;
        setUserInput('');
        setLoading(true);

        try {
            const res = await ApiService.submitAssessmentResponse(state.sessionId, currentInput);
            setState(prev => ({
                ...prev,
                sessionId: res.session_id,
                nextQuestion: res.next_question,
                progress: res.progress,
                shouldStop: res.should_stop,
                feedback: res.feedback || null,
                audioUrl: res.audio_url
            }));
        } catch (e) {
            console.error(e);
            alert("Failed to submit response");
            setUserInput(currentInput); // Restore input
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="h-screen flex flex-col items-center pt-24 pb-8 px-4 overflow-hidden">
                <div className="w-full max-w-4xl h-full flex flex-col gap-6">

                    {/* Header Controls */}
                    <div className="flex justify-between items-center px-4">
                        <div>
                            <h1 className="h1-display text-2xl">Reflective Space</h1>
                            <p className="text-sana-text-muted text-xs">A safe conversation with SANA</p>
                        </div>
                        <button onClick={() => navigate('/auth')} className="p-2 rounded-full hover:bg-white/5 transition">
                            <X className="w-6 h-6 text-white/40 hover:text-white" />
                        </button>
                    </div>

                    {/* Avatar Area */}
                    <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden bg-slate-900/40 border border-sana-primary/20 shadow-2xl">
                        {/* Removed gradient overlay to prevent potential blurring/occlusion */}
                        <AvatarCanvas audioUrl={state.audioUrl || null} />

                        {/* Progress Badge */}
                        <div className="absolute top-6 left-6 z-20 glass-panel px-4 py-1.5 rounded-full flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-sana-primary" />
                            <span className="text-xs font-mono text-sana-text-muted">DEPTH {Math.min(3, Math.floor(state.progress / 2) + 1)}</span>
                        </div>
                    </div>

                    {/* Interaction Area */}
                    <div className="min-h-[180px] glass-panel p-6 rounded-3xl animate-fade-in-up flex flex-col justify-between">

                        {loading && !state.nextQuestion && !state.feedback ? (
                            <div className="flex items-center justify-center h-full gap-3">
                                <div className="loader w-6 h-6"></div>
                                <p className="text-white/40 font-light">Thinking...</p>
                            </div>
                        ) : state.shouldStop ? (
                            <div className="text-center h-full flex flex-col items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                                <p className="text-white/90 text-sm mb-4 max-w-lg">{state.feedback}</p>
                                <button onClick={() => navigate('/auth')} className="glass-button px-6 py-2 text-sm">Review Profile</button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-medium text-white mb-4 leading-snug text-center">
                                    "{state.nextQuestion}"
                                </h2>

                                <div className="flex items-center gap-3">
                                    {/* Mic Button */}
                                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                    {/* @ts-ignore */}
                                    <button
                                        onClick={toggleRecording}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording
                                            ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {isRecording ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                                    </button>

                                    {/* Text Input */}
                                    <form onSubmit={handleSubmit} className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder={isRecording ? "Listening..." : "Type your answer..."}
                                            className="glass-input w-full pr-12 py-3.5"
                                            disabled={loading || isRecording}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!userInput.trim() || loading}
                                            className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-white/60 hover:text-white"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
