import { useState, useEffect } from 'react';

export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: number;
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Load messages from localStorage on mount
    const savedMessages = localStorage.getItem('chat-history');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'timestamp'>) => {
    const newMessage = { ...message, timestamp: Date.now() };
    setMessages(prev => {
      const updated = [...prev, newMessage];
      localStorage.setItem('chat-history', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLastMessage = (content: string) => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content
        };
        localStorage.setItem('chat-history', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chat-history');
  };

  return {
    messages,
    addMessage,
    updateLastMessage,
    clearHistory
  };
}