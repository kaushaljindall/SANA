import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Layout } from '../components/Layout';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'sana';
    timestamp: Date;
}

function Chat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm SANA, your compassionate AI companion. How are you feeling today?",
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
        setInputText('');
        setIsTyping(true);

        // Simulate AI response
        setTimeout(() => {
            const sanaMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I hear you. It's completely okay to feel this way. Would you like to talk more about what's on your mind?",
                sender: 'sana',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, sanaMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Layout
            headerContent={
                <>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Chat with SANA</h1>
                    <div className="flex items-center gap-2 text-emerald-300 text-sm">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span>Online</span>
                    </div>
                </>
            }
        >
            <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-pink-950/5"></div>

                {/* Chat Container */}
                <div className="absolute inset-0 flex flex-col pt-20 pb-6">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] sm:max-w-[70%]`}>
                                        {message.sender === 'sana' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-white/70 text-sm font-medium">SANA</span>
                                            </div>
                                        )}
                                        <div
                                            className={`px-4 py-3 rounded-2xl ${message.sender === 'user'
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                : 'bg-white/5 backdrop-blur-sm text-white/90 border border-white/10'
                                                }`}
                                        >
                                            <p className="text-sm sm:text-base leading-relaxed">{message.text}</p>
                                        </div>
                                        <p className={`text-xs text-white/40 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-white/70 text-sm font-medium">SANA</span>
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
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
                    </div>

                    {/* Input Area */}
                    <div className="px-4 sm:px-8 pb-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                                <div className="flex gap-3 items-end">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Share what's on your mind..."
                                        rows={1}
                                        className="flex-1 bg-transparent text-white placeholder-white/40 resize-none focus:outline-none text-sm sm:text-base"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputText.trim()}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-500 disabled:to-gray-600 flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <Send className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-white/30 text-center mt-3">
                                SANA is here to listen and support you. Take your time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default Chat;
