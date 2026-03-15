import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, BookOpen, User, Search, Award, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AIHelper = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const initialMessage = {
    role: 'bot',
    text: `Hi ${user ? user.name : 'there'}! 👋 I'm your LearnBox AI Assistant. How can I help you today?`
  };

  const quickSuggestions = [
    { icon: <Search size={14} />, text: 'Find Courses' },
    { icon: <User size={14} />, text: 'My Progress' },
    { icon: <BookOpen size={14} />, text: 'Quiz Help' },
    { icon: <Award size={14} />, text: 'Certificate Help' }
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', text: textToSend };
    
    // Convert to exactly what the Gemini API backend expects
    const history = messages.map(m => ({ role: m.role, text: m.text }));
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chat', { 
        message: textToSend,
        history: history 
      });

      setMessages(prev => [...prev, { role: 'bot', text: response.data.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: error.response?.data?.error || 'Oops! I am having trouble connecting. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Convert markdown links or bold tags in bot responses (simple parser)
  const formatText = (text) => {
    // Basic bold **text** to <strong>
    const boldFormatted = text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return boldFormatted;
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      width: '380px',
      height: '600px',
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '24px',
      boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000,
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>
        {`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white'
          }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Virtual Assistant</h3>
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
              Online
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%'
          }}>
            <div style={{
              background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              border: m.role === 'bot' ? '1px solid rgba(255,255,255,0.1)' : 'none',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              color: 'white',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-line' // Important for newlines in returned Gemini strings
            }}>
              {formatText(m.text)}
            </div>
            {m.role === 'bot' && i === messages.length - 1 && !isTyping && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '4px', marginTop: '4px', display: 'block' }}>
                LearnBox AI
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '16px',
              borderRadius: '16px 16px 16px 4px',
              display: 'flex',
              gap: '6px'
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite 0.2s' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1s infinite 0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions (only show if no user interaction yet or bot just sent greeting) */}
      {messages.length === 1 && !isTyping && (
        <div style={{ padding: '0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
          {quickSuggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSend(sug.text)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: '20px',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'white'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'var(--text-dim)'; }}
            >
              {sug.icon} {sug.text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '8px 16px',
        }}>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isTyping}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '0.95rem',
              outline: 'none',
              padding: '4px 0'
            }}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              background: input.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: input.trim() ? 'white' : 'var(--text-dim)',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={16} style={{ marginLeft: '2px' }} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIHelper;
