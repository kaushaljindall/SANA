import { useRef, useState, useEffect } from "react";
import { Mic, X } from "lucide-react";
import { useStore } from "../store/useStore";
import { useVAD } from "../hooks/useVAD";

export default function VoiceInput({ onInput }: { onInput: (blob: Blob) => void }) {
    const [isRecording, setIsRecording] = useState(false); // Controls MediaRecorder state
    const [isProcessing, setIsProcessing] = useState(false);
    const [hintMessage, setHintMessage] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const isCancelledRef = useRef(false);

    const updateVoice = useStore(state => state.updateVoice);

    // Stops recording and PROCESSES the audio (Normal VAD End)
    const stopRecordingAndSubmit = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            isCancelledRef.current = false;
            mediaRecorderRef.current.stop();
        }
    };

    // Stops recording and DISCARDS the audio (Manual Cancel or Timeout)
    const cancelSession = (reason: string = "") => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            isCancelledRef.current = true;
            mediaRecorderRef.current.stop();
            if (reason) showHint(reason);
        } else {
            // If already inactive (e.g. VAD stopped VAD but recorder still winding down?), force cleanup
            cleanupSession();
            if (reason) showHint(reason);
        }
    };

    const cleanupSession = () => {
        setIsRecording(false);
        updateVoice({ listening: false });
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const showHint = (msg: string) => {
        setHintMessage(msg);
        setTimeout(() => setHintMessage(null), 3000);
    };

    const { isListening, isSpeaking, volume, startVAD, stopVAD } = useVAD({
        onSpeechStart: () => {
            console.log("Speech started");
            updateVoice({ speaking: true });
            setHintMessage(null);
        },
        onSpeechEnd: () => {
            console.log("Speech ended (Auto-stop)");
            stopRecordingAndSubmit(); // Trigger submission
        },
        onTimeout: () => {
            console.log("VAD Timeout");
            cancelSession("I’m listening whenever you’re ready.");
        },
        minVolume: 0.015,
        silenceDelay: 1200,
        maxDuration: 15000
    });

    const startSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            isCancelledRef.current = false; // Reset

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stopVAD(); // Stop VAD loop
                const cancelled = isCancelledRef.current;

                cleanupSession(); // UI cleanup

                // Process only if NOT cancelled and has data
                if (!cancelled && chunksRef.current.length > 0) {
                    setIsProcessing(true);
                    const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                    chunksRef.current = []; // Clear buffer

                    // Minimum processing display time for UX
                    const startTime = Date.now();
                    try {
                        await onInput(blob);
                    } catch (e) {
                        console.error("Input processing failed", e);
                        showHint("Something went wrong.");
                    }

                    const elapsed = Date.now() - startTime;
                    if (elapsed < 800) {
                        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
                    }
                    setIsProcessing(false);
                } else {
                    chunksRef.current = []; // Clear buffer on cancel
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            updateVoice({ listening: true });

            startVAD(stream);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            showHint("Please allow microphone access");
            setIsRecording(false);
        }
    };

    const handleMicClick = () => {
        if (isRecording) {
            // TAP WHILE RECORDING -> CANCEL
            cancelSession("Cancelled.");
        } else {
            // TAP WHILE IDLE -> START
            startSession();
        }
    };

    // UI Styles
    const dynamicScale = isListening ? 1 + Math.min(volume * 5, 0.4) : 1;
    const glowOpacity = isListening ? Math.min(volume * 10, 0.8) : 0;

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
            {/* Hints / Status Text */}
            {hintMessage && !isRecording && (
                <div className="mb-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 animate-fade-in text-center shadow-lg">
                    <p className="text-white/90 text-sm font-medium">{hintMessage}</p>
                </div>
            )}

            {isListening && !isSpeaking && !hintMessage && !isProcessing && (
                <div className="mb-4 bg-blue-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-blue-500/20 animate-fade-in text-center selection:bg-none pointer-events-none">
                    <p className="text-blue-200/90 text-sm tracking-wide">I'm listening...</p>
                </div>
            )}

            <button
                onClick={handleMicClick}
                disabled={isProcessing}
                style={{
                    transform: `scale(${dynamicScale})`,
                    boxShadow: isListening
                        ? `0 0 ${20 + volume * 150}px ${10 + volume * 80}px rgba(59, 130, 246, ${0.4 + glowOpacity})`
                        : undefined
                }}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl border border-white/10
                    ${isProcessing
                        ? "bg-slate-800 cursor-wait"
                        : isRecording
                            ? isSpeaking
                                ? "bg-red-500 hover:bg-red-600" // Speaking (Active)
                                : "bg-blue-600 hover:bg-blue-500" // Listening (Idle) - Click to Cancel
                            : "bg-blue-600 hover:bg-blue-500 hover:scale-105"}`} // Idle - Click to Start
                title={isRecording ? "Tap to Cancel" : isProcessing ? "Processing..." : "Tap to Speak"}
            >
                {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    // Show X icon on hover when recording, to imply 'Cancel'? 
                    // Simpler: Just rely on behavior. VAD is main driver.
                    // But maybe change icon to Stop/X if recording?
                    isRecording ? (
                        <div className="group relative w-full h-full flex items-center justify-center">
                            <Mic className={`absolute transition-opacity duration-300 ${isSpeaking ? "opacity-100 scale-110" : "opacity-100"}`} color="white" size={28} />
                            {/* Optional: Overlay an X on hover could be nice but complexity. Keeping simple. */}
                        </div>
                    ) : (
                        <Mic className="text-white w-7 h-7" />
                    )
                )}

                {/* Processing Ring */}
                {isProcessing && (
                    <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin"></div>
                )}
            </button>
        </div>
    );
}
