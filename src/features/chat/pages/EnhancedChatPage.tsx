import React, { useState } from 'react';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const EnhancedChatPage: React.FC = () => {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      // Minimal placeholder response; real impl will call unified LLM service
      const reply = `You said: ${trimmed}`;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Sidebar placeholder (future: chat history, tools) */}
      <div className="hidden w-72 border-r lg:block">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Chats</h2>
        </div>
      </div>
      {/* Main chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 p-4">
          <Card className="mx-auto h-full max-w-4xl p-4">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={m.role === 'user' ? 'text-right' : ''}
                  >
                    <Card className="inline-block max-w-[80%] p-3">
                      <ReactMarkdown className="prose prose-invert max-w-none">
                        {m.content}
                      </ReactMarkdown>
                    </Card>
                  </div>
                ))}
                {loading && (
                  <div className="text-muted-foreground">
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
        <div className="border-t p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Message AI Employee..."
              className="min-h-[80px] flex-1"
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || !input.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatPage;
