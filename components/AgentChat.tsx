import React, { useState, useRef, useEffect } from 'react';
import { useCV } from '../store/CVContext';
import { queryAgent } from '../services/geminiService';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';

export const AgentChat = () => {
  const { candidates } = useCV();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'model',
      text: 'Olá! Sou o seu Headhunter IA. Descreva o projeto ou a vaga e eu encontrarei os melhores membros da EJ para você.',
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (candidates.length === 0) {
      alert("Por favor, importe os currículos primeiro.");
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { text, suggestedIds } = await queryAgent(candidates, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: text,
        timestamp: Date.now(),
        suggestedCandidates: suggestedIds
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'Desculpe, tive um problema ao analisar os dados. Tente novamente.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-brand-border bg-black/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-purple to-brand-secondary flex items-center justify-center">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h3 className="text-white font-bold">Talent Agent</h3>
          <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'user' ? 'bg-slate-700' : 'bg-brand-accent/20 text-brand-accent'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-brand-secondary/20 border border-brand-secondary/30 text-slate-100' 
                : 'bg-slate-800/50 border border-slate-700 text-slate-300'
            }`}>
              <ReactMarkdown 
                components={{
                  strong: ({node, ...props}) => <span className="text-brand-accent font-bold" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />
                }}
              >
                {msg.text}
              </ReactMarkdown>
              
              {/* Recommended Candidate Chips (Optional visualization) */}
              {msg.suggestedCandidates && msg.suggestedCandidates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-2">Perfis Citados:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidates
                      .filter(c => msg.suggestedCandidates?.includes(c.id))
                      .map(c => (
                        <div key={c.id} className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded border border-slate-700">
                          <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                          <span className="text-xs text-white font-medium">{c.name}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-brand-border bg-black/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: Preciso de 2 pessoas para um site em React com prazo curto..."
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors placeholder:text-slate-600"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-brand-accent hover:bg-brand-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold p-3 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
