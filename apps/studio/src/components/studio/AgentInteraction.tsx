'use client';

import { useState } from 'react';
import { Send, ThumbsUp, ThumbsDown, Loader2, Zap, Brain, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/shared';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  learned?: boolean;
}

export default function AgentInteraction({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isInvoking, setIsInvoking] = useState(false);
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).slice(2, 11));
  const [hasFeedback, setHasFeedback] = useState<Record<number, boolean>>({});

  const handleInvoke = async () => {
    if (!input.trim() || isInvoking) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsInvoking(true);

    try {
      const res = await fetch(`/api/agents/${agentId}/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
          context: { platform: 'studio_interaction' }
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Invocation failed');

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.response,
        learned: data.learned 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsInvoking(false);
    }
  };

  const handleFeedback = async (index: number, isPositive: boolean) => {
    if (hasFeedback[index]) return;

    try {
      const res = await fetch(`/api/agents/${agentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, isPositive })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setHasFeedback(prev => ({ ...prev, [index]: true }));
      }
    } catch (error: any) {
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="flex flex-col h-[600px] card rounded-sm border-white/5  overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between ">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-primary" size={18} />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Live Interaction</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 [0_0_8px_#10b981]" />
          <span className="text-[10px] font-black text-emerald-500 uppercase">Sovereign Link Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Zap size={32} className="text-zinc-600" />
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
              Initialize interaction to trigger<br />Hermes Skill Extraction
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className={cn(
                "flex flex-col gap-2",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-white/5 border border-white/5 text-zinc-300 rounded-tl-none"
              )}>
                {msg.content}
              </div>
              
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-3 ml-1 mt-1">
                  {msg.learned && (
                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary py-0 h-4 flex items-center gap-1">
                      <Brain size={8} /> Auto-Learned
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleFeedback(i, true)}
                      disabled={hasFeedback[i]}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        hasFeedback[i] ? "text-primary bg-primary/10" : "text-zinc-600 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button 
                      onClick={() => handleFeedback(i, false)}
                      disabled={hasFeedback[i]}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
        {isInvoking && (
          <div className="flex items-center gap-3 text-zinc-600 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Agent Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6  border-t border-white/5">
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvoke()}
            placeholder="Send instruction to agent..."
            className="w-full  border border-white/5 rounded-2xl pl-6 pr-14 py-4 text-xs text-white focus:outline-none focus:border-primary/40 transition-all placeholder:text-zinc-700"
          />
          <button 
            onClick={handleInvoke}
            disabled={isInvoking || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-white text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-3 text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center">
          Positive feedback triggers permanent skill extraction
        </p>
      </div>
    </div>
  );
}
