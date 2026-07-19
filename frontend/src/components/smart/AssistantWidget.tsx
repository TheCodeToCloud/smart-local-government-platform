import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assistantAPI } from '../../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data?: {
    certificateType: string | null;
    requiredDocuments: string[];
    estimatedDays: string;
  };
}

const AssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi there! I'm your Smart Civic Assistant. What kind of certificate or service do you need help with today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await assistantAPI.getGuidance(userMessage.text);
      if (res.data.success && res.data.data) {
        const { message, certificateType, requiredDocuments, estimatedDays } = res.data.data;
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: message,
          data: certificateType ? { certificateType, requiredDocuments, estimatedDays } : undefined,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Sorry, I am having trouble connecting to the civic servers right now. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="w-80 sm:w-96 bg-slate-900 border border-primary-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in mb-4">
          {/* Header */}
          <div className="bg-primary-600 px-4 py-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-bold">Smart Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-900/50 flex-col">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Rich Data Card */}
                  {msg.data && msg.data.certificateType && (
                    <div className="mt-3 bg-slate-900 rounded-xl p-3 border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Required Documents:</p>
                      <ul className="list-disc pl-4 text-xs text-slate-300 mb-3 space-y-1">
                        {msg.data.requiredDocuments.map((doc, idx) => (
                          <li key={idx}>{doc}</li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <span className="text-slate-400">⏱ Est. Time:</span>
                        <span className="text-amber-400 font-bold">{msg.data.estimatedDays} days</span>
                      </div>
                      <Link 
                        to={`/apply?type=${msg.data.certificateType}`}
                        className="block w-full text-center bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Start Application →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm p-3 border border-slate-700/50">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-800 border-t border-slate-700">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="E.g., I need proof of my address..."
                className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-primary-500 transition-colors placeholder:text-slate-500"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-400 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white rounded-full p-4 shadow-lg shadow-primary-500/20 transition-transform hover:scale-105 group relative flex items-center justify-center"
        >
          <span className="text-2xl">💬</span>
          {/* Tooltip */}
          <div className="absolute right-full mr-4 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
            Need Help?
          </div>
        </button>
      )}
    </div>
  );
};

export default AssistantWidget;
