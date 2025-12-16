'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { storyWriterFlow } from '@/ai/flows/story-writer-flow';
import { Loader2, User, Bot, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/icons/logo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StoryWriterClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setRunning(true);

    try {
      const { story } = await storyWriterFlow({ prompt: input });
      const newAssistantMessage: Message = { role: 'assistant', content: story };
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error: any) {
      console.error("Error generating story:", error);
      const errorMessage: Message = { role: 'assistant', content: "I'm sorry, I couldn't generate a story right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Failed to generate story',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 top-0 bottom-24 z-0 flex items-center justify-center">
        <Logo className="h-[512px] w-[512px] opacity-40 dark:opacity-20" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-bold">AI Story Writer</h1>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <X className="h-6 w-6" />
            </Button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
                )}
                <div className={`p-3 rounded-lg max-w-lg ${message.role === 'user' ? 'bg-primary/80 text-primary-foreground' : 'bg-muted/80'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                </Avatar>
                )}
            </div>
            ))}
            {running && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg bg-muted/80 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-background/80 border-t border-border backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Textarea
                placeholder="Tell me a story about..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                className="flex-grow resize-none bg-muted/80 placeholder:text-muted-foreground rounded-md border-border"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
            />
            <Button type="submit" disabled={running || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
            </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
