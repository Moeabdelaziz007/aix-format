'use client';

/**
 * AgentInvokePanel — AIX Studio
 * Design: OpenAI Playground × Cursor IDE — TypeUI Perspective depth system.
 * Layers: 0 #09090B → 1 #111113 → 2 #18181B → 3 #27272A → 4 #3F3F46 → 5 white/5%
 * Accent: #00BD7D (single, surgical use only).
 * Type: Oswald (labels) · Poppins (body) · JetBrains Mono (code/metrics).
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  X,
  ChevronDown,
  Wrench,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type Role = 'user' | 'agent';

interface ToolCall {
  name: string;
  params: Record<string, unknown>;
  result?: unknown;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  agentName?: string;
  latencyMs?: number;
  tokens?: number;
  toolCalls?: ToolCall[];
  streaming?: boolean;
}

interface Agent {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  trustScore: number;
  kycTier: string;
  model: string;
}

// ─── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_AGENT: Agent = {
  id: 'agent_aix_v2',
  name: 'AIX-Agent-v2',
  initials: 'AX',
  online: true,
  trustScore: 98,
  kycTier: 'TIER-3',
  model: 'AIX-Agent-v2',
};

const MODEL_OPTIONS = ['AIX-Agent-v2', 'AIX-Agent-v1', 'AIX-Sentinel', 'AIX-Hermes'];

const EXAMPLE_PROMPTS = [
  'Audit my agent\'s manifest',
  'Generate a tool-calling skill',
  'Explain the trust score',
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function AgentInvokePanel({
  agent = DEFAULT_AGENT,
}: {
  agent?: Agent;
}) {
  // Config
  const [model, setModel] = useState(agent.model);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [stream, setStream] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isInvoking, setIsInvoking] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-grow textarea (1→5 rows)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 22;
    const max = lineHeight * 5;
    el.style.height = Math.min(el.scrollHeight, max) + 'px';
  }, [input]);

  const tokenCount = input.length; // simple heuristic for UI demo

  // Real agent invocation
  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isInvoking) return;

    const userMsg: Message = {
      id: 'u_' + Date.now(),
      role: 'user',
      content,
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsInvoking(true);

    const start = performance.now();
    
    try {
      const response = await fetch('/api/agent/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          taskDescription: content,
          systemPrompt
        })
      });

      const result = await response.json();
      const latency = Math.round(performance.now() - start);

      if (!response.ok) throw new Error(result.error || 'Failed to invoke agent');

      const agentMsg: Message = {
        id: 'a_' + Date.now(),
        role: 'agent',
        agentName: agent.name,
        content: result.result || result.message || 'Task completed with no output.',
        latencyMs: latency,
        tokens: result.usage?.total_tokens || 0,
        toolCalls: result.toolCalls || []
      };

      setMessages((m) => [...m, agentMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: 'e_' + Date.now(),
        role: 'agent',
        agentName: 'System',
        content: `❌ Error: ${error.message}`
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsInvoking(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex h-[720px] w-full overflow-hidden border border-[#27272A]"
      style={{
        background: '#09090B',
        fontFamily: 'var(--font-poppins), system-ui, sans-serif',
      }}
    >
      {/* ─── LEFT COLUMN — Layer 1 ──────────────────────────────────────── */}
      <aside
        className="flex w-[300px] flex-col border-r border-[#27272A]"
        style={{ background: '#111113' }}
      >
        {/* Agent header */}
        <div className="flex items-center gap-3 border-b border-[#27272A] px-4 py-4">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#27272A] text-[12px] tracking-wider text-zinc-200"
            style={{ fontFamily: 'var(--font-oswald)', fontWeight: 700 }}
          >
            {agent.initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              className="truncate text-[16px] text-zinc-100"
              style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
            >
              {agent.name}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  agent.online ? 'animate-pulse' : ''
                }`}
                style={{ background: agent.online ? '#00BD7D' : '#52525B' }}
              />
              <span className="text-[11px] text-zinc-500">
                {agent.online ? 'online' : 'offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Config */}
        <div className="flex flex-col gap-5 px-4 py-5">
          {/* Model */}
          <ConfigRow label="Model">
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full appearance-none border-0 bg-[#27272A] px-3 py-2 pr-8 text-[13px] text-zinc-200 outline-none transition-colors hover:bg-[#3F3F46] focus:bg-[#3F3F46]"
                style={{ fontFamily: 'var(--font-poppins)', borderRadius: 0 }}
              >
                {MODEL_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-[#18181B]">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </ConfigRow>

          {/* Max tokens */}
          <ConfigRow label="Max tokens">
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full border-0 bg-[#27272A] px-3 py-2 text-[13px] text-zinc-200 outline-none transition-colors focus:bg-[#3F3F46]"
              style={{ fontFamily: 'var(--font-jetbrains-mono)', borderRadius: 0 }}
            />
          </ConfigRow>

          {/* Temperature */}
          <ConfigRow
            label="Temperature"
            valueLabel={
              <span
                className="text-[11px] text-zinc-400"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                {temperature.toFixed(2)}
              </span>
            }
          >
            <TempSlider value={temperature} onChange={setTemperature} />
          </ConfigRow>

          {/* Stream toggle */}
          <div className="flex items-center justify-between">
            <label
              className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
              style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
            >
              Stream
            </label>
            <Switch checked={stream} onChange={setStream} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#27272A]" />

        {/* System prompt */}
        <div className="flex flex-1 flex-col gap-2 px-4 py-5">
          <label
            className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
            style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
          >
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a sovereign agent operating under AIX protocol v1.4..."
            className="flex-1 resize-none border-0 bg-[#27272A] p-3 text-[14px] leading-relaxed text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:bg-[#3F3F46]"
            style={{ fontFamily: 'var(--font-poppins)', borderRadius: 0 }}
          />
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-between border-t border-[#27272A] px-4 py-3">
          <div className="flex flex-col">
            <span
              className="text-[9px] uppercase tracking-[0.2em] text-zinc-600"
              style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
            >
              Trust
            </span>
            <span
              className="text-[12px] text-zinc-300"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              {agent.trustScore}/100
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span
              className="text-[9px] uppercase tracking-[0.2em] text-zinc-600"
              style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
            >
              KYC
            </span>
            <span
              className="text-[12px] text-zinc-300"
              style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
            >
              {agent.kycTier}
            </span>
          </div>
        </div>
      </aside>

      {/* ─── RIGHT COLUMN — Layer 2 ─────────────────────────────────────── */}
      <section
        className="flex flex-1 flex-col"
        style={{ background: '#18181B' }}
      >
        {/* Thread header (subtle) */}
        <div className="flex items-center justify-between border-b border-[#27272A] px-6 py-3">
          <span
            className="text-[10px] uppercase tracking-[0.2em] text-zinc-500"
            style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
          >
            Invocation
          </span>
          <span
            className="text-[10px] text-zinc-600"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            session · {agent.id.slice(0, 12)}
          </span>
        </div>

        {/* Messages thread OR empty state */}
        <div
          ref={threadRef}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          {messages.length === 0 ? (
            <EmptyState onPrompt={(p) => handleSend(p)} />
          ) : (
            <div className="flex flex-col gap-7">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  expanded={expandedTools}
                  onToggle={(name) =>
                    setExpandedTools((s) => ({ ...s, [name]: !s[name] }))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Input bar — Layer 3 elevated */}
        <div
          className="border-t border-[#27272A] px-6 py-4"
          style={{
            background: '#27272A',
            boxShadow: '0 -8px 24px -12px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-end gap-3">
            <button
              type="button"
              className="mb-1 flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-200"
              aria-label="Attach"
            >
              <Paperclip size={15} />
            </button>

            <div className="relative flex flex-1 flex-col">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Send a message to the agent..."
                rows={1}
                className="w-full resize-none border-0 border-b border-transparent bg-transparent py-2 pr-2 text-[14px] leading-[22px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-[#00BD7D]"
                style={{ fontFamily: 'var(--font-poppins)' }}
              />
              <div className="mt-1 flex items-center justify-between">
                {input.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-zinc-300"
                  >
                    <X size={11} /> clear
                  </button>
                ) : (
                  <span />
                )}
                <span
                  className="text-[11px] text-zinc-500"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {tokenCount} / {maxTokens}
                </span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isInvoking}
              whileTap={{ scale: 0.97, filter: 'brightness(0.9)' }}
              className="mb-1 flex h-10 items-center gap-2 px-5 text-[12px] uppercase tracking-[0.18em] text-black transition-opacity disabled:opacity-40"
              style={{
                background: '#00BD7D',
                fontFamily: 'var(--font-oswald)',
                fontWeight: 700,
                borderRadius: 0,
              }}
            >
              {isInvoking ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Invoke
                  <span
                    className="flex items-center gap-0.5 text-[10px] opacity-70"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  >
                    ⌘<CornerDownLeft size={10} />
                  </span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ConfigRow({
  label,
  valueLabel,
  children,
}: {
  label: string;
  valueLabel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-[0.18em] text-zinc-500"
          style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}
        >
          {label}
        </span>
        {valueLabel}
      </div>
      {children}
    </div>
  );
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 transition-colors"
      style={{
        background: checked ? '#00BD7D' : '#3F3F46',
        borderRadius: 0,
      }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-0.5 h-4 w-4 transition-transform"
        style={{
          background: '#09090B',
          transform: `translateX(${checked ? 18 : 2}px)`,
          borderRadius: 0,
        }}
      />
    </button>
  );
}

function TempSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative h-6 select-none">
      {/* track */}
      <div
        className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2"
        style={{ background: '#27272A' }}
      />
      {/* fill */}
      <div
        className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2"
        style={{
          width: `${value * 100}%`,
          background: '#00BD7D',
        }}
      />
      {/* thumb */}
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${value * 100}%`,
          background: '#00BD7D',
          boxShadow: '0 0 0 3px #18181B',
        }}
      />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h2
          className="text-[32px] text-zinc-400"
          style={{
            fontFamily: 'var(--font-oswald)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          Ready.
        </h2>
        <p
          className="text-[14px] text-zinc-500"
          style={{ fontFamily: 'var(--font-poppins)' }}
        >
          Configure your agent and send a message to begin.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPrompt(p)}
            className="px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:bg-[#3F3F46] hover:text-zinc-100"
            style={{
              background: '#27272A',
              fontFamily: 'var(--font-poppins)',
              borderRadius: 0,
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  expanded,
  onToggle,
}: {
  msg: Message;
  expanded: Record<string, boolean>;
  onToggle: (name: string) => void;
}) {
  if (msg.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div
          className="max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed text-zinc-100 transition-colors hover:bg-[#3F3F46]"
          style={{
            background: '#27272A',
            fontFamily: 'var(--font-poppins)',
            borderRadius: 0,
          }}
        >
          {msg.content}
        </div>
      </motion.div>
    );
  }

  // Agent message — no bubble
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex max-w-[85%] flex-col gap-2"
    >
      {/* Meta header */}
      <div
        className="flex items-center gap-2 text-[11px] text-zinc-500"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        <span style={{ fontFamily: 'var(--font-oswald)', fontWeight: 600 }}>
          {msg.agentName}
        </span>
        <span className="text-zinc-700">·</span>
        {msg.streaming ? (
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 animate-pulse"
              style={{ background: '#00BD7D' }}
            />
            streaming
          </span>
        ) : (
          <>
            <span>{msg.latencyMs}ms</span>
            <span className="text-zinc-700">·</span>
            <span>{msg.tokens} tokens</span>
          </>
        )}
      </div>

      {/* Tool calls */}
      {msg.toolCalls?.map((tc) => (
        <ToolCallBlock
          key={tc.name}
          call={tc}
          expanded={!!expanded[msg.id + tc.name]}
          onToggle={() => onToggle(msg.id + tc.name)}
        />
      ))}

      {/* Content */}
      <p
        className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-200"
        style={{ fontFamily: 'var(--font-poppins)' }}
      >
        {msg.content}
        {msg.streaming && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse"
            style={{ background: '#00BD7D' }}
          />
        )}
      </p>
    </motion.div>
  );
}

function ToolCallBlock({
  call,
  expanded,
  onToggle,
}: {
  call: ToolCall;
  expanded: boolean;
  onToggle: () => void;
}) {
  const paramStr = JSON.stringify(call.params);
  const summary = paramStr.length > 50 ? paramStr.slice(0, 50) + '...' : paramStr;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full flex-col items-start gap-1 border-l-[3px] py-2 pl-3 pr-2 text-left transition-colors hover:bg-[#27272A]"
      style={{
        background: '#111113',
        borderLeftColor: '#00BD7D',
      }}
    >
      <div
        className="flex items-center gap-2 text-[12px] text-zinc-300"
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        <Wrench size={11} className="text-[#00BD7D]" />
        <span>
          {call.name}({expanded ? '' : summary})
        </span>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1 w-full overflow-hidden text-[11px] leading-relaxed text-zinc-400"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            {JSON.stringify(
              { params: call.params, result: call.result },
              null,
              2
            )}
          </motion.pre>
        )}
      </AnimatePresence>
    </button>
  );
}

// displayName removed - was causing build errors
