'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // In a real MVC app, this would call a backend AI route
            // For now, we'll keep it simple or integrate with the backend if we have a chat route
            await new Promise(r => setTimeout(r, 1000));
            const response: Message = { role: 'assistant', content: "분석을 위해 엑셀 파일을 업로드해 주세요. 파일이 업로드되면 상세한 인사이트를 제공해 드릴 수 있습니다." };
            setMessages(prev => [...prev, response]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-white w-96 h-[500px] shadow-2xl rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                    <header className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold">
                            <Bot size={20} /> AI Analyst
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">✕</button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10">
                                <Bot size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-medium">분석 도우미에게 무엇이든 물어보세요.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                    <Loader2 className="animate-spin text-blue-600" size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-white flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 text-sm outline-none bg-slate-100 p-2.5 rounded-xl border border-transparent focus:border-blue-500 transition-all font-medium"
                        />
                        <button onClick={sendMessage} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95"
                >
                    <MessageSquare size={24} />
                </button>
            )}
        </div>
    );
};

export default ChatBot;
