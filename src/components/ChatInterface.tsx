import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { UIMessage, GenAIMessage } from '../types';
import { Send, Image as ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatInterface() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const newMessage: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      imageUrl: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Map UI messages to Gemini API format
      const apiMessages: GenAIMessage[] = [...messages, newMessage].map((msg) => {
        const parts: any[] = [];
        if (msg.imageUrl) {
          // Extract base64 and mime type from data URI
          const [header, base64Data] = msg.imageUrl.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        return {
          role: msg.role,
          parts,
        };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.text,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      // Optional: Add error toast or message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm z-10">
        <div className="bg-emerald-100 p-2 rounded-lg mr-4">
          <Sparkles className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">ClutterClear AI</h1>
          <p className="text-sm text-slate-500">Your personal organizing assistant</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 max-w-md mx-auto">
            <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
              <ImageIcon className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-medium text-slate-800 mb-3">Welcome to ClutterClear</h2>
            <p className="text-slate-600">
              Upload a photo of a messy room, and I'll help you break down the decluttering process step-by-step.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded room"
                    className="max-w-full rounded-xl mb-3 object-cover max-h-64 border border-black/10"
                  />
                )}
                {msg.text && (
                  <div className="markdown-body text-sm sm:text-base leading-relaxed space-y-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center shadow-sm">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mr-3" />
              <span className="text-slate-500 text-sm font-medium">Analyzing space...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="mb-3 relative inline-block"
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 sm:p-4 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0 border border-transparent hover:border-emerald-200"
              title="Upload image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={selectedImage ? "Add a description..." : "Describe your room or upload a photo..."}
                className="w-full max-h-32 p-3 sm:p-4 bg-transparent outline-none resize-none min-h-[56px] text-slate-800 placeholder:text-slate-400"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-3 sm:p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm disabled:shadow-none"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
