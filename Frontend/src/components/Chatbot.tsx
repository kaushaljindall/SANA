import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import { ApiService } from '../services/ApiService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'sana';
    timestamp: Date;
}

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Chatbot({ isOpen, onClose }: ChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm SANA. I'm here to listen. How are you feeling today?",
            sender: 'sana',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        setIsTyping(true);

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
        <div className="fixed bottom-24 left-4 sm:left-10 z-[90] w-[calc(100%-2rem)] sm:w-96 h-[500px] bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-sm">SANA</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            <p className="text-white/60 text-xs">Online</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                >
                    <X className="w-5 h-5 text-white/70" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%]`}>
                            {message.sender === 'sana' && (
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white/50 text-xs font-medium">SANA</span>
                                </div>
                            )}
                            <div
                                className={`px-4 py-2.5 rounded-2xl ${message.sender === 'user'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : 'bg-white/5 text-white/90 border border-white/10'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                            <p className={`text-xs text-white/30 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%]">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-white/50 text-xs font-medium">SANA</span>
                            </div>
                            <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-white/10">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex gap-2 items-end">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-white/40 resize-none focus:outline-none text-sm"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-700 flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
                <p className="text-xs text-white/20 text-center mt-2">
                    SANA is here to listen and support you
                </p>
            </div>
        </div>
    );
}
