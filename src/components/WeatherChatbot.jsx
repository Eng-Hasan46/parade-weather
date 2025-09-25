import { useState, useRef, useEffect } from 'react';
import GeminiAIService from '../lib/geminiAI.js';
import { config } from '../config.js';

export default function WeatherChatbot({ weatherData, currentPlace, lang = 'en' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const messagesEndRef = useRef(null);
    const aiService = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize AI service when API key changes
    useEffect(() => {
        if (apiKey) {
            aiService.current = new GeminiAIService(apiKey);
            localStorage.setItem('gemini_api_key', apiKey);
        }
    }, [apiKey]);

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage = {
                id: Date.now(),
                type: 'bot',
                content: lang === 'ar'
                    ? 'مرحباً! أنا مساعد الطقس الذكي. أستخدم الذكاء الاصطناعي لتحليل بيانات الطقس ومساعدتك في التخطيط لأنشطتك.'
                    : 'Hello! I\'m your intelligent weather assistant. I use AI to analyze weather data and help you plan your activities.',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [lang]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // Check if API key is available (from environment or user input)
        const hasApiKey = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
        if (!hasApiKey) {
            const errorMessage = {
                id: Date.now(),
                type: 'bot',
                content: lang === 'ar'
                    ? 'يرجى إدخال مفتاح Gemini API أولاً من إعدادات الدردشة.'
                    : 'Please enter your Gemini API key first from the chat settings.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setShowApiKeyInput(true);
            return;
        }

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            // Call Gemini AI service
            const aiResponse = await aiService.current.generateResponse(
                currentInput,
                weatherData,
                currentPlace,
                lang
            );

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('AI Response Error:', error);

            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: lang === 'ar'
                    ? 'عذراً، حدث خطأ في الحصول على الرد. يرجى التحقق من مفتاح API والمحاولة مرة أخرى.'
                    : 'Sorry, there was an error getting a response. Please check your API key and try again.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSaveApiKey = () => {
        if (apiKey.trim()) {
            setShowApiKeyInput(false);
            const confirmMessage = {
                id: Date.now(),
                type: 'bot',
                content: lang === 'ar'
                    ? 'تم حفظ مفتاح API بنجاح! يمكنك الآن طرح أسئلتك حول الطقس.'
                    : 'API key saved successfully! You can now ask me weather questions.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMessage]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? 'scale-90' : 'scale-100 hover:scale-105'}`}
            >
                {isOpen ? (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                ) : (
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-96 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-600/30 rounded-2xl shadow-2xl flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-slate-600/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 text-blue-400 text-2xl">🤖</div>
                            <div>
                                <h3 className="font-semibold text-white">
                                    {lang === 'ar' ? 'مساعد الطقس الذكي' : 'AI Weather Assistant'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    {lang === 'ar' ? 'مدعوم بـ Gemini AI' : 'Powered by Gemini AI'}
                                </p>
                            </div>
                        </div>

                        {/* Settings button */}
                        <button
                            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title={lang === 'ar' ? 'إعدادات API' : 'API Settings'}
                        >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                        </button>
                    </div>

                    {/* API Key Input (when visible) */}
                    {showApiKeyInput && (
                        <div className="p-4 border-b border-slate-600/30 bg-slate-800/50">
                            <div className="mb-2">
                                <label className="text-sm text-white font-medium">
                                    {lang === 'ar' ? 'مفتاح Gemini API' : 'Gemini API Key'}
                                </label>
                                <p className="text-xs text-slate-400 mt-1">
                                    {lang === 'ar'
                                        ? 'احصل على مفتاح مجاني من Google AI Studio'
                                        : 'Get a free key from Google AI Studio'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={lang === 'ar' ? 'أدخل مفتاح API...' : 'Enter API key...'}
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                    onClick={handleSaveApiKey}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    {lang === 'ar' ? 'حفظ' : 'Save'}
                                </button>
                            </div>
                            <div className="mt-2">
                                <a
                                    href="https://makersuite.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                    {lang === 'ar' ? 'احصل على مفتاح API مجاني' : 'Get free API key →'}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg text-sm ${message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-100'
                                        }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-700 text-slate-100 p-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-600/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={lang === 'ar' ? 'اسأل عن الطقس...' : 'Ask about weather...'}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isTyping}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}