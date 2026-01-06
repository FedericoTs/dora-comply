'use client';

/**
 * AI Compliance Copilot Chat Component
 *
 * A floating chat interface for asking compliance questions.
 * Uses Claude to query database and provide intelligent answers.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: Date;
}

// ============================================================================
// Component
// ============================================================================

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch('/api/copilot');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data?.suggestions || []);
        }
      } catch {
        // Ignore errors for suggestions
      }
    }
    fetchSuggestions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (questionText?: string) => {
    const question = questionText || input.trim();
    if (!question || isLoading) return;

    setError(null);
    setInput('');

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build history from previous messages
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.data.message,
        toolsUsed: data.data.toolsUsed,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'transition-all duration-200',
          isOpen && 'scale-0 opacity-0'
        )}
        size="icon"
      >
        <Bot className="h-6 w-6" />
        <span className="sr-only">Open AI Copilot</span>
      </Button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-48px)] z-50',
          'bg-background border rounded-xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'h-[600px] max-h-[calc(100vh-48px)] opacity-100 scale-100'
            : 'h-0 opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Compliance Copilot</h3>
              <p className="text-xs text-muted-foreground">Ask me anything about DORA</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 px-2">
                Clear
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-medium mb-1">How can I help?</h4>
                <p className="text-sm text-muted-foreground">
                  Ask about your compliance status, vendors, or documents.
                </p>
              </div>

              {/* Suggestion chips */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 6).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-full',
                        'bg-muted hover:bg-muted/80 text-foreground',
                        'transition-colors cursor-pointer text-left'
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium">You</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex-1 space-y-1 max-w-[85%]',
                      message.role === 'user' && 'text-right'
                    )}
                  >
                    <div
                      className={cn(
                        'inline-block px-3 py-2 rounded-lg text-sm',
                        message.role === 'assistant'
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <FormattedMessage content={message.content} />
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                    {message.toolsUsed && message.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {message.toolsUsed.map((tool, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {formatToolName(tool)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Analyzing your data</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your compliance..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Powered by Claude AI. Responses based on your actual data.
          </p>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function FormattedMessage({ content }: { content: string }) {
  // Basic markdown-like formatting
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Bold text
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
            </div>
          );
        }

        // Numbered lists
        const numberMatch = line.trim().match(/^(\d+)\.\s/);
        if (numberMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-primary font-medium">{numberMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: formattedLine.substring(numberMatch[0].length) }} />
            </div>
          );
        }

        // Empty lines
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }

        // Regular text
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      })}
    </div>
  );
}

function formatToolName(tool: string): string {
  const names: Record<string, string> = {
    getVendorOverview: 'Vendors',
    getDocumentOverview: 'Documents',
    getRoiStatus: 'RoI',
    getIncidentOverview: 'Incidents',
    getConcentrationRiskAnalysis: 'Risk',
    getComplianceGapsAnalysis: 'Gaps',
    searchVendorsByName: 'Search',
    getVendorDetailsById: 'Details',
  };
  return names[tool] || tool;
}
