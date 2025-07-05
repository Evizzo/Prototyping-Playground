import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import PcBuilderAI from '../../ai-agent';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `# 🖥️ Welcome to AI PC Builder Assistant!

I'm your intelligent companion for building the perfect PC. Here's what I can help you with:

## 🎯 **My Capabilities:**
- **🎮 Graphics Cards**: Compare GPUs, performance analysis
- **🔧 Processors**: CPU comparisons, core counts, benchmarks  
- **💰 Price Calculations**: Total build costs with detailed breakdowns
- **🔍 Component Search**: Find parts within your budget
- **⚖️ Comparisons**: Side-by-side component analysis
- **🛠️ Compatibility**: Check if parts work together

## 💡 **Try asking me:**
- "Show me the best graphics cards"
- "Compare Intel vs AMD processors"
- "What's a good gaming build under $1500?"
- "Calculate total price for RTX 4090 + i9-14900K"

**What would you like to know about building your dream PC?**`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiAgent = useRef<PcBuilderAI | null>(null);

  useEffect(() => {
    aiAgent.current = new PcBuilderAI();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiAgent.current?.chat(inputValue);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response || '❌ **Error**: Sorry, I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ **Error**: Sorry, I encountered an error. Please try again or ask a different question.',
        sender: 'ai',
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
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>🤖 AI PC Builder Assistant</h2>
        <p>💡 Your intelligent companion for building the perfect PC</p>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <div className="message-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <pre className="code-block">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="inline-code" {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return <div className="table-wrapper"><table>{children}</table></div>;
                    },
                    blockquote({ children }) {
                      return <blockquote className="markdown-blockquote">{children}</blockquote>;
                    },
                    h1({ children }) {
                      return <h1 className="markdown-h1">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="markdown-h2">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="markdown-h3">{children}</h3>;
                    },
                    ul({ children }) {
                      return <ul className="markdown-ul">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="markdown-ol">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="markdown-li">{children}</li>;
                    },
                    a({ href, children }) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">{children}</a>;
                    }
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
              <div className="message-timestamp">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="💬 Ask me about graphics cards, processors, or complete builds..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
            title="Send message (Ctrl+Enter)"
          >
            {isLoading ? '⏳' : '🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 