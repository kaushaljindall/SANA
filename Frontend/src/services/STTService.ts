type STTCallbacks = {
    onStart?: () => void;
    onEnd?: () => void;
    onResult: (text: string) => void;
    onError?: (error: any) => void;
};

export class STTService {
    private recognition: any = null;

    constructor(callbacks: STTCallbacks) {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            throw new Error("Speech Recognition not supported in this browser");
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = "en-IN"; // Hinglish friendly
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => callbacks.onStart?.();
        this.recognition.onend = () => callbacks.onEnd?.();

        this.recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            callbacks.onResult(text);
        };

        this.recognition.onerror = (event: any) => {
            callbacks.onError?.(event);
        };
    }

    start() {
        this.recognition?.start();
    }

    stop() {
        this.recognition?.stop();
    }
}
