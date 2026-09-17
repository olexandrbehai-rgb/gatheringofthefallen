import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles } from "lucide-react";
import oracleAvatar from "@/assets/oracle-avatar.png";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "oracle";
interface Message {
  role: MessageRole;
  content: string;
}

const STORAGE_KEY = "gotf_oracle_chat_history";
const MAX_MESSAGES = 12;

export function OracleChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{ role: "oracle", content: "А що ЯКЩО?" }]);
      }
    } catch (e) {
      setMessages([{ role: "oracle", content: "А що ЯКЩО?" }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping, error]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    const userMessage: Message = { role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);
    setError(null);

    try {
      const payload = newMessages.slice(-MAX_MESSAGES).map((message) => ({
        role: message.role === "oracle" ? "assistant" : "user",
        content: message.content,
      }));
      const response = await fetch(`${import.meta.env.BASE_URL}api/oracle/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ messages: payload }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Mystic interference disrupted the connection.");
      }
      
      setMessages(prev => [...prev, { role: "oracle", content: data.answer }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не вдалося зв'язатися з Оракулом.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 5 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ transformOrigin: "top left" }}
            onClick={() => setIsOpen(true)}
            className="fixed top-48 left-4 md:top-24 md:left-8 z-50 h-24 w-20 md:h-32 md:w-24 rounded-[18px] overflow-hidden border-2 border-secondary shadow-[0_0_15px_rgba(138,43,226,0.5)] hover:shadow-[0_0_30px_rgba(0,240,255,0.7)] hover:border-primary transition-colors duration-500 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Відкрити чат з Оракулом"
            data-testid="button-open-oracle"
          >
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
            <img
              src={oracleAvatar}
              alt="Оракул"
              className="w-full h-full object-cover object-[50%_12%] transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-1 pb-2 pt-7 text-center">
              <span className="font-creepster text-sm tracking-[0.14em] text-primary drop-shadow-[0_0_6px_#00f0ff]">
                ОРАКУЛ
              </span>
            </div>
            <div className="absolute inset-0 rounded-[16px] border border-white/10 group-hover:border-white/30 z-20 pointer-events-none"></div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, x: -20, scale: 0.9 }}
            className="fixed top-48 left-4 md:top-24 md:left-8 z-50 w-[calc(100vw-32px)] md:w-[400px] h-[550px] max-h-[calc(100vh-208px)] md:max-h-[calc(100vh-120px)] rounded-[20px] bg-[#0a0414]/95 backdrop-blur-xl flex flex-col border border-secondary/40 shadow-[0_0_30px_rgba(138,43,226,0.25),inset_0_0_20px_rgba(138,43,226,0.1)] overflow-hidden"
            role="dialog"
            aria-label="Чат з Оракулом"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary/30 bg-gradient-to-r from-secondary/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/50 shadow-[0_0_10px_rgba(0,240,255,0.3)] shrink-0 relative">
                  <img src={oracleAvatar} alt="Оракул" className="w-full h-full object-cover object-[50%_12%]" />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
                </div>
                <div>
                  <h3 className="font-creepster text-primary text-xl tracking-widest leading-none glitch-hover">Оракул</h3>
                  <div className="text-[10px] uppercase text-secondary font-bold font-mono tracking-widest mt-1">Живий артефакт</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/50 hover:text-primary transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Закрити чат з Оракулом"
                data-testid="button-close-oracle"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 font-mono text-sm scrollbar-thin scrollbar-thumb-secondary/50 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-lg leading-relaxed relative whitespace-pre-wrap break-words",
                    msg.role === "user" 
                      ? "bg-black/60 border border-white/10 text-white/80 rounded-tr-sm" 
                      : "bg-secondary/10 border border-secondary/30 text-primary/90 rounded-tl-sm shadow-[0_0_15px_rgba(138,43,226,0.15)]"
                  )}>
                    {msg.role === "oracle" && (
                      <span className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#00f0ff]" />
                    )}
                    {msg.content}
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
                    {msg.role === "user" ? "Шукач" : "Оракул"}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="bg-secondary/10 border border-secondary/30 text-primary p-3 rounded-lg rounded-tl-sm flex items-center gap-2 max-w-[85%] shadow-[0_0_15px_rgba(138,43,226,0.15)] relative">
                    <span className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#00f0ff]" />
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="animate-pulse opacity-80 text-xs">Шукаю відповідь...</span>
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Оракул</div>
                </div>
              )}
              {error && (
                <div className="flex justify-center my-2">
                  <div className="bg-red-950/40 border border-red-500/50 text-red-400 p-2 rounded text-xs text-center max-w-[85%] shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-secondary/30 bg-black/60 relative z-10 shrink-0">
              <div className="flex items-end gap-2 bg-[#050208] border border-white/10 rounded-md p-1 focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Запитайте Оракула..."
                  className="min-w-0 flex-1 bg-transparent py-2 pl-2 text-white/90 placeholder:text-white/30 focus:outline-none resize-none font-mono text-sm"
                  style={{ height: "48px" }}
                  disabled={isTyping}
                  data-testid="input-oracle-chat"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="mb-0.5 flex h-10 shrink-0 items-center justify-center gap-1 rounded border border-primary/60 bg-primary/10 px-2 text-primary shadow-[0_0_8px_rgba(0,240,255,0.12)] transition-colors hover:bg-primary/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Надіслати повідомлення"
                  data-testid="button-send-oracle"
                >
                  <Send size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Надіслати</span>
                </button>
              </div>
              <div className="text-[9px] text-white/30 text-right mt-1.5 uppercase tracking-widest">Shift+Enter — новий рядок</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
