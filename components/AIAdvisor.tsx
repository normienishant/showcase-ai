// components/AIAdvisor.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { trackAIChat, getVisitorId, getSessionId } from '@/lib/tracking';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! 👋 I'm your AI Product Advisor. I can help you find the right products based on your needs. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine when to show the chatbot based on intent score
    const checkIntent = async () => {
      const visitorId = getVisitorId();
      let delay = 10000; // default 10s

      try {
        const response = await fetch(`${API_URL}/track/visitor/${visitorId}`);
        const data = await response.json();
        const score = data.score?.score || 0;
        // Higher score -> show earlier
        if (score > 30) delay = 4000;
        else if (score > 15) delay = 7000;
        else delay = 10000;
      } catch (e) {
        // If fetch fails, default to 10s
      }

      // Also check if we have a product context (on product page), show slightly earlier
      const productId = sessionStorage.getItem('currentProductId');
      if (productId) delay = Math.max(delay - 2000, 3000);

      setTimeout(() => {
        setShowTrigger(true);
        // Hide notification after 12s
        setTimeout(() => setShowNotification(false), 12000);
      }, delay);
    };

    checkIntent();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const visitorId = getVisitorId();
      const sessionId = getSessionId();
      const productId = sessionStorage.getItem('currentProductId') || undefined;

      const response = await fetch(`${API_URL}/ai/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.content,
          visitorId,
          sessionId,
          productId, // send current product context
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('AI Advisor API error response:', text);
        throw new Error(`API error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || "I'm sorry, I didn't understand that. Could you please rephrase?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      trackAIChat(userMsg.content, assistantMsg.content);
    } catch (error) {
      console.error('AI Advisor error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered an error. Please try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────

  if (!isOpen) {
    return showTrigger ? (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {showNotification && (
          <div className="bg-[#1a6b3c] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-bounce-in flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            AI Help available
          </div>
        )}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#0b1f3a] text-white p-4 rounded-full shadow-xl hover:bg-[#1a3055] transition-all group animate-bounce-in"
          aria-label="Open AI Assistant"
        >
          <MessageCircle size={22} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#1a6b3c] rounded-full animate-pulse" />
        </button>
      </div>
    ) : null;
  }

  return (
    <div
      className={`fixed z-50 flex flex-col bg-white rounded-lg shadow-2xl border border-[#e8edf3] transition-all ${
        isMinimized ? 'bottom-6 right-6 w-80 h-14' : 'bottom-6 right-6 w-[380px] h-[520px]'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-[#0b1f3a] rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#1a6b3c]" />
          <span className="text-white text-sm font-600" style={{ fontFamily: 'Barlow, sans-serif' }}>
            AI Product Advisor
          </span>
          <span className="text-[10px] text-[#7a9cc8] font-mono">beta</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded text-[#7a9cc8] hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded text-[#7a9cc8] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#0b1f3a] text-white'
                      : 'bg-white border border-[#e8edf3] text-[#0b1f3a]'
                  }`}
                >
                  {msg.content}
                  <div className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-[#7a9cc8]' : 'text-[#9ab0c4]'}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#e8edf3] p-3 rounded-lg text-sm text-[#5a6e82]">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#9ab0c4] rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-[#9ab0c4] rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-[#9ab0c4] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-[#e8edf3] bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about any product..."
                className="flex-1 px-3 py-2 bg-[#f2f5f8] border border-[#e8edf3] text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#1a6b3c] transition-colors rounded"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="px-4 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white transition-colors rounded disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {['UPS for computers', 'Solar panel price', 'Best inverter', '3 phase vs single phase'].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-[10px] px-2 py-0.5 bg-[#f2f5f8] text-[#5a6e82] hover:bg-[#e8edf3] transition-colors rounded"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}