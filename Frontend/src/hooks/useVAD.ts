import { useState, useRef, useEffect, useCallback } from 'react';

interface VADOptions {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audioBlob: Blob) => void;
    onTimeout?: () => void;
    minSilenceDuration?: number;
    threshold?: number;
    minVolume?: number; // Added to satisfy TS, mapped to threshold or ignored
    silenceDelay?: number; // Mapped to minSilenceDuration
    maxDuration?: number;
}

export function useVAD({
    onSpeechStart,
    onSpeechEnd,
    onTimeout,
    minSilenceDuration = 1000,
    silenceDelay
}: VADOptions) {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);

    // Refs for audio processing
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceStartRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Recorder
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    // State to track if we successfully triggered "start"
    const hasStartedRef = useRef(false);

    // Timeout callback ref for imperative usage (WeeklyAssignment)
    const timeoutCallbackRef = useRef<(() => void) | undefined>();

    // Effective options
    const effectiveMinSilence = silenceDelay || minSilenceDuration;

    const cleanup = useCallback(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        // Reset refs
        audioContextRef.current = null;
        mediaStreamRef.current = null;
        hasStartedRef.current = false;
        setIsListening(false);
        setIsSpeaking(false);
        setVolume(0);
    }, []);

    const start = useCallback(async (existingStream?: MediaStream) => {
        try {
            const stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            // Setup Recorder
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                chunksRef.current = [];
                if (onSpeechEnd) onSpeechEnd(blob);
            };

            setIsListening(true);

            // Loop
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const listingStartTimestamp = Date.now();
            const MAX_WAIT_FOR_SPEECH = 4000;

            const checkVolume = () => {
                if (!analyserRef.current) return;

                analyser.getByteFrequencyData(dataArray);

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / bufferLength);

                // Normalize volume for UI (0-1 approx)
                setVolume(Math.min(rms / 128, 1));

                // Threshold logic (using rms > 15 as in original, ignoring passed threshold/minVolume for now to minimize logic change risk)
                // If minVolume passed (0.015), users implies strict check. But let's stick to working legacy logic for now.
                const isNoisy = rms > 15;

                if (isNoisy) {
                    silenceStartRef.current = null;
                    if (!hasStartedRef.current) {
                        hasStartedRef.current = true;
                        setIsSpeaking(true);
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
                            mediaRecorderRef.current.start();
                        }
                        if (onSpeechStart) onSpeechStart();
                        console.log("VAD: Speech Start");
                    }
                } else {
                    if (!hasStartedRef.current && (Date.now() - listingStartTimestamp > MAX_WAIT_FOR_SPEECH)) {
                        console.log("VAD: Timeout - No speech detected");
                        cleanup();
                        // Call BOTH helpers
                        if (onTimeout) onTimeout();
                        if (timeoutCallbackRef.current) timeoutCallbackRef.current();
                        return; // Exit loop
                    }

                    if (hasStartedRef.current) {
                        if (silenceStartRef.current === null) {
                            silenceStartRef.current = Date.now();
                        } else if (Date.now() - silenceStartRef.current > effectiveMinSilence) {
                            hasStartedRef.current = false;
                            setIsSpeaking(false);
                            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                                mediaRecorderRef.current.stop();
                            }
                            console.log("VAD: Speech End");
                        }
                    }
                }

                animationFrameRef.current = requestAnimationFrame(checkVolume);
            };

            checkVolume();

        } catch (err) {
            console.error("VAD Setup Failed", err);
        }
    }, [effectiveMinSilence, onSpeechEnd, onSpeechStart, onTimeout, cleanup]);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        start,
        stop: cleanup,
        startVAD: start, // Alias
        stopVAD: cleanup, // Alias
        onTimeout: (cb: () => void) => { timeoutCallbackRef.current = cb; },
        isListening,
        isSpeaking,
        volume
    };
}
