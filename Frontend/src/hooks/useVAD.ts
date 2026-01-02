import { useState, useRef, useEffect, useCallback } from 'react';

interface VADOptions {
    onSpeechStart?: () => void;
    onSpeechEnd?: (audioBlob: Blob) => void;
    minSilenceDuration?: number; // ms to wait before considering speech ended
    threshold?: number; // dB, typically -50 to -30
}

export function useVAD({ onSpeechStart, onSpeechEnd, minSilenceDuration = 1000, threshold = -45 }: VADOptions) {
    const [isListening, setIsListening] = useState(false); // VAD is active
    const [isSpeaking, setIsSpeaking] = useState(false); // User is currently speaking

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
    }, []);

    const timeoutCallback = useRef<(() => void) | undefined>();

    const start = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
            const MAX_WAIT_FOR_SPEECH = 4000; // 4s wait for user to start speaking

            const checkVolume = () => {
                if (!analyserRef.current) return;

                analyser.getByteFrequencyData(dataArray);

                // Calculate RMS
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / bufferLength);
                const isNoisy = rms > 15; // Tunable magic number

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
                    // Check if we waited too long for initial speech
                    if (!hasStartedRef.current && (Date.now() - listingStartTimestamp > MAX_WAIT_FOR_SPEECH)) {
                        console.log("VAD: Timeout - No speech detected");
                        cleanup();
                        if (timeoutCallback.current) timeoutCallback.current();
                        return; // Exit loop
                    }

                    if (hasStartedRef.current) {
                        // We were speaking, now silent
                        if (silenceStartRef.current === null) {
                            silenceStartRef.current = Date.now();
                        } else if (Date.now() - silenceStartRef.current > minSilenceDuration) {
                            // Speech ended
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
    }, [minSilenceDuration, onSpeechEnd, onSpeechStart, cleanup]);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        start,
        stop: cleanup,
        onTimeout: (cb: () => void) => { timeoutCallback.current = cb; },
        isListening,
        isSpeaking
    };
}
