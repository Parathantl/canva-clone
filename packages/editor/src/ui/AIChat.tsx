import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Document } from '@reactcanvas/core';
import { validateSlidePresentation, convertSlidesToDocument } from '../utils/slideSchema';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** If the assistant returned valid slides, the parsed document */
  document?: Document;
  error?: string;
}

export interface AIChatProps {
  /** Called when the user sends a message. Parent app makes the LLM call and returns the response text. */
  onSendMessage: (message: string, history: AIChatMessage[]) => Promise<string>;
  /** Called when user clicks "Apply to Canvas" on a valid slide response */
  onImport: (document: Document) => void;
  /** Whether the parent is currently processing a request */
  isLoading?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
}

export function AIChat({ onSendMessage, onImport, isLoading: externalLoading, placeholder }: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loading = externalLoading ?? isLoading;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput('');
    const userMsg: AIChatMessage = { role: 'user', content: prompt };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const responseText = await onSendMessage(prompt, messages);

      // Try to extract JSON from the response
      let jsonStr = responseText.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      }

      // Try to parse as slide JSON
      let assistantMsg: AIChatMessage;
      try {
        const parsed = JSON.parse(jsonStr);
        const validation = validateSlidePresentation(parsed);
        if (validation.valid) {
          const doc = convertSlidesToDocument(parsed);
          assistantMsg = {
            role: 'assistant',
            content: `Created "${parsed.title}" with ${parsed.slides.length} slide${parsed.slides.length > 1 ? 's' : ''}.`,
            document: doc,
          };
        } else {
          assistantMsg = {
            role: 'assistant',
            content: responseText,
            error: validation.error,
          };
        }
      } catch {
        // Not JSON — show as text response
        assistantMsg = { role: 'assistant', content: responseText };
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          error: err instanceof Error ? err.message : 'Request failed',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, loading, messages, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div style={styles.container}>
      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>{'\u2728'}</div>
            <div style={styles.emptyTitle}>AI Slide Generator</div>
            <div style={styles.emptyText}>
              Describe the slides you want and AI will create them.
            </div>
            <div style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  style={styles.suggestionBtn}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? styles.userMsg : styles.assistantMsg}>
            {msg.error && (
              <div style={styles.errorBox}>{msg.error}</div>
            )}
            {msg.content && (
              <div style={styles.msgText}>{msg.content}</div>
            )}
            {msg.document && (
              <button
                style={styles.applyBtn}
                onClick={() => onImport(msg.document!)}
              >
                Apply to Canvas
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div style={styles.assistantMsg}>
            <div style={styles.loadingDots}>Generating slides...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Describe the slides you want...'}
            style={styles.textarea}
            rows={1}
            disabled={loading}
          />
          <button
            style={{
              ...styles.sendBtn,
              ...(input.trim() && !loading ? {} : styles.sendBtnDisabled),
            }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            {'\u2191'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Create a 5-slide pitch deck for a SaaS startup',
  'Make a quarterly sales report with charts and KPIs',
  'Design a project status dashboard',
  'Create a team introduction presentation',
];

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#16161e',
  },
  messages: {
    flex: 1,
    overflow: 'auto',
    padding: 12,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 16px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#cdd6f4',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
  },
  emptyText: {
    color: '#585878',
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 16,
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  suggestionBtn: {
    padding: '8px 12px',
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    color: '#8888a8',
    fontSize: 11,
    cursor: 'pointer',
    textAlign: 'left' as const,
    lineHeight: 1.3,
  },
  userMsg: {
    backgroundColor: '#2a2a44',
    borderRadius: 12,
    borderBottomRightRadius: 4,
    padding: '8px 12px',
    marginBottom: 8,
    marginLeft: 24,
  },
  assistantMsg: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    padding: '8px 12px',
    marginBottom: 8,
    marginRight: 24,
  },
  msgText: {
    color: '#cdd6f4',
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  errorBox: {
    padding: '6px 8px',
    backgroundColor: 'rgba(243, 139, 168, 0.1)',
    border: '1px solid rgba(243, 139, 168, 0.3)',
    borderRadius: 6,
    color: '#f38ba8',
    fontSize: 11,
    marginBottom: 6,
  },
  applyBtn: {
    marginTop: 8,
    width: '100%',
    height: 32,
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #89b4fa, #cba6f7)',
    color: '#16161e',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingDots: {
    color: '#585878',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputArea: {
    padding: 8,
    borderTop: '1px solid #1e1e2e',
    flexShrink: 0,
  },
  inputRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    minHeight: 32,
    maxHeight: 80,
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '6px 10px',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'Inter, -apple-system, sans-serif',
    lineHeight: 1.4,
    boxSizing: 'border-box' as const,
  },
  sendBtn: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#89b4fa',
    color: '#16161e',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
};
