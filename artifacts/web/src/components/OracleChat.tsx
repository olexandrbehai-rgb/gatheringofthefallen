import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Sparkles } from "lucide-react";
import oracleAvatar from "@/assets/oracle-avatar.png";
import oracleAvatarListening from "@/assets/oracle-avatar-listening.png";
import oracleAvatarSpeaking from "@/assets/oracle-avatar-speaking-soft.png";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageContext";

type MessageRole = "user" | "oracle";
interface Message {
  role: MessageRole;
  content: string;
}

type OracleCopy = {
  name: string;
  title: string;
  alt: string;
  open: string;
  close: string;
  chat: string;
  speaking: string;
  thinking: string;
  connected: string;
  dictating: string;
  searching: string;
  livingArtifact: string;
  seeker: string;
  ask: string;
  send: string;
  sendAria: string;
  newLine: string;
  looking: string;
  welcome: string;
  error: string;
  mysticError: string;
};

const STORAGE_KEY = "gotf_oracle_chat_history";
const MAX_MESSAGES = 12;

function TypewriterText({
  content,
  animate,
  onComplete,
  onProgress,
}: {
  content: string;
  animate: boolean;
  onComplete?: () => void;
  onProgress?: () => void;
}) {
  const [visibleLength, setVisibleLength] = useState(
    animate ? 0 : content.length,
  );
  const completeRef = useRef(onComplete);
  const progressRef = useRef(onProgress);

  useEffect(() => {
    completeRef.current = onComplete;
    progressRef.current = onProgress;
  }, [onComplete, onProgress]);

  useEffect(() => {
    if (!animate) {
      setVisibleLength(content.length);
      return;
    }

    let nextLength = 0;
    setVisibleLength(0);
    const interval = window.setInterval(() => {
      nextLength = Math.min(content.length, nextLength + 1);
      setVisibleLength(nextLength);
      if (nextLength % 8 === 0) {
        progressRef.current?.();
      }
      if (nextLength >= content.length) {
        window.clearInterval(interval);
        completeRef.current?.();
      }
    }, 22);

    return () => window.clearInterval(interval);
  }, [animate, content]);

  const isStillTyping = animate && visibleLength < content.length;
  return (
    <>
      {content.slice(0, visibleLength)}
      {isStillTyping && <span className="terminal-cursor" aria-hidden="true" />}
    </>
  );
}

function OraclePortrait({
  isSpeaking,
  isThinking,
  copy,
}: {
  isSpeaking: boolean;
  isThinking: boolean;
  copy: OracleCopy;
}) {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    setMouthOpen(false);
    if (
      !isSpeaking ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let open = false;
    let timer = 0;
    const moveMouth = () => {
      open = !open;
      setMouthOpen(open);
      const delay = open
        ? 55 + Math.random() * 65
        : 45 + Math.random() * 145;
      timer = window.setTimeout(moveMouth, delay);
    };

    timer = window.setTimeout(moveMouth, 70 + Math.random() * 90);
    return () => window.clearTimeout(timer);
  }, [isSpeaking]);

  return (
    <div className="relative h-40 shrink-0 overflow-hidden border-b border-primary/30 bg-[#09030d] sm:h-48">
      <img
        src={oracleAvatarListening}
        alt={copy.alt}
        className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
      />
      <img
        src={oracleAvatarSpeaking}
        alt=""
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-[50%_20%] opacity-0 transition-opacity duration-75",
          mouthOpen && "opacity-100",
        )}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,2,8,0.05)_0%,rgba(4,2,8,0.12)_34%,rgba(4,2,8,0.88)_100%)]" />
      <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-creepster text-2xl tracking-[0.18em] text-primary drop-shadow-[0_0_8px_#00f0ff]">
            {copy.title}
          </div>
          <div className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-secondary">
            {isSpeaking
              ? copy.dictating
              : isThinking
                ? copy.searching
                : copy.livingArtifact}
          </div>
        </div>
        <div className="rounded border border-black/60 bg-black/65 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white/80 backdrop-blur-sm">
          {isSpeaking ? copy.speaking : isThinking ? copy.thinking : copy.connected}
        </div>
      </div>
    </div>
  );
}

