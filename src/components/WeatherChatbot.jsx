import { useState, useRef, useEffect } from 'react';
import GeminiAIService from '../lib/geminiAI.js';
import { config } from '../config.js';

export default function WeatherChatbot({ weatherData, currentPlace, nasaData, lang = 'en' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [includeNASAData, setIncludeNASAData] = useState(false);
    const messagesEndRef = useRef(null);
    const aiService = useRef(null);

    // Function to clean markdown formatting from AI responses
    const cleanMarkdownText = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
            .replace(/\*(.*?)\*/g, '$1')     // Remove italic formatting
            .replace(/#{1,6}\s/g, '')        // Remove heading markers
            .replace(/`(.*?)`/g, '$1')       // Remove inline code formatting
            .replace(/\n\s*\*/g, '\n•')      // Convert markdown bullets to bullet points
            .replace(/\n\s*-/g, '\n•')       // Convert dashes to bullet points
            .trim();
    };

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
                    ? 'مرحباً! 🌤️ أنا خبير الطقس والمناخ الذكي\n\nأتخصص حصرياً في:\n• تحليل الطقس الحالي والتوقعات 📊\n• مقارنة البيانات مع المناخ التاريخي (ناسا) 📈\n• اقتراح وجهات سفر مناسبة للطقس المطلوب ✈️\n• توصيات الأنشطة الخارجية حسب الظروف الجوية 🏃‍♂️\n• نصائح ملابس وتوقيت مثالي للخروج 👕\n• تحليل أنماط الطقس والاتجاهات المناخية 🌡️\n\nملاحظة مهمة: أركز فقط على مواضيع الطقس والمناخ\n\nجرب السؤال:\n"حلل لي الطقس الحالي"\n"أين أذهب في طقس مشمس؟"\n"قارن الطقس اليوم مع المعدل التاريخي"\n"متى أفضل وقت للنشاطات الخارجية؟"'
                    : 'Hello! 🌤️ I\'m your dedicated Weather & Climate Expert\n\nI specialize exclusively in:\n• Current weather analysis & forecasts 📊\n• Historical climate comparisons (NASA data) 📈\n• Weather-perfect travel destination suggestions ✈️\n• Outdoor activity recommendations by conditions 🏃‍♂️\n• Clothing tips & optimal timing advice 👕\n• Weather pattern & climate trend analysis 🌡️\n\nImportant: I focus only on weather and climate topics\n\nTry asking:\n"Analyze the current weather for me"\n"Where should I go for sunny weather?"\n"Compare today\'s weather to historical averages"\n"When\'s the best time for outdoor activities?"',
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
            // Call Gemini AI service with NASA data option
            const aiResponse = await aiService.current.generateResponse(
                currentInput,
                weatherData,
                currentPlace,
                lang,
                0,
                includeNASAData,
                nasaData
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

            let errorContent;
            if (error.message.includes('503') || error.message.includes('overloaded')) {
                errorContent = lang === 'ar'
                    ? '⚠️ الخدمة مزدحمة حالياً بسبب كثرة الطلبات. تم تفعيل النظام الاحتياطي.\n\n🔄 يرجى المحاولة مرة أخرى خلال دقيقة للحصول على تحليل مفصل بالذكاء الاصطناعي.'
                    : '⚠️ Service is currently overloaded due to high demand. Fallback system activated.\n\n🔄 Please try again in a minute for detailed AI analysis.';
            } else {
                errorContent = lang === 'ar'
                    ? `عذراً، حدث خطأ: ${error.message.split('-')[1] || error.message}\n\n💡 تأكد من اتصال الإنترنت أو جرب مرة أخرى.`
                    : `Sorry, there was an error: ${error.message.split('-')[1] || error.message}\n\n💡 Check your internet connection or try again.`;
            }

            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: errorContent,
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
                <div className={`fixed z-40 bg-slate-900/95 backdrop-blur-md border border-slate-600/30 shadow-2xl flex flex-col transition-all duration-300 ${isMaximized
                    ? 'inset-4 md:inset-8 rounded-xl' // Full screen with margin and smaller border radius
                    : 'bottom-4 right-4 md:bottom-24 md:right-6 w-[95vw] h-[85vh] md:w-[500px] md:h-[600px] rounded-2xl' // Mobile-first responsive
                    }`}>
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

                        {/* NASA Data and Maximize buttons */}
                        <div className="flex items-center gap-2">
                            {/* NASA Data Toggle */}
                            <button
                                onClick={() => setIncludeNASAData(!includeNASAData)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${includeNASAData
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                                    }`}
                                title={lang === 'ar' ? 'بيانات ناسا السنوية' : 'NASA Annual Data'}
                            >
                                {includeNASAData ? '🛰️ NASA' : '🌍'}
                            </button>

                            {/* Maximize/Minimize button */}
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title={lang === 'ar' ? (isMaximized ? 'تصغير' : 'تكبير') : (isMaximized ? 'Minimize' : 'Maximize')}
                            >
                                {isMaximized ? (
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700 text-slate-100'
                                        }`}
                                >
                                    {message.type === 'bot' ? cleanMarkdownText(message.content) : message.content}
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