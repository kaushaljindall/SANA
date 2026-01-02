import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles, CheckCircle } from 'lucide-react';
import { ApiService } from '../services/ApiService';
import { useStore } from '../store/useStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'sana';
    timestamp: Date;
}

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    // userName is now pulled from store, but keeping prop for backwards compatibility if needed
    userName?: string;
}

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
    // Global State
    const { user, updateAgent, updateAppointment } = useStore();

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: user.name ? `Hey ${user.name}, how are you?` : "Hello! I'm SANA. I'm here to listen. How are you feeling today?",
            sender: 'sana',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sync isTyping with agent status for external visibility
    useEffect(() => {
        if (isTyping) updateAgent('processing');
        else updateAgent('idle');
    }, [isTyping, updateAgent]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (showBookingSuccess) {
            const timer = setTimeout(() => {
                setShowBookingSuccess(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showBookingSuccess]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputText;
        setInputText('');
        setIsTyping(true); // Triggers agent processing state

        try {
            // Call the real Gemini LLM API
            const response = await ApiService.sendChat(currentInput);

            const sanaMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'sana',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, sanaMessage]);
            setIsTyping(false);

            // Check if booking was successful
            if (response.data?.appointment_id) {
                setShowBookingSuccess(true);
                // Update global appointment state
                updateAppointment('booked', {
                    doctorId: 'Sana AI', // Could extract real doc info if api provided it
                    time: 'Upcoming'
                });
            }

        } catch (error) {
            console.error('Failed to get response:', error);

            // Fallback error message
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'sana',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 left-4 sm:left-10 z-[90] w-[calc(100%-2rem)] sm:w-96 h-[550px] glass-panel rounded-[2rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sana-primary to-sana-secondary flex items-center justify-center shadow-lg shadow-sana-primary/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-display font-semibold text-sm tracking-wide">SANA</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></div>
                            <p className="text-sana-text-muted text-[10px] font-medium tracking-wide uppercase">AI Companion</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center group"
                >
                    <X className="w-5 h-5 text-white/50 group-hover:text-white group-hover:rotate-90 transition-all" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%]`}>
                            <div
                                className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${message.sender === 'user'
                                    ? 'bg-gradient-to-br from-sana-primary to-sana-secondary text-white rounded-br-none'
                                    : 'bg-white/5 border border-white/10 text-sana-text rounded-bl-none backdrop-blur-sm'
                                    }`}
                            >
                                {message.text}
                            </div>
                            <p className={`text-[10px] text-white/20 mt-1.5 font-medium ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="px-5 py-4 rounded-2xl rounded-bl-none bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-sana-primary/60 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-sana-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 bg-sana-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Success Animation Overlay */}
            {showBookingSuccess && (
                <div className="absolute inset-x-6 top-24 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 z-50">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">Booking Confirmed</h4>
                        <p className="text-emerald-200/70 text-xs mt-0.5">Your session is scheduled.</p>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-5 py-5 border-t border-white/5 bg-white/5 backdrop-blur-md">
                <div className="relative">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-sana-primary/30 focus:bg-slate-900/70 transition-all text-sm resize-none"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-sana-primary/20 hover:bg-sana-primary text-sana-primary hover:text-white disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center transition-all duration-200"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                    <div className="absolute -bottom-5 left-0 right-0 text-center">
                        <span className="text-[10px] text-white/10 font-medium tracking-wider uppercase">Encrypted & Private</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