export function OracleChat() {
  const { tObj } = useT();
  const copy = tObj<OracleCopy>("oracle");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOracleSpeaking, setIsOracleSpeaking] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [typewriterTick, setTypewriterTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  const [mobileViewportTop, setMobileViewportTop] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{ role: "oracle", content: copy.welcome }]);
      }
    } catch (e) {
      setMessages([{ role: "oracle", content: copy.welcome }]);
    }
  }, [copy.welcome]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      setKeyboardInset(0);
      setMobileViewportHeight(null);
      setMobileViewportTop(null);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateViewport = () => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        setKeyboardInset(0);
        setMobileViewportHeight(null);
        setMobileViewportTop(null);
        return;
      }

      const rawKeyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height,
      );
      if (rawKeyboardInset > 80) {
        setKeyboardInset(rawKeyboardInset);
        setMobileViewportHeight(viewport.height);
        setMobileViewportTop(viewport.offsetTop);
      } else {
        setKeyboardInset(0);
        setMobileViewportHeight(null);
        setMobileViewportTop(null);
      }
    };

    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!keyboardInset) return;

    const timer = window.setTimeout(() => {
      const history = historyRef.current;
      if (history) {
        history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
      }
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [keyboardInset]);

  useEffect(() => {
    if (isOpen) {
      const history = historyRef.current;
      if (history) {
        window.requestAnimationFrame(() => {
          history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, isOpen, isTyping, isOracleSpeaking, typewriterTick, error]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleInputFocus = () => {
    window.setTimeout(() => {
      const history = historyRef.current;
      if (history) {
        history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
      }
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }, 250);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    
    const userMessage: Message = { role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputValue("");
    setIsTyping(true);
    setIsOracleSpeaking(false);
    setSpeakingMessageIndex(null);
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
        throw new Error(copy.mysticError);
      }
      
      setSpeakingMessageIndex(newMessages.length);
      setIsOracleSpeaking(true);
      setMessages((prev) => [...prev, { role: "oracle", content: data.answer }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : copy.error);
      setIsOracleSpeaking(false);
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

  const keyboardAwareStyle =
    keyboardInset > 0 && mobileViewportHeight !== null && mobileViewportTop !== null
      ? {
          top: `${Math.max(mobileViewportTop + 8, 8)}px`,
          bottom: "auto",
          height: `${Math.max(mobileViewportHeight - 16, 0)}px`,
          maxHeight: `${Math.max(mobileViewportHeight - 16, 0)}px`,
        }
      : undefined;

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
            aria-label={copy.open}
            data-testid="button-open-oracle"
          >
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
            <img
              src={oracleAvatar}
              alt={copy.alt}
              className="w-full h-full object-cover object-[50%_12%] transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-1 pb-2 pt-7 text-center">
              <span className="font-creepster text-sm tracking-[0.14em] text-primary drop-shadow-[0_0_6px_#00f0ff]">
                {copy.title}
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
            style={keyboardAwareStyle}
            className={cn(
              "fixed inset-x-2 bottom-2 z-50 flex h-[min(78dvh,650px)] max-h-[calc(100dvh-16px)] min-h-0 flex-col overflow-hidden overscroll-y-contain rounded-[20px] border border-secondary/40 bg-[#0a0414]/95 shadow-[0_0_30px_rgba(138,43,226,0.25),inset_0_0_20px_rgba(138,43,226,0.1)] backdrop-blur-xl [touch-action:pan-y]",
              keyboardInset === 0 && "md:inset-x-auto md:bottom-auto md:left-8 md:top-24 md:h-[550px] md:max-h-[calc(100dvh-120px)] md:w-[400px]",
            )}
            role="dialog"
            aria-label={copy.chat}
          >
            <div className={cn("relative shrink-0", keyboardInset > 0 && "hidden")}>
              <OraclePortrait
                isSpeaking={isOracleSpeaking}
                isThinking={isTyping}
                copy={copy}
              />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 rounded-md border border-white/20 bg-black/65 p-1.5 text-white/70 backdrop-blur-sm transition-colors hover:border-primary/70 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={copy.close}
                data-testid="button-close-oracle"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat History */}
            <div
              ref={historyRef}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain bg-[#04020a]/95 p-4 font-mono text-sm scrollbar-thin scrollbar-thumb-secondary/50 scrollbar-track-transparent [-webkit-overflow-scrolling:touch] [touch-action:pan-y]"
            >
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
                    <TypewriterText
                      content={msg.content}
                      animate={msg.role === "oracle" && speakingMessageIndex === i}
                      onProgress={() => setTypewriterTick((tick) => tick + 1)}
                      onComplete={() => {
                        if (speakingMessageIndex === i) {
                          setSpeakingMessageIndex(null);
                          setIsOracleSpeaking(false);
                        }
                      }}
                    />
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
                    {msg.role === "user" ? copy.seeker : copy.name}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="bg-secondary/10 border border-secondary/30 text-primary p-3 rounded-lg rounded-tl-sm flex items-center gap-2 max-w-[85%] shadow-[0_0_15px_rgba(138,43,226,0.15)] relative">
                    <span className="absolute -left-1 -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_#00f0ff]" />
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="animate-pulse opacity-80 text-xs">{copy.looking}</span>
                  </div>
                  <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">{copy.name}</div>
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
              <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-[#050208] p-1 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.15)] sm:flex-row sm:items-end">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  enterKeyHint="send"
                  placeholder={copy.ask}
                  className="min-w-0 flex-1 bg-transparent py-2 pl-2 text-white/90 placeholder:text-white/30 focus:outline-none resize-none font-mono text-sm"
                  style={{ height: "48px" }}
                  disabled={isTyping}
                  data-testid="input-oracle-chat"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded border border-primary/70 bg-primary/15 px-3 text-primary shadow-[0_0_12px_rgba(0,240,255,0.18)] transition-colors hover:bg-primary/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary sm:mb-0.5 sm:h-10 sm:w-auto sm:gap-1 sm:px-2"
                  aria-label={copy.sendAria}
                  data-testid="button-send-oracle"
                >
                  <Send size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{copy.send}</span>
                </button>
              </div>
              <div className="text-[9px] text-white/30 text-right mt-1.5 uppercase tracking-widest">{copy.newLine}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
