// components/ProcurementAICopilot.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProcurementAICopilot({ sessionId, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 I'm your procurement assistant! Ask me anything about this tender document — deadlines, specifications, risks, payment terms, or any other detail.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    console.log('🔍 sessionId:', sessionId);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_URL}/ai/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.content,
          sessionId,
          history,
        }),
      });

      const data = await response.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || "I couldn't understand that. Please rephrase.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-l border-[#e8edf3] flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8edf3] bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#1a6b3c]" />
          <span className="text-[12px] font-600 text-[#0b1f3a] uppercase tracking-widest" style={{ fontFamily: 'Barlow, sans-serif' }}>
            AI Assistant
          </span>
        </div>
        <button onClick={onClose} className="text-[#9ab0c4] hover:text-[#0b1f3a] transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

      {/* Input */}
      <div className="p-3 border-t border-[#e8edf3] bg-[#f8fafc]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this document..."
            className="flex-1 px-3 py-2 bg-white border border-[#e8edf3] text-sm text-[#0b1f3a] placeholder-[#9ab0c4] outline-none focus:border-[#1a6b3c] transition-colors rounded"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-3 py-2 bg-[#1a6b3c] hover:bg-[#155731] text-white transition-colors rounded disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {['What are the delivery deadlines?', 'Any penalty clauses?', 'What is the scope of work?', 'Payment terms?'].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="text-[10px] px-2 py-0.5 bg-white border border-[#e8edf3] text-[#5a6e82] hover:bg-[#f2f5f8] transition-colors rounded"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}