import { useRef, useState } from "react";
import { Mic } from "lucide-react";

export default function VoiceInput({ onInput }: { onInput: (blob: Blob) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsRecording(false);
                setIsProcessing(true);

                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                chunksRef.current = [];

                // Minimum processing display time
                const startTime = Date.now();
                await onInput(blob);
                const elapsed = Date.now() - startTime;
                if (elapsed < 500) {
                    await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
                }

                setIsProcessing(false);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Please allow microphone access");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
                ${isProcessing
                    ? "bg-yellow-500 cursor-wait shadow-yellow-500/50"
                    : isRecording
                        ? "bg-red-500 animate-pulse shadow-red-500/50"
                        : "bg-blue-600 hover:bg-blue-500 hover:scale-110 shadow-blue-600/50"}`}
            title={isRecording ? "Click to stop recording" : isProcessing ? "Processing..." : "Click to start recording"}
        >
            {isProcessing ? (
                <span className="text-white text-3xl animate-spin">⏳</span>
            ) : (
                <Mic className={`${isRecording ? "text-white w-8 h-8" : "text-white/90 w-7 h-7"}`} />
            )}

            {isRecording && (
                <span className="absolute -bottom-8 text-xs text-white/80 font-semibold whitespace-nowrap">
                    Recording... (click to stop)
                </span>
            )}

            {isProcessing && (
                <span className="absolute -bottom-8 text-xs text-yellow-300 font-bold">
                    Processing...
                </span>
            )}
        </button>
    );
}
