import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startWebRTC, stopWebRTC, toggleAudio, toggleVideo } from "../services/webrtcService";
import { ApiService } from "../services/ApiService";
import { useStore } from "../store/useStore";

export default function LiveSession() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    // const [status, setStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting'); // Kept for future use
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Global State Sync
    const { updateCall, updateVoice, updateAppointment } = useStore();

    useEffect(() => {
        let isMounted = true;

        const verifyAndStart = async () => {
            if (!id) return;

            try {
                // Verify appointment exists
                const details = await ApiService.getAppointmentDetails(id);

                // Sync appointment details to global store
                updateAppointment('upcoming_appointment', {
                    doctorId: details.doctor_id,
                    time: details.scheduled_time?.toString()
                });

                // If verified, start WebRTC flow
                if (isMounted) {
                    if (localVideoRef.current && remoteVideoRef.current) {
                        await startWebRTC(localVideoRef.current, remoteVideoRef.current);
                        // setStatus('connected');
                        updateCall('live');

                        // Notify backend session started
                        ApiService.startSession(id).catch(console.error);
                    }
                }
            } catch (error) {
                console.error("Invalid session:", error);
                alert("Session invalid or expired");
                navigate('/appointments');
            }
        };

        const timer = setTimeout(() => {
            verifyAndStart();
        }, 1000);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            stopWebRTC();
            updateCall('ended');
        };
    }, [id, navigate, updateCall, updateAppointment]);

    const handleEndCall = () => {
        stopWebRTC();
        // setStatus('ended');
        updateCall('ended');
        updateAppointment('none'); // Clear active appointment state
        navigate('/appointments');
    };

    return (
        <div className="h-screen bg-sana-bg text-white flex flex-col relative overflow-hidden font-sans">
            {/* Global Gradient Background */}
            <div className="absolute inset-0 bg-sana-gradient pointer-events-none opacity-50"></div>

            {/* Header / Controls overlay */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-bold opacity-90 tracking-wide">Live Session</h2>
                        <p className="text-sm opacity-60 font-light">with Dr. Sarah Mitchell</p>
                    </div>
                </div>
                <div className="bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                    LIVE
                </div>
            </div>

            {/* Video Grid */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full flex flex-col sm:flex-row p-4 pt-24 pb-32 gap-4">
                    {/* Doctor Video Area */}
                    <div className="flex-1 relative bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center group backdrop-blur-sm">
                        {/* Placeholder / Background (Visible if video is loading/off) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/50 to-black/50 z-0">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-sana-primary to-blue-600 flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-pulse-slow">
                                <span className="text-4xl font-bold text-white tracking-widest">SANA</span>
                            </div>
                            <p className="mt-6 text-sana-primary/80 font-bold tracking-widest text-sm uppercase">Connecting to Doctor...</p>
                        </div>

                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            className="w-full h-full object-cover relative z-10"
                        />

                        <div className="absolute bottom-6 left-6 glass-panel px-6 py-2 rounded-full text-sm font-bold z-20">
                            Dr. Sarah Mitchell
                        </div>
                    </div>

                    {/* User Video Area */}
                    <div className="w-full sm:w-1/3 sm:aspect-[3/4] relative bg-black/40 rounded-3xl overflow-hidden border border-white/10 shadow-lg group backdrop-blur-sm">
                        {isVideoOff ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shadow-inner mb-4 border border-white/5">
                                    <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <p className="text-white/40 text-sm font-medium">Video Paused</p>
                            </div>
                        ) : (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        )}

                        {/* Muted Indicator Overlay */}
                        {isMuted && (
                            <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-sm p-3 rounded-full shadow-lg border border-red-400/50 animate-fade-in z-20">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                            </div>
                        )}

                        <div className="absolute bottom-6 left-6 glass-panel px-6 py-2 rounded-full text-sm font-bold z-10 transition-opacity group-hover:opacity-100">
                            You {isMuted && '(Muted)'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls - Fixed */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-8 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent pb-12">
                <button
                    onClick={() => {
                        const newMuteState = !isMuted;
                        setIsMuted(newMuteState);
                        updateVoice({ muted: newMuteState });
                        toggleAudio(!newMuteState);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}
                >
                    {isMuted ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    )}
                </button>

                <button
                    onClick={handleEndCall}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-bold text-lg shadow-xl shadow-red-900/40 transition-all flex items-center gap-3 transform hover:scale-105 active:scale-95 border border-red-500/30"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2 2l2 2m-2-2l-2-2m-1 3.414a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414-1.414l-5-5a1 1 0 00-1.414 0zM15 11l-3-3m0 0l-3 3m3-3V3" /></svg>
                    End Session
                </button>

                <button
                    onClick={() => {
                        const newVideoState = !isVideoOff;
                        setIsVideoOff(newVideoState);
                        toggleVideo(!newVideoState);
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                        }`}
                >
                    {isVideoOff ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
}
