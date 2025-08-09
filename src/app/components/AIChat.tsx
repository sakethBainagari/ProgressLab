'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatProps {
  code?: string;
  language?: string;
  problemTitle?: string;
  theme?: string;
}

export default function AIChat({ code, language, problemTitle, theme = 'vs-dark' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! 👋 I'm your ProgressLab's AI coding assistant. I can help with:\n\n• Explaining your code\n• Finding bugs and issues\n• Suggesting optimizations\n• Answering programming questions\n• General coding help\n• **Generate complete runnable code**\n\nJust ask me anything! What would you like to work on?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderMessageWithCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add code block with copy button
      const codeContent = match[2].trim();
      const language = match[1] || 'text';
      
      parts.push(
        <div key={`code-${match.index}`} className={`relative my-2 rounded-md ${
          theme === 'vs-dark' ? 'bg-gray-800 border border-gray-600' : 'bg-gray-100 border border-gray-300'
        }`}>
          <div className={`flex items-center justify-between px-3 py-2 border-b ${
            theme === 'vs-dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'
          }`}>
            <span className="text-xs font-mono">{language}</span>
            <button
              onClick={() => copyToClipboard(codeContent)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                theme === 'vs-dark'
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              {copiedCode === codeContent ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className={`p-3 overflow-x-auto text-xs font-mono ${
            theme === 'vs-dark' ? 'text-gray-100' : 'text-gray-800'
          }`}>
            <code>{codeContent}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          code,
          language,
          problemTitle
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    "Explain this code",
    "Generate complete runnable code"
  ];

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className={`flex flex-col h-full max-h-full overflow-hidden ${theme === 'vs-dark' ? 'bg-gray-900 border-l border-gray-700' : 'bg-white border-l border-gray-200'}`}>
      {/* Header - Fixed Height */}
      <div className={`flex items-center justify-between p-3 border-b flex-shrink-0 h-14 ${
        theme === 'vs-dark' 
          ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' 
          : 'border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50'
      }`}>
        <div className="flex items-center space-x-2">
          <Bot className={`w-4 h-4 ${theme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`font-medium text-sm ${theme === 'vs-dark' ? 'text-white' : 'text-gray-900'}`}>ProgressLab AI</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1 rounded-md transition-colors ${
            theme === 'vs-dark' 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-white/50 text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-3 h-3" />
        </button>
      </div>

      {/* Messages - Scrollable Area with Fixed Height */}
      <div className={`flex-1 min-h-0 overflow-hidden ${
        theme === 'vs-dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 text-xs ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : theme === 'vs-dark'
                      ? 'bg-gray-800 text-gray-100 border border-gray-700'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {!message.isUser && (
                      <Bot className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                        theme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    )}
                    {message.isUser && (
                      <User className="w-3 h-3 mt-0.5 flex-shrink-0 text-white" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs whitespace-pre-wrap break-words leading-relaxed">
                        {!message.isUser ? renderMessageWithCodeBlocks(message.text) : message.text}
                      </div>
                      <div className={`text-[10px] mt-1 ${
                        message.isUser 
                          ? 'text-blue-100' 
                          : theme === 'vs-dark' 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-lg p-2.5 max-w-[85%] text-xs ${
                  theme === 'vs-dark'
                    ? 'bg-gray-800 text-gray-100 border border-gray-700'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Bot className={`w-3 h-3 ${theme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <Loader2 className={`w-3 h-3 animate-spin ${theme === 'vs-dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Quick Actions - Fixed Height */}
      {code && (
        <div className={`px-3 py-2 border-t flex-shrink-0 ${
          theme === 'vs-dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className={`px-2 py-1 text-[10px] rounded-full transition-colors whitespace-nowrap ${
                  theme === 'vs-dark'
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70 border border-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input - Fixed Height */}
      <div className={`p-3 border-t flex-shrink-0 ${
        theme === 'vs-dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything! �"
            className={`flex-1 p-2 text-xs rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors ${
              theme === 'vs-dark'
                ? 'bg-gray-700 text-white border border-gray-600 placeholder-gray-400'
                : 'bg-white text-gray-900 border border-gray-300 placeholder-gray-500'
            }`}
            rows={2}
            disabled={isLoading}
            style={{ 
              minHeight: '40px', 
              maxHeight: '60px',
              color: theme === 'vs-dark' ? '#ffffff' : '#1f2937',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${theme === 'vs-dark' ? '#374151' : '#f3f4f6'};
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${theme === 'vs-dark' ? '#6b7280' : '#9ca3af'};
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'vs-dark' ? '#9ca3af' : '#6b7280'};
        }
        
        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${theme === 'vs-dark' ? '#6b7280 #374151' : '#9ca3af #f3f4f6'};
        }
      `}</style>
    </div>
  );
}
