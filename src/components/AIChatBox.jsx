import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import useGeminiChat from '../hooks/useGeminiChat';

const QUICK_PROMPTS = [
  'How can I improve my city score?',
  'Is my power grid balanced?',
  'What should I build next?',
  'Explain the ERCOT data',
];

export default function AIChatBox({ gameContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearHistory } = useGeminiChat();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const ctx = useMemo(() => gameContext, [gameContext]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text, ctx);
  }, [input, isLoading, sendMessage, ctx]);

  const handleQuick = useCallback(
    (prompt) => {
      if (isLoading) return;
      sendMessage(prompt, ctx);
    },
    [isLoading, sendMessage, ctx],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 group"
        style={{ width: 56, height: 56 }}
        aria-label="Open AI assistant"
      >
        <div className="relative w-full h-full">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)',
              filter: 'blur(6px)',
            }}
          />
          <img
            src="/avatar.png"
            alt="Alan"
            className="relative w-full h-full rounded-full object-cover border-2 border-[rgba(0,212,255,0.4)] shadow-[0_0_20px_rgba(0,212,255,0.3)] group-hover:border-[rgba(0,212,255,0.7)] transition-all duration-300 group-hover:scale-110"
          />
          {messages.length === 0 && !open && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00d4ff] animate-ping" />
          )}
        </div>
      </button>

      {/* Chat panel */}
      <div
        className={`fixed bottom-20 right-5 z-50 transition-all duration-300 origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-90 pointer-events-none'
        }`}
        style={{ width: 440, maxHeight: 'min(75vh, 680px)' }}
      >
        <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.10)] bg-[rgba(8,16,32,0.92)] backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(0,212,255,0.06)_inset]">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
            <img src="/avatar.png" alt="" className="w-8 h-8 rounded-full object-cover border border-[rgba(0,212,255,0.3)]" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-xs font-bold tracking-[2px] text-[var(--accent)]">Pengu</div>
              <div className="font-mono text-[7px] text-[var(--dim)] tracking-wider">ENERGY + CITY ADVISOR</div>
            </div>
            <button
              onClick={clearHistory}
              className="font-mono text-[8px] text-[var(--dim)] hover:text-[var(--accent)] tracking-wider px-2 py-1 rounded border border-transparent hover:border-[rgba(255,255,255,0.10)] transition-colors"
              title="Clear chat"
            >
              CLEAR
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--dim)] hover:text-[var(--text)] transition-colors p-1"
              aria-label="Close chat"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin" style={{ maxHeight: 'min(56vh, 480px)' }}>
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-6 space-y-4">
                <div className="font-mono text-[9px] text-[var(--dim)] tracking-wider opacity-60">
                  ASK ME ABOUT YOUR CITY, GRID, OR ENERGY STRATEGY
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleQuick(p)}
                      className="font-mono text-[8px] text-[var(--text)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(0,212,255,0.12)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,212,255,0.25)] rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <ChatBubble key={i} msg={m} />
            ))}

            {isLoading && (!messages.length || !messages[messages.length - 1]?.streaming) && (
              <div className="flex items-center gap-2 pl-1">
                <img src="/avatar.png" alt="" className="w-5 h-5 rounded-full object-cover border border-[rgba(0,212,255,0.2)]" />
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-[rgba(255,255,255,0.08)] p-2.5">
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] rounded-xl px-3 py-1.5 border border-[rgba(255,255,255,0.06)] focus-within:border-[rgba(0,212,255,0.3)] transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Alan is the goat..."
                className="flex-1 bg-transparent outline-none font-mono text-[11px] text-[var(--text)] placeholder:text-[var(--dim)] placeholder:opacity-40"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.3)] disabled:opacity-30 transition-colors"
                aria-label="Send message"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ChatBubble({ msg }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`flex gap-2 ${isBot ? 'items-start' : 'justify-end'}`}>
      {isBot && (
        <img src="/avatar.png" alt="" className="w-5 h-5 rounded-full object-cover border border-[rgba(0,212,255,0.2)] shrink-0 mt-0.5" />
      )}
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 font-mono text-[11px] leading-relaxed ${
          isBot
            ? `bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[var(--text)] ${msg.isError ? 'border-[rgba(255,60,60,0.3)] text-[#ff6b6b]' : ''}`
            : 'bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.15)] text-[var(--text)]'
        }`}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {formatBotText(msg.text)}
        {isBot && msg.streaming && (
          <span className="inline-block w-2 h-3.5 ml-0.5 bg-[var(--accent)] animate-pulse" style={{ verticalAlign: 'text-bottom' }} />
        )}
      </div>
    </div>
  );
}

function formatBotText(text) {
  if (!text) return text;
  const noHeaders = text.replace(/^#{1,6}\s*/gm, '').trim();
  const parts = noHeaders.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-[var(--accent)] font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
