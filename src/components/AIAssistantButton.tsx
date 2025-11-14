import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-[#10A37F] hover:bg-[#0d8a6a] text-white z-50 transition-all hover:scale-110"
          title="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}
      {isOpen && <AIAssistant onClose={() => setIsOpen(false)} />}
    </>
  );
}
