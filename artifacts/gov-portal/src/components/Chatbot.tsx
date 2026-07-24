import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  MessageCircle,
  Send,
  Loader2,
  BookOpen,
  FileText,
  ChevronLeft,
  Mic,
  MicOff,
} from "lucide-react";
import { useSendChatMessage } from "@workspace/api-client-react";

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
  interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  source?: string | null;
  warning?: string | null;
}

interface QuickReply {
  id: string;
  title: string;
  query: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "مرحباً بك انا سند مساعدك الذكي في منصة سند التجريبية.\n\nيمكنك سؤالي عن اللوائح والأنظمة المتاحة في قاعدة المعرفة.",
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const mutation = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // جلب الأسئلة المقترحة من ملف الاستفسارات عند فتح الشات بوت
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSuggestedLoading(true);
    fetch("/api/suggested-questions")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.questions)) {
          setSuggestedQuestions(data.questions.slice(0, 6));
        }
      })
      .catch((err) => {
        console.error("Failed to load suggested questions:", err);
      })
      .finally(() => {
        if (!cancelled) setSuggestedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // إنشاء كائن التعرف الصوتي عند كل تشغيل
  const createRecognition = (): SpeechRecognition | null => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      return null;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionAPI();
    recognition.lang = "ar-SA";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalBuffer = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (finalTranscript) {
        finalBuffer += (finalBuffer ? " " : "") + finalTranscript;
        setInput((prev) =>
          (prev ? prev + " " + finalTranscript : finalTranscript).trim(),
        );
      } else if (interimTranscript) {
        setInput((prev) =>
          (prev ? prev + " " + interimTranscript : interimTranscript).trim(),
        );
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    return recognition;
  };

  // التحقق من دعم المتصفح عند التحميل
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current?.abort();
      setIsListening(false);
      recognitionRef.current = null;
      return;
    }

    const recognition = createRecognition();
    if (!recognition) return;

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      recognitionRef.current = null;
    }
  };

  const handleSend = (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const newHistory = [
      ...history,
      { role: "user" as const, content: trimmed },
    ];

    mutation.mutate(
      { data: { message: trimmed, history } },
      {
        onSuccess: (data) => {
          const botMsg: Message = {
            id: Date.now() + 1,
            role: "assistant",
            content: data.answer,
            source: data.source,
            warning: (data as any).warning ?? null,
          };
          setMessages((prev) => [...prev, botMsg]);
          setHistory([
            ...newHistory,
            { role: "assistant", content: data.answer },
          ]);
        },
        onError: () => {
          const errMsg: Message = {
            id: Date.now() + 1,
            role: "assistant",
            content:
              "عذراً، حدث خطأ في الاتصال بالخادم. الرجاء المحاولة مرة أخرى.",
          };
          setMessages((prev) => [...prev, errMsg]);
        },
      },
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-24 left-4 md:left-6 z-50 flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-2xl border border-[#1a5c38]/20 bg-white"
            style={{
              width: "min(900px, calc(100vw - 32px))",
              height: "min(640px, calc(100vh - 120px))",
            }}
          >
            {/* Left Content Area — Chat */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Header */}
              <div className="bg-[#1a5c38] text-white px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-[#c8a84b]/40 flex items-center justify-center">
                    <Bot size={20} className="text-[#c8a84b]" />
                  </div>
                  <div>
                    <div className="font-bold text-base leading-tight">
                      مساعدك سند
                    </div>
                    <div className="text-xs text-white/70 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      منصة سند التجريبية
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-[#f8faf8]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-[#1a5c38]/10 border border-[#1a5c38]/20 flex items-center justify-center ml-2 shrink-0 mt-1">
                        <Bot size={14} className="text-[#1a5c38]" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <div
                        className={`px-4 py-3 text-sm leading-relaxed rounded-2xl whitespace-pre-wrap shadow-sm ${
                          msg.role === "user"
                            ? "bg-[#1a5c38] text-white rounded-tr-none"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.source && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#1a5c38]/80 px-1">
                          <BookOpen size={11} />
                          <span className="font-medium">{msg.source}</span>
                        </div>
                      )}
                      {msg.warning && (
                        <div className="flex items-start gap-1.5 text-[11px] text-amber-600 px-1">
                          <span className="font-medium leading-relaxed">
                            {msg.warning}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {mutation.isPending && (
                  <div className="flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-[#1a5c38]/10 border border-[#1a5c38]/20 flex items-center justify-center ml-2 shrink-0 mt-1">
                      <Bot size={14} className="text-[#1a5c38]" />
                    </div>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                      <Loader2
                        size={14}
                        className="text-[#1a5c38] animate-spin"
                      />
                      <span className="text-xs text-gray-400">
                        جاري البحث في الوثائق...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies — أسئلة مقترحة من ملف الاستفسارات */}
              {messages.length <= 1 && (
                <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="h-px flex-1 bg-[#1a5c38]/15" />
                    <span className="text-xs font-bold text-[#1a5c38]">
                      أسئلة مقترحة
                    </span>
                    <div className="h-px flex-1 bg-[#1a5c38]/15" />
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedLoading && (
                      <span className="text-xs text-gray-400">
                        جاري التحميل...
                      </span>
                    )}
                    {!suggestedLoading && suggestedQuestions.length === 0 && (
                      <span className="text-xs text-gray-400">
                        لا توجد أسئلة مقترحة.
                      </span>
                    )}
                    {!suggestedLoading &&
                      suggestedQuestions.map((question, index) => {
                        const title =
                          question.length > 35
                            ? question.slice(0, 35) + "…"
                            : question;
                        return (
                          <button
                            key={index}
                            onClick={() => handleSend(question)}
                            title={question}
                            className="text-xs font-medium text-[#1a5c38] bg-[#1a5c38]/5 border border-[#1a5c38]/20 hover:bg-[#1a5c38] hover:text-white rounded-full px-3.5 py-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            {title}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                    placeholder={
                      isListening ? "تكلم الآن..." : "اكتب سؤالك هنا..."
                    }
                    disabled={mutation.isPending}
                    className={`w-full bg-[#f8faf8] border rounded-full px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      isListening
                        ? "border-[#c8a84b] ring-2 ring-[#c8a84b]/30 placeholder:text-[#c8a84b]"
                        : "border-gray-200 focus:ring-[#1a5c38]/30 focus:border-[#1a5c38]/50"
                    }`}
                    dir="rtl"
                  />
                  {isListening && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a84b] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8a84b]" />
                      </span>
                    </span>
                  )}
                </div>
                {speechSupported && (
                  <button
                    onClick={toggleListening}
                    disabled={mutation.isPending}
                    title={isListening ? "إيقاف التسجيل" : "السؤال بالصوت"}
                    className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      isListening
                        ? "bg-[#c8a84b] text-white animate-pulse shadow-md shadow-[#c8a84b]/30"
                        : "bg-[#f8faf8] text-[#1a5c38] border border-gray-200 hover:bg-[#1a5c38]/5 hover:border-[#1a5c38]/30"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                )}
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || mutation.isPending}
                  className="w-10 h-10 shrink-0 rounded-full bg-[#1a5c38] text-white flex items-center justify-center hover:bg-[#1a5c38]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>

            {/* Right Sidebar — Government Portal Style */}
            <div className="hidden md:flex w-64 bg-[#1a5c38] flex-col items-center justify-between py-8 px-4 text-center relative overflow-hidden shrink-0">
              {/* Decorative pattern overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />

              <div className="relative z-10 flex flex-col items-center">
                {/* الدائرة بعد إزالة الصورة وجعل الشعار نص "سند" ذهبي */}
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-[#c8a84b]/50 flex items-center justify-center mb-4 p-2">
                  <span className="font-heading font-black text-2xl text-[#c8a84b] tracking-wider">
                    سند
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white leading-tight mb-2">
                  منصة سند التجريبية
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  المساعد الذكي للوائح والأنظمة
                </p>
              </div>

              <div className="relative z-10 w-full space-y-3">
                <div className="bg-white/10 rounded-lg px-3 py-2 text-xs text-white/80 text-right">
                  <span className="block font-bold text-white mb-1">
                    الوثائق المتاحة
                  </span>
                  <span className="block">
                    • اللائحة التنفيذية للموارد بشرية
                  </span>
                  <span className="block">• استفسارات المستفيدين </span>
                </div>
              </div>

              <div className="relative z-10 text-[10px] text-white/50"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg z-50"
        style={{ background: "linear-gradient(135deg, #c8a84b, #a08030)" }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#1a5c38]"
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={26} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
