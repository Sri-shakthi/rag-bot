import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  PanelLeftOpen, 
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MessageItem } from './MessageItem';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  sendMessage,
  addMessage,
  setError
} from '../store/chatSlice';
import { generateImage } from '../services/api';
import { RobotAnimation, RobotMood } from './RobotAnimation';

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface ChatAreaProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function ChatArea({ sidebarOpen, setSidebarOpen }: ChatAreaProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, activeSessionId, isLoading, error, selectedCaseId, selectedCaseContent, cases, isBootstrapping } = useSelector((state: RootState) => state.chat);
  const activeSession = sessions.find((item) => item.id === activeSessionId);
  const messages = activeSession?.messages || [];
  const [input, setInput] = useState("");
  const [showSurprised, setShowSurprised] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('hi-IN');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const voiceSupported =
    typeof window !== 'undefined' &&
    (Boolean(window.SpeechRecognition) || Boolean(window.webkitSpeechRecognition));

  const indianLanguages = [
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'bn-IN', label: 'Bengali' },
    { code: 'ta-IN', label: 'Tamil' },
    { code: 'te-IN', label: 'Telugu' },
    { code: 'mr-IN', label: 'Marathi' },
    { code: 'gu-IN', label: 'Gujarati' },
    { code: 'kn-IN', label: 'Kannada' },
    { code: 'ml-IN', label: 'Malayalam' },
    { code: 'pa-IN', label: 'Punjabi' },
    { code: 'ur-IN', label: 'Urdu' },
    { code: 'or-IN', label: 'Odia' },
    { code: 'as-IN', label: 'Assamese' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedCaseId) {
      dispatch(setError('Please select a legal case before asking questions.'));
      return;
    }
    if (!activeSessionId) {
      dispatch(setError('Session is still loading. Please try again.'));
      return;
    }

    const currentInput = input;
    setInput("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check for image generation command
    if (currentInput.toLowerCase().startsWith('/image')) {
      const prompt = currentInput.replace('/image', '').trim();
      if (prompt && activeSessionId) {
        setShowSurprised(true);
        setTimeout(() => setShowSurprised(false), 1800);

        dispatch(addMessage({
          sessionId: activeSessionId,
          message: {
            id: Date.now().toString(),
            role: 'user',
            content: currentInput,
            timestamp: Date.now()
          }
        }));
        
        try {
          const imageUrl = await generateImage(prompt);
          dispatch(addMessage({
            sessionId: activeSessionId,
            message: {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `Here is an image for "${prompt}":`,
              timestamp: Date.now(),
              imageUrl: imageUrl
            }
          }));
        } catch {
          dispatch(setError('Image generation failed. Please try again.'));
        }
        return;
      }
    }

    dispatch(sendMessage(currentInput));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (isLoading) return;
    if (!voiceSupported) {
      dispatch(setError('Voice input is not supported in this browser.'));
      return;
    }

    if (isListening && recognitionRef.current) {
      manualStopRef.current = true;
      setIsListening(false);
      recognitionRef.current.abort();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = voiceLanguage;
    finalTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    manualStopRef.current = false;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      dispatch(setError(null));
    };

    recognition.onresult = (event: any) => {
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i]?.[0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${piece}`.trim();
        } else {
          interim += ` ${piece}`;
        }
      }

      const combined = `${finalTranscriptRef.current}${interim}`.trim();
      latestTranscriptRef.current = combined;
      setInput(combined);
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'aborted' && manualStopRef.current) return;
      dispatch(setError('Voice recognition failed. Please try again.'));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;

      if (manualStopRef.current) {
        const finalText = (finalTranscriptRef.current || latestTranscriptRef.current).trim();
        manualStopRef.current = false;
        finalTranscriptRef.current = '';
        latestTranscriptRef.current = '';

        if (finalText) {
          setInput('');
          dispatch(sendMessage(finalText));
        }
      }
    };

    recognition.start();
  };

  const hasMessages = messages.length > 0;
  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const animationMood: RobotMood = error
    ? 'error'
    : showSurprised
        ? 'surprised'
        : 'greeting';
  const showMessageStateAnimation = Boolean(error || showSurprised);

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-black/5 bg-[#F9F9F8] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors text-gray-500"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
          <span className="font-serif font-bold text-xl tracking-tight md:hidden">Sri</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="max-w-[800px] mx-auto px-4 py-8 min-h-full flex flex-col">
          {selectedCase && (
            <div className="mb-6 rounded-2xl border border-black/10 bg-[#FAFAF7] p-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Selected Case: {selectedCase.name}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCase.jurisdiction} • {selectedCase.year}
              </p>
              <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap max-h-40 overflow-auto">
                {selectedCaseContent}
              </p>
            </div>
          )}
          
          {/* Empty State / Greeting */}
          <AnimatePresence>
            {!hasMessages && !isBootstrapping && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-5 -mt-8 pb-56"
              >
                <RobotAnimation mood="greeting" showLabel={false} />
                <h1 className="font-serif text-3xl md:text-4xl text-gray-900 tracking-tight">
                  Hey, I am Sri bot.
                </h1>
                <p className="text-sm text-gray-500">
                  Select a case from the sidebar and ask case-specific questions only.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages List */}
          <div className={cn("flex-1 space-y-6 pb-32", !hasMessages && "hidden")}>
            {showMessageStateAnimation && (
              <div className="flex justify-start">
                <RobotAnimation mood={animationMood} className="w-fit" />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                {error}
              </div>
            )}

            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start ml-12"
              >
                <RobotAnimation mood="loading" className="w-fit" />
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className={cn(
        "absolute left-0 right-0 px-4 transition-all duration-500 ease-in-out z-20",
        hasMessages ? "bottom-6" : "bottom-10"
      )}>
        <div className="max-w-[800px] mx-auto w-full">
          <motion.div 
            layout
            className="bg-white/90 backdrop-blur-xl rounded-[20px] shadow-[0_0_18px_rgba(0,0,0,0.14)] border border-white/20 overflow-hidden relative group transition-all"
          >
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="How can I help you today?"
                className="w-full resize-none bg-transparent border-none focus:ring-0 outline-none text-gray-800 placeholder:text-gray-400 text-lg leading-relaxed max-h-[200px] py-2 pr-24"
                rows={1}
                style={{ minHeight: '60px' }}
              />
            </div>

            {/* Input Footer (Actions) */}
            <div className="flex items-center justify-between px-4 pb-4 pt-2">
              <div />

              <div className="flex items-center gap-3">
                 <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600"
                  title="Voice language"
                >
                  {indianLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                 <button
                    onClick={handleVoiceInput}
                    disabled={!voiceSupported || isLoading}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isListening
                        ? "bg-red-100 text-red-600"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                      (!voiceSupported || isLoading) && "opacity-50 cursor-not-allowed"
                    )}
                    title={voiceSupported ? "Speak to send message" : "Voice not supported in browser"}
                  >
                    <Mic size={20} />
                 </button>

                 <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    input.trim() 
                      ? "bg-[#D97757] text-white shadow-md hover:bg-[#C5684A] hover:shadow-lg transform hover:-translate-y-0.5" 
                      : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  )}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
          
          {!hasMessages && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="text-center mt-6 text-xs text-gray-400"
             >
               AI can make mistakes. Please use with discretion.
             </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
