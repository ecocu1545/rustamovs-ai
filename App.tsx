
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './types';
import { sendMessageToGemini } from './services/geminiService';

const STORAGE_KEY = 'rustamovs_ai_v1_history';

const App: React.FC = () => {
  // Yaddaşdan mesajları yükləyirik
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Yaddaş oxunarkən xəta:", e);
      return [];
    }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hər yeni mesajda yaddaşa yazırıq
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setSelectedImage({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userParts: any[] = [];
    if (input.trim()) userParts.push({ text: input });
    if (selectedImage) {
      userParts.push({
        inlineData: {
          mimeType: selectedImage.mimeType,
          data: selectedImage.data
        }
      });
    }

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      parts: userParts,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(updatedMessages);
      const assistantMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        parts: [{ text: responseText }],
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        parts: [{ text: "Xəta baş verdi. Zəhmət olmasa internet bağlantınızı yoxlayın və ya bir az sonra yenidən cəhd edin." }],
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Bütün söhbət tarixçəsini silmək istəyirsiniz?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            R
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg">Rustamovs AI</h1>
            <p className="text-[10px] text-indigo-600 font-semibold flex items-center tracking-wide uppercase">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5 animate-pulse"></span>
              Bulud Yaddaşı Aktiv
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 chat-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-xl border border-slate-50">🤖</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-800">Xoş gəldin, mən Rustamovs!</h2>
              <p className="max-w-[300px] mx-auto text-sm text-slate-500 leading-relaxed">
                Elcan Rüstəmov tərəfindən yaradılmışam. Mənimlə istənilən mövzuda söhbət edə bilərsən. Söhbətlərimiz bu telefonda yadda qalacaq.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs pt-4">
              <button onClick={() => setInput("Soyadın nədir?")} className="text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm">"Soyadın nədir?"</button>
              <button onClick={() => setInput("Səni kim yaradıb?")} className="text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors shadow-sm">"Səni kim yaradıb?"</button>
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[88%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              {msg.parts.map((part, idx) => (
                <div key={idx} className="space-y-3">
                  {part.inlineData && (
                    <img 
                      src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                      alt="Uploaded" 
                      className="rounded-xl max-h-80 w-full object-contain bg-slate-100"
                    />
                  )}
                  {part.text && (
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{part.text}</p>
                  )}
                </div>
              ))}
              <div className={`text-[10px] mt-2 font-medium opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-slate-200 p-4 pb-safe-offset-2">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img 
                src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-500 shadow-xl"
                alt="Preview"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white active:scale-90 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-[2rem] p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-transparent transition-all duration-300">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-full transition-all active:scale-90"
              title="Şəkil əlavə et"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Rustamovs-a yazın..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-2.5 px-1 resize-none max-h-32 text-slate-800 placeholder-slate-400 text-[15px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className={`p-3.5 rounded-full transition-all ${
                (!input.trim() && !selectedImage) || isLoading 
                  ? 'bg-slate-200 text-slate-400' 
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-90 hover:bg-indigo-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
          <p className="text-[9px] text-center text-slate-400 mt-3 font-medium uppercase tracking-tighter">
            Rustamovs AI • Bütün hüquqlar Elcan Rüstəmov tərəfindən qorunur
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
