import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, Bot, BrainCircuit, Check, Clock3, Mic, UserRound, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "@/services/api";
import { NotchNavbar } from "@/components/NotchNavbar";
import { VoiceConversationModal } from "@/components/VoiceConversationModal";
import type { ChatMessage, ReminderAction } from "@/types/chat";

const examples = [
  "Remind me tomorrow at 10 AM to call John.",
  "Remind me today at 5 PM to send the report.",
];

function formatDate(value?: string) {
  if (!value) return "Scheduled date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ActionCard({ action }: { action: ReminderAction }) {
  return (
    <Card className="mt-3 overflow-hidden border-emerald-200/80 bg-emerald-50/70 shadow-none dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="size-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Reminder created</p>
            <Badge className="border-emerald-200 bg-white/70 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">ACTION COMPLETE</Badge>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">{action.title || "Your reminder"}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatDate(action.scheduledAt)}</span>
            {formatTime(action.scheduledAt) && <span>{formatTime(action.scheduledAt)}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MessageItem({ message }: { message: ChatMessage }) {
  if (message.role === "tool") {
    return (
      <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-3 sm:px-8">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"><WandSparkles className="size-4" /></div>
        <div className="min-w-0 flex-1 rounded-2xl border border-violet-200/70 bg-violet-50/60 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs font-semibold text-violet-900 dark:text-violet-200">createReminder</p><Badge className="border-violet-200 bg-transparent text-[10px] text-violet-700 dark:border-violet-800 dark:text-violet-300">{message.status === "pending" ? "RUNNING" : message.status === "success" ? "COMPLETED" : "FAILED"}</Badge></div>
          <div className="mt-2 flex items-center gap-2 text-sm text-violet-900/75 dark:text-violet-200/75">{message.status === "pending" ? <span className="size-3 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-600" /> : message.status === "success" ? <Check className="size-4 text-emerald-600" /> : <AlertCircle className="size-4 text-rose-600" />}{message.content}</div>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={`mx-auto flex w-full max-w-2xl gap-3 px-4 py-3 sm:px-8 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"}`}>{isUser ? <UserRound className="size-4" /> : <Bot className="size-4" />}</div>
      <div className={`min-w-0 max-w-[min(85%,520px)] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <span className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{isUser ? "You" : "AI assistant"}</span>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? "rounded-tr-md bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "rounded-tl-md border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"}`}>{message.content}</div>
        {message.action && <div className="w-full"><ActionCard action={message.action} /></div>}
      </div>
    </div>
  );
}

export default function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("fusion_chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem("fusion_conversation_id") || undefined;
    } catch {
      return undefined;
    }
  });
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("fusion_chat_messages", JSON.stringify(messages));
      } else {
        localStorage.removeItem("fusion_chat_messages");
      }
    } catch {
      // Ignore storage errors
    }
  }, [messages]);

  useEffect(() => {
    try {
      if (conversationId) {
        localStorage.setItem("fusion_conversation_id", conversationId);
      } else {
        localStorage.removeItem("fusion_conversation_id");
      }
    } catch {
      // Ignore storage errors
    }
  }, [conversationId]);

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setError("");
    setInput("");
    try {
      localStorage.removeItem("fusion_chat_messages");
      localStorage.removeItem("fusion_conversation_id");
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTo({ top: conversation.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Called when voice modal confirms transcript — put it in input and auto-submit
  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    // Submit after React flushes the state update
    setTimeout(() => void submit(text), 0);
  };

  const submit = async (value = input) => {
    const message = value.trim();
    if (!message || loading) return;
    setError("");
    setInput("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: message, status: "success" }]);
    setLoading(true);
    try {
      const response = await sendMessage(message, conversationId);
      setConversationId(response.conversationId);
      if (response.action) {
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "tool", content: "Reminder created", status: "success" }]);
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: response.message, status: "success", action: response.action }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to reach the assistant.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-3 py-3 text-slate-950 dark:bg-[#0d1117] dark:text-white sm:px-6 sm:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950 sm:min-h-[calc(100vh-3rem)]">
        <NotchNavbar onNewChat={handleNewChat} hasMessages={messages.length > 0} />

        <div ref={conversationRef} role="log" aria-live="polite" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,rgba(248,250,252,0.6),rgba(255,255,255,0))] dark:bg-[linear-gradient(to_bottom,rgba(15,23,42,0.35),rgba(2,6,23,0))]">
          {messages.length === 0 ? <div className="flex min-h-full items-center justify-center px-5 py-12 sm:px-8"><div className="w-full max-w-xl text-center"><div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-blue-50 p-2.5 dark:bg-blue-950/50"><img src="/favicon.svg" alt="Miracle Edem" className="size-8" /></div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Miracle Edem</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How can I help?</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Type or speak a request to get started. I'll turn it into a useful action.</p><div className="mt-8 grid gap-3 text-left sm:grid-cols-2">{examples.map((example) => <button key={example} type="button" onClick={() => { setInput(example); void submit(example); }} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm leading-5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 group-hover:text-blue-600">Try an example</span>{example}</button>)}</div></div></div> : <div className="py-6">{messages.map((message) => <MessageItem key={message.id} message={message} />)}{loading && <div className="mx-auto flex w-full max-w-2xl gap-3 px-4 py-3 sm:px-8"><div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"><BrainCircuit className="size-4" /></div><div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="inline-flex items-center gap-2"><span className="flex gap-1"><i className="size-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.2s]" /><i className="size-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.1s]" /><i className="size-1.5 animate-bounce rounded-full bg-blue-500" /></span>AI is thinking</span></div></div>}</div>}
        </div>

        <footer className="border-t border-slate-100 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className={`mx-auto max-w-2xl rounded-2xl border bg-slate-50 p-2 transition-colors dark:bg-slate-900/80 ${error ? "border-rose-300 dark:border-rose-800" : "border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700"}`}>
            <label htmlFor="assistant-input" className="sr-only">Message the AI assistant</label>
            <Textarea
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }}
              placeholder="Type a request..."
              disabled={loading}
              rows={2}
              className="min-h-[56px] resize-none border-0 bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-2">
                {error && <span className="inline-flex items-center gap-1 text-xs text-rose-600"><AlertCircle className="size-3.5" />{error}</span>}
              </div>
              <div className="flex items-center gap-2">
                {/* Voice Chat Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setVoiceOpen(true)}
                  disabled={loading}
                  aria-label="Open voice input"
                  className="text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30"
                >
                  <Mic className="size-5" />
                </Button>
                <Button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="size-9 rounded-xl bg-slate-950 p-0 text-white hover:bg-blue-700 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-200"
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[11px] text-slate-400">
            Press Enter to send <span className="mx-1">·</span> Shift + Enter for a new line
          </p>
        </footer>
      </section>

      {/* Voice Conversation Modal */}
      <VoiceConversationModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onTranscript={handleVoiceTranscript}
      />
    </main>
  );
}
