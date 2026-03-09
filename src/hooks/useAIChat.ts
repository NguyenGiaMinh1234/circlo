import { useState, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của CIRCLO. Tôi có thể giúp gì cho bạn?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Create placeholder for bot response
    const botMsgId = (Date.now() + 1).toString();

    try {
      // Prepare conversation history (last 10 messages for context)
      const currentMessages = [...messages, userMsg];
      const conversationHistory = currentMessages
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau.');
        }
        if (response.status === 402) {
          throw new Error('Đã hết quota. Vui lòng liên hệ hỗ trợ.');
        }
        throw new Error(`Lỗi kết nối: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Không nhận được phản hồi');
      }

      // Add bot message placeholder
      setMessages(prev => [...prev, {
        id: botMsgId,
        text: '',
        sender: 'bot',
        timestamp: new Date(),
      }]);

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === botMsgId ? { ...m, text: fullText } : m
                )
              );
            }
          } catch {
            // Re-buffer partial lines
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === botMsgId ? { ...m, text: fullText } : m
                )
              );
            }
          } catch { /* ignore */ }
        }
      }

      // If no text was received, show error
      if (!fullText) {
        setMessages(prev =>
          prev.map(m =>
            m.id === botMsgId
              ? { ...m, text: 'Xin lỗi, không nhận được phản hồi. Vui lòng thử lại.' }
              : m
          )
        );
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Add error message as bot response
      setMessages(prev => {
        const hasBot = prev.some(m => m.id === botMsgId);
        if (hasBot) {
          return prev.map(m =>
            m.id === botMsgId
              ? { ...m, text: error instanceof Error ? error.message : 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.' }
              : m
          );
        }
        return [...prev, {
          id: botMsgId,
          text: error instanceof Error ? error.message : 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
          sender: 'bot',
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  return { messages, sendMessage, isLoading };
};
