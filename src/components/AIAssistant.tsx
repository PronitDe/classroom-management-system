import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onClose: () => void;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { profile, userRole } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    if (profile && userRole) {
      const greeting = `Hello ${profile.name}! I'm your AI assistant for the SOET Smart CMS. I can help you with:

${userRole.role === 'TEACHER' ? '• Managing room bookings\n• Recording attendance\n• Reporting issues\n• Understanding your booking history' : ''}
${userRole.role === 'SPOC' ? '• Approving bookings\n• Managing rooms\n• Handling issue reports\n• Viewing system statistics' : ''}
${userRole.role === 'ADMIN' ? '• Managing notices\n• Reviewing feedback\n• System administration\n• Viewing analytics' : ''}
${userRole.role === 'STUDENT' ? '• Submitting feedback\n• Viewing notices\n• Checking your feedback history\n• Understanding system features' : ''}

What would you like help with?`;
      
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [profile, userRole]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const messagesToSend = [...messages, userMessage];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Verify session before calling function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session expired. Please refresh the page.');
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('Not logged in. Please refresh the page.');
      }
      
      console.log('Calling AI assistant with valid session for user:', session.user.id);
      
      // Use supabase.functions.invoke instead of fetch
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: messagesToSend },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }
      
      const assistantResponse = data?.response;
      
      if (!assistantResponse || typeof assistantResponse !== 'string') {
        throw new Error('Invalid response format from AI');
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantResponse
      }]);
      
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again or refresh the page if the problem persists.`
      }]);
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

  return (
    <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl border-[#222] bg-[#111] flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center">
            <Bot className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-[#D1D5DB]">Here to help</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-[#222]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-black" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-[#10A37F] text-white'
                    : 'bg-[#1a1a1a] text-white border border-[#222]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#10A37F] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-black" />
              </div>
              <div className="bg-[#1a1a1a] border border-[#222] rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#10A37F]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-[#222]">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="resize-none bg-[#1a1a1a] border-[#222] text-white placeholder:text-[#666]"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-[#10A37F] hover:bg-[#0d8a6a] text-white h-auto px-3"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
