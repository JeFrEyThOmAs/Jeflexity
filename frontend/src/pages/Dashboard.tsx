import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import axios, { isAxiosError } from "axios";
import { Search, LogOut, Plus, LoaderCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AssistantMarkdown } from "@/components/AssistantMarkdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { BACKEND_URL } from "@/lib/config";

const supabase = createClient();

type ConversationItem = {
  id: string;
  title: string | null;
  slug: string;
  lastMessage: string | null;
};

type Message = {
  id: number;
  content: string;
  role: "User" | "Assistant";
  conversationId: string;
  createdAt: string;
};

type AskResponse = {
  conversationId: string;
  answer: string;
  sources: Array<{ url: string }>;
};

function extractAnswer(modelOutput: string) {
  const match = modelOutput.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/i);
  return match?.[1]?.trim() || modelOutput;
}

function extractFollowUps(modelOutput: string) {
  const matches = modelOutput.match(/<question>([\s\S]*?)<\/question>/gi) || [];
  return matches
    .map((match) => match.replace(/<\/?question>/gi, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function resolveAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown>;
  for (const key of ["avatar_url", "picture", "image"]) {
    const v = meta[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  const identity = user.identities?.[0]?.identity_data as Record<string, unknown> | undefined;
  const fromIdentity = identity?.avatar_url;
  if (typeof fromIdentity === "string" && fromIdentity.startsWith("http")) return fromIdentity;
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<Array<{ url: string }>>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const avatarUrl = useMemo(() => resolveAvatarUrl(user), [user]);

  const queryHistory = useMemo(() => {
    const conversationPrompts = conversations
      .map((conversation) => conversation.title || "")
      .filter(Boolean) as string[];
    const sentPrompts = messages.filter((message) => message.role === "User").map((message) => message.content);
    return Array.from(new Set([...sentPrompts, ...conversationPrompts]));
  }, [conversations, messages]);

  const autoCompleteSuggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];
    const pool = [...followUps, ...queryHistory];
    return Array.from(
      new Set(pool.filter((item) => item.toLowerCase().includes(trimmed) && item.toLowerCase() !== trimmed))
    ).slice(0, 5);
  }, [followUps, query, queryHistory]);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    let token = data.session?.access_token;
    if (!token) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      token = refreshed.session?.access_token;
    }
    return token ?? "";
  }

  async function fetchConversations() {
    const accessToken = await getAccessToken();
    const response = await axios.get(`${BACKEND_URL}/conversation`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setConversations(response.data.conversations || []);
  }

  async function fetchConversationDetails(conversationId: string) {
    const accessToken = await getAccessToken();
    const response = await axios.get(`${BACKEND_URL}/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setMessages(response.data.messages || []);
    setFollowUps([]);
    setActiveConversationId(conversationId);
  }

  /** Same pipeline as pressing Enter / the search button: continues the active thread via follow-up API when applicable. */
  async function ask(nextQuery?: string) {
    const trimmedQuery = (nextQuery ?? query).trim();
    if (!trimmedQuery || isLoading) return;
    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();
      const useFollowUp = !!activeConversationId;
      const endpoint = useFollowUp ? `${BACKEND_URL}/jefplexity_ask/follow_up` : `${BACKEND_URL}/jefplexity_ask`;
      const payload = useFollowUp
        ? { conversationId: activeConversationId, query: trimmedQuery }
        : { query: trimmedQuery };

      const response = await axios.post<AskResponse>(endpoint, payload, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const optimisticUserMessage: Message = {
        id: Date.now(),
        content: trimmedQuery,
        role: "User",
        conversationId: response.data.conversationId,
        createdAt: new Date().toISOString(),
      };
      const optimisticAssistantMessage: Message = {
        id: Date.now() + 1,
        content: extractAnswer(response.data.answer),
        role: "Assistant",
        conversationId: response.data.conversationId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);
      setActiveConversationId(response.data.conversationId);
      setSources(response.data.sources || []);
      setFollowUps(extractFollowUps(response.data.answer));
      setQuery("");
      await fetchConversations();
    } catch (error) {
      console.error(error);
      const message =
        isAxiosError(error) &&
        error.response?.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof (error.response.data as { message: unknown }).message === "string"
          ? (error.response.data as { message: string }).message
          : isAxiosError(error) && error.response?.status === 403
            ? "Not signed in or session expired."
            : "Failed to fetch answer. Please try again.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        localStorage.removeItem("jefplexity-authenticated");

        return;
      }

      setUser(data.session.user);
      localStorage.setItem("jefplexity-authenticated", "1");
      await fetchConversations();
    }

    init();
  }, [navigate]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      });
    });
  }, [messages, isLoading]);

  return (
    <main className="h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex h-screen max-w-[1400px] gap-3 px-3 py-3">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl md:flex md:flex-col">
          <Button
            className="mb-3 w-full justify-start gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            variant="ghost"
            onClick={() => {
              setActiveConversationId(null);
              setMessages([]);
              setSources([]);
              setFollowUps([]);
              setQuery("");
            }}
          >
            <Plus className="size-4" />
            New thread
          </Button>

          <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">Threads</div>
          <div className="flex-1 space-y-1 overflow-y-auto pr-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  conversation.id === activeConversationId
                    ? "border-white/15 bg-white/10 text-white"
                    : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => fetchConversationDetails(conversation.id)}
              >
                <p className="truncate font-medium">{conversation.title || "Untitled conversation"}</p>
                <p className="mt-1 truncate text-xs opacity-70">{conversation.lastMessage || "No messages yet"}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-gradient-to-b from-zinc-950/90 to-black/95 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_-24px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <header className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-full ring-2 ring-violet-500/30 ring-offset-2 ring-offset-zinc-950"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-semibold uppercase text-white ring-2 ring-white/10">
                  {(user?.email?.slice(0, 1) ?? "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight">
                  {activeConversation?.title || "Discover anything"}
                </h1>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-lg hover:bg-white/10"
              onClick={async () => {
                await supabase.auth.signOut();
                localStorage.removeItem("jefplexity-authenticated");
                navigate("/auth", { replace: true });
              }}
            >
              <LogOut className="mr-2 size-4" /> Logout
            </Button>
          </header>

          <div
            ref={messagesScrollRef}
            className="relative min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pt-1"
          >
            {isLoading && !messages.length && (
              <div className="absolute inset-x-0 top-8 flex flex-col items-center gap-4 text-center">
                <LoaderCircle className="size-10 animate-spin text-violet-400/80" />
                <p className="text-sm text-zinc-500">Searching trusted sources…</p>
              </div>
            )}

            {!messages.length && !isLoading && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Sparkles className="size-6 text-violet-400/80" />
                </div>
                <div className="max-w-sm text-sm text-zinc-500">
                  Ask anything. Answers use live web results, markdown formatting, and related explorations below.
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "User" ? "justify-end" : "justify-start"}`}>
                {message.role === "User" ? (
                  <div className="max-w-[min(100%,42rem)] rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-[15px] font-medium text-zinc-900 shadow-sm">
                    {message.content}
                  </div>
                ) : (
                  <div className="max-w-[min(100%,48rem)] rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 shadow-inner shadow-black/20">
                    <AssistantMarkdown content={message.content} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-500">
                  <LoaderCircle className="size-4 animate-spin text-violet-400" />
                  Thinking with sources…
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            {!!followUps.length && (
              <div className="space-y-2 pb-1">
                <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Related</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {followUps.map((followUp, index) => (
                    <button
                      key={`${index}-${followUp.slice(0, 48)}`}
                      type="button"
                      className="max-w-full rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-zinc-400 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-zinc-100"
                      onClick={() => {
                        setQuery(followUp);
                        void ask(followUp);
                      }}
                    >
                      <span className="line-clamp-2">{followUp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!!sources.length && (
              <div className="space-y-2">
                <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sources</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {sources.slice(0, 8).map((source) => (
                    <a
                      key={source.url}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                      href={source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {source.url.replace(/^https?:\/\//, "").split("/")[0]}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!!autoCompleteSuggestions.length && (
              <div className="flex flex-wrap gap-2 text-xs">
                {autoCompleteSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-muted-foreground transition hover:bg-white/10 hover:text-white"
                    onClick={() => setQuery(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-zinc-950/80 p-2 shadow-inner shadow-black/40">
              <Textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask();
                  }
                }}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="min-h-14 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 disabled:opacity-60"
              />
              <Button
                className="h-10 shrink-0 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => void ask()}
                disabled={isLoading}
              >
                {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
