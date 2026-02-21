/**
 * Gateway Business Data Hooks
 * Real API first, mock fallback when disconnected.
 * Each hook tries the GatewayClient; on failure falls back to mock data.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';

// ============ Types ============

export interface SessionInfo {
  id: string;
  key: string;
  label: string;
  model: string;
  kind: 'main' | 'isolated' | 'cron' | 'unknown';
  tokenUsage: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  status: 'active' | 'idle' | 'completed';
  lastActive: Date;
  messageCount: number;
  agentId?: string;
}

export interface CostData {
  todayCost: number;
  yesterdayCost: number;
  dailyBudget: number;
  monthlyBudget: number;
  monthlyCost: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  breakdown: CostBreakdownItem[];
  hourly: number[];
}

export interface CostBreakdownItem {
  model: string;
  cost: number;
  percent: number;
  tokens: number;
}

export interface MemoryEntry {
  id: string;
  filename: string;
  date: Date;
  summary: string;
  size: number;
  chunks: number;
  type: 'daily' | 'long-term' | 'conversation';
}

export interface MemoryData {
  entries: MemoryEntry[];
  healthPercent: number;
  totalFiles: number;
  totalChunks: number;
  totalSize: number;
  lastUpdated: Date;
}

export interface CronJob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  scheduleExpr: string;
  scheduleKind: 'at' | 'every' | 'cron';
  lastRun: Date | null;
  nextRun: Date | null;
  status: 'enabled' | 'disabled' | 'running';
  lastResult: 'success' | 'error' | 'pending' | 'skipped';
  lastError?: string;
  payload: string;
  sessionTarget: 'main' | 'isolated';
}

export interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  description: string;
  detail: string;
}

export interface SecurityStatus {
  overallScore: number;
  checks: SecurityCheck[];
  lastScan: Date;
}

export interface ModelRoute {
  id: string;
  pattern: string;
  model: string;
  fallback: string | null;
  enabled: boolean;
  monthlyTokens: number;
  monthlyCost: number;
}

export interface CircuitBreaker {
  model: string;
  status: 'closed' | 'open' | 'half-open';
  failureRate: number;
  lastFailure: Date | null;
  cooldownMs: number;
}

export interface ModelRouteData {
  routes: ModelRoute[];
  circuitBreakers: CircuitBreaker[];
  defaultModel: string;
}

// ============ Mock Data ============

const MOCK_SESSIONS: SessionInfo[] = [
  { id: 'main-001', key: 'agent:main:main', label: 'main', model: 'claude-opus-4', kind: 'main', tokenUsage: 42, inputTokens: 85000, outputTokens: 32000, cost: 8.50, status: 'active', lastActive: new Date(Date.now() - 60000), messageCount: 47 },
  { id: 'sub-001', key: 'agent:main:clawflag', label: 'clawflag-dev', model: 'claude-sonnet-4', kind: 'isolated', tokenUsage: 78, inputTokens: 120000, outputTokens: 45000, cost: 3.20, status: 'active', lastActive: new Date(Date.now() - 300000), messageCount: 12 },
  { id: 'cron-001', key: 'cron:daily-news', label: 'daily-news', model: 'claude-haiku-3.5', kind: 'cron', tokenUsage: 15, inputTokens: 8000, outputTokens: 2000, cost: 0.05, status: 'completed', lastActive: new Date(Date.now() - 3600000), messageCount: 3 },
];

const MOCK_COST: CostData = {
  todayCost: 12.58, yesterdayCost: 8.42, dailyBudget: 50, monthlyBudget: 500,
  monthlyCost: 186.30, trend: 'up', trendPercent: 49.4,
  breakdown: [
    { model: 'claude-opus-4', cost: 8.50, percent: 67.6, tokens: 117000 },
    { model: 'claude-sonnet-4', cost: 3.20, percent: 25.4, tokens: 165000 },
    { model: 'claude-haiku-3.5', cost: 0.88, percent: 7.0, tokens: 450000 },
  ],
  hourly: [0, 0, 0, 0, 0, 0, 0, 0.2, 0.8, 1.5, 2.1, 1.8, 0.5, 0.3, 0.9, 1.2, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0, 0],
};

const MOCK_MEMORY: MemoryData = {
  entries: [
    { id: 'm1', filename: 'MEMORY.md', date: new Date(Date.now() - 86400000), summary: '长期记忆 - 团队架构、项目信息、永久指令', size: 12800, chunks: 45, type: 'long-term' },
    { id: 'm2', filename: '2026-02-21.md', date: new Date(Date.now() - 86400000), summary: 'ClawFlag MVP 全量开发，18个组件完成', size: 3200, chunks: 12, type: 'daily' },
    { id: 'm3', filename: 'conversation-log.md', date: new Date(Date.now() - 86400000), summary: '完整对话记录存档', size: 4500, chunks: 18, type: 'conversation' },
  ],
  healthPercent: 82, totalFiles: 12, totalChunks: 89, totalSize: 24400, lastUpdated: new Date(Date.now() - 3600000),
};

const MOCK_CRON: CronJob[] = [
  { id: 'cron-1', name: 'daily-news', schedule: '每天 9:00', scheduleExpr: '0 9 * * *', scheduleKind: 'cron', lastRun: new Date(Date.now() - 54000000), nextRun: new Date(Date.now() + 32400000), status: 'enabled', lastResult: 'success', payload: '生成每日新闻摘要', sessionTarget: 'isolated' },
  { id: 'cron-2', name: 'heartbeat', schedule: '每 30 分钟', scheduleExpr: '*/30 * * * *', scheduleKind: 'cron', lastRun: new Date(Date.now() - 900000), nextRun: new Date(Date.now() + 900000), status: 'enabled', lastResult: 'success', payload: '心跳检查', sessionTarget: 'main' },
  { id: 'cron-3', name: 'weekly-report', schedule: '每周一 10:00', scheduleExpr: '0 10 * * 1', scheduleKind: 'cron', lastRun: null, nextRun: new Date(Date.now() + 172800000), status: 'disabled', lastResult: 'pending', payload: '生成周报', sessionTarget: 'isolated' },
];

const MOCK_SECURITY: SecurityStatus = {
  overallScore: 72,
  checks: [
    { id: 's1', name: '版本检查', status: 'warn', description: 'Gateway 版本略旧', detail: '当前 2026.2.19-2，最新 2026.2.22' },
    { id: 's2', name: '认证配置', status: 'pass', description: 'Token 认证已启用', detail: 'auth_token 已配置' },
    { id: 's3', name: '网络暴露', status: 'pass', description: '仅本地回环访问', detail: 'bind: loopback (127.0.0.1)' },
    { id: 's4', name: '代理配置', status: 'fail', description: '未配置反向代理', detail: '建议通过 nginx/caddy 提供 TLS' },
    { id: 's5', name: 'Skill 安全', status: 'warn', description: '2 个本地 skill 未经审计', detail: 'volcengine-asr, windows-control' },
  ],
  lastScan: new Date(Date.now() - 7200000),
};

const MOCK_ROUTES: ModelRouteData = {
  defaultModel: 'claude-opus-4',
  routes: [
    { id: 'r1', pattern: 'main', model: 'claude-opus-4', fallback: 'claude-sonnet-4', enabled: true, monthlyTokens: 2400000, monthlyCost: 145.00 },
    { id: 'r2', pattern: 'cron/*', model: 'claude-haiku-3.5', fallback: 'claude-sonnet-4', enabled: true, monthlyTokens: 1800000, monthlyCost: 12.50 },
    { id: 'r3', pattern: 'isolated/*', model: 'claude-sonnet-4', fallback: 'claude-opus-4', enabled: true, monthlyTokens: 3200000, monthlyCost: 28.80 },
  ],
  circuitBreakers: [
    { model: 'claude-opus-4', status: 'closed', failureRate: 0.5, lastFailure: new Date(Date.now() - 86400000), cooldownMs: 60000 },
    { model: 'claude-sonnet-4', status: 'closed', failureRate: 0, lastFailure: null, cooldownMs: 30000 },
    { model: 'claude-haiku-3.5', status: 'closed', failureRate: 1.2, lastFailure: new Date(Date.now() - 43200000), cooldownMs: 15000 },
  ],
};

// ============ Helper: format schedule for display ============

function formatSchedule(schedule: Record<string, unknown>): { display: string; expr: string; kind: 'at' | 'every' | 'cron' } {
  const kind = schedule.kind as string;
  if (kind === 'cron') {
    return { display: String(schedule.expr), expr: String(schedule.expr), kind: 'cron' };
  }
  if (kind === 'every') {
    const ms = schedule.everyMs as number;
    const mins = Math.round(ms / 60000);
    return { display: mins >= 60 ? `每 ${Math.round(mins / 60)} 小时` : `每 ${mins} 分钟`, expr: `every ${ms}ms`, kind: 'every' };
  }
  if (kind === 'at') {
    return { display: `一次性: ${schedule.at}`, expr: String(schedule.at), kind: 'at' };
  }
  return { display: '未知', expr: '', kind: 'cron' };
}

// ============ Hooks ============

export function useSessions() {
  const { client, connected } = useGatewayContext();
  const [sessions, setSessions] = useState<SessionInfo[]>(MOCK_SESSIONS);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);

  const refresh = useCallback(async () => {
    if (!client?.connected) { setSessions(MOCK_SESSIONS); setIsReal(false); return; }
    setLoading(true);
    try {
      const result = await client.sessionsList({ activeMinutes: 1440, includeDerivedTitles: true, includeLastMessage: true });
      const mapped: SessionInfo[] = ((result.sessions || []) as Record<string, unknown>[]).map((s, i) => {
        const totalTokens = Number(s.totalTokens || 0);
        const contextTokens = Number(s.contextTokens || 200000);
        const tokenUsage = contextTokens > 0 ? Math.round((totalTokens / contextTokens) * 100) : 0;
        const updatedAt = Number(s.updatedAt || s.updatedAtMs || 0);
        const isActive = updatedAt > Date.now() - 5 * 60 * 1000;
        return {
          id: String(s.sessionId || s.key || `s-${i}`),
          key: String(s.key || ''),
          label: String(s.displayName || s.derivedTitle || s.label || s.key || ''),
          model: String(s.model || 'unknown'),
          kind: (String(s.kind || 'unknown') as SessionInfo['kind']),
          tokenUsage,
          inputTokens: Number(s.inputTokens || Math.round(totalTokens * 0.7)),
          outputTokens: Number(s.outputTokens || Math.round(totalTokens * 0.3)),
          cost: Number(s.cost || 0),
          status: isActive ? 'active' as const : 'idle' as const,
          lastActive: new Date(updatedAt || Date.now()),
          messageCount: Number(s.messageCount || (s.systemSent ? 1 : 0)),
          agentId: s.agentId ? String(s.agentId) : undefined,
        };
      });
      setSessions(mapped.length > 0 ? mapped : MOCK_SESSIONS);
      setIsReal(mapped.length > 0);
    } catch {
      setSessions(MOCK_SESSIONS);
      setIsReal(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { sessions, loading, refresh, isReal };
}

export function useCostData() {
  const { client, connected } = useGatewayContext();
  const [cost, setCost] = useState<CostData>(MOCK_COST);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);

  const refresh = useCallback(async () => {
    if (!client?.connected) { setCost(MOCK_COST); setIsReal(false); return; }
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const [todayUsage, yesterdayUsage] = await Promise.all([
        client.sessionsUsage({ startDate: today, endDate: today }),
        client.sessionsUsage({ startDate: yesterday, endDate: yesterday }),
      ]);
      // sessions.usage returns {sessions: [{usage: {totalTokens, inputTokens, outputTokens, ...}}]}
      const extractTokens = (data: unknown) => {
        const d = data as Record<string, unknown>;
        const sessions = (d.sessions || []) as Record<string, unknown>[];
        let totalInput = 0, totalOutput = 0;
        for (const s of sessions) {
          const usage = s.usage as Record<string, number> || {};
          totalInput += usage.inputTokens || 0;
          totalOutput += usage.outputTokens || 0;
        }
        return { totalInput, totalOutput, total: totalInput + totalOutput };
      };
      const todayTokens = extractTokens(todayUsage);
      const yesterdayTokens = extractTokens(yesterdayUsage);
      // Estimate cost: ~$15/M input, ~$75/M output for Opus (rough)
      const estimateCost = (t: { totalInput: number; totalOutput: number }) =>
        (t.totalInput / 1_000_000) * 15 + (t.totalOutput / 1_000_000) * 75;
      const todayCost = estimateCost(todayTokens);
      const yesterdayCost = estimateCost(yesterdayTokens);
      const trend = todayCost > yesterdayCost ? 'up' : todayCost < yesterdayCost ? 'down' : 'stable';
      const trendPercent = yesterdayCost > 0 ? Math.round(((todayCost - yesterdayCost) / yesterdayCost) * 100) : 0;

      setCost({
        ...MOCK_COST,
        todayCost,
        yesterdayCost,
        trend: trend as CostData['trend'],
        trendPercent: Math.abs(trendPercent),
      });
      setIsReal(true);
    } catch {
      setCost(MOCK_COST);
      setIsReal(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { cost, loading, refresh, isReal };
}

export function useMemoryData() {
  const { client, connected } = useGatewayContext();
  const [memory, setMemory] = useState<MemoryData>(MOCK_MEMORY);
  const [loading] = useState(false);

  const refresh = useCallback(async () => {
    if (!client?.connected) { setMemory(MOCK_MEMORY); return; }
    // Memory data would come from reading workspace files via gateway
    // For now use mock as there's no direct memory API
    setMemory(MOCK_MEMORY);
  }, [client]);

  const search = useCallback((query: string): MemoryEntry[] => {
    return memory.entries.filter(e =>
      e.summary.toLowerCase().includes(query.toLowerCase()) ||
      e.filename.toLowerCase().includes(query.toLowerCase())
    );
  }, [memory.entries]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { memory, loading, search, refresh };
}

export function useCronJobs() {
  const { client, connected } = useGatewayContext();
  const [jobs, setJobs] = useState<CronJob[]>(MOCK_CRON);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);

  const refresh = useCallback(async () => {
    if (!client?.connected) { setJobs(MOCK_CRON); setIsReal(false); return; }
    setLoading(true);
    try {
      const result = await client.cronList(true);
      const mapped: CronJob[] = ((result.jobs || []) as Record<string, unknown>[]).map((j) => {
        const sched = j.schedule as Record<string, unknown> || {};
        const state = j.state as Record<string, unknown> || {};
        const payload = j.payload as Record<string, unknown> || {};
        const { display, expr, kind } = formatSchedule(sched);

        return {
          id: String(j.id),
          name: String(j.name || ''),
          description: j.description ? String(j.description) : undefined,
          schedule: display,
          scheduleExpr: expr,
          scheduleKind: kind,
          lastRun: state.lastRunAtMs ? new Date(Number(state.lastRunAtMs)) : null,
          nextRun: state.nextRunAtMs ? new Date(Number(state.nextRunAtMs)) : null,
          status: state.runningAtMs ? 'running' : (j.enabled ? 'enabled' : 'disabled') as CronJob['status'],
          lastResult: (state.lastStatus === 'ok' ? 'success' : state.lastStatus === 'error' ? 'error' : state.lastStatus === 'skipped' ? 'skipped' : 'pending') as CronJob['lastResult'],
          lastError: state.lastError ? String(state.lastError) : undefined,
          payload: payload.kind === 'agentTurn' ? String(payload.message || '') : String(payload.text || ''),
          sessionTarget: String(j.sessionTarget || 'isolated') as 'main' | 'isolated',
        };
      });
      setJobs(mapped.length > 0 ? mapped : MOCK_CRON);
      setIsReal(mapped.length > 0);
    } catch {
      setJobs(MOCK_CRON);
      setIsReal(false);
    }
    setLoading(false);
  }, [client]);

  const toggleJob = useCallback(async (id: string) => {
    if (!client?.connected) return;
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    try {
      await client.cronUpdate(id, { enabled: job.status === 'disabled' });
      refresh();
    } catch { /* ignore */ }
  }, [client, jobs, refresh]);

  const runJob = useCallback(async (id: string) => {
    if (!client?.connected) return;
    try {
      await client.cronRun(id);
      refresh();
    } catch { /* ignore */ }
  }, [client, refresh]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { jobs, loading, toggleJob, runJob, refresh, isReal };
}

export function useSecurityStatus() {
  const { client, connected } = useGatewayContext();
  const [security, setSecurity] = useState<SecurityStatus>(MOCK_SECURITY);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);

  const rescan = useCallback(async () => {
    if (!client?.connected) { setSecurity(MOCK_SECURITY); setIsReal(false); return; }
    setLoading(true);
    try {
      const [statusResult, healthResult] = await Promise.all([
        client.status(),
        client.health(),
      ]);
      const checks: SecurityCheck[] = [];
      let score = 100;

      // Version check
      const version = String(statusResult.version || statusResult.gatewayVersion || '');
      checks.push({
        id: 'version',
        name: '版本检查',
        status: version ? 'pass' : 'warn',
        description: version ? `Gateway ${version}` : '无法获取版本',
        detail: version || '请检查 Gateway 状态',
      });
      if (!version) score -= 10;

      // Auth check
      const authMode = String(statusResult.authMode || healthResult.authMode || '');
      const hasAuth = authMode && authMode !== 'none';
      checks.push({
        id: 'auth',
        name: '认证配置',
        status: hasAuth ? 'pass' : 'fail',
        description: hasAuth ? `${authMode} 认证已启用` : '未配置认证',
        detail: hasAuth ? `auth mode: ${authMode}` : '建议启用 token 或 password 认证',
      });
      if (!hasAuth) score -= 30;

      // Bind check
      const bind = String(statusResult.bind || healthResult.bind || '');
      const isLocal = bind.includes('127.0.0.1') || bind.includes('localhost') || bind.includes('loopback');
      checks.push({
        id: 'bind',
        name: '网络暴露',
        status: isLocal ? 'pass' : bind.includes('0.0.0.0') ? 'fail' : 'warn',
        description: isLocal ? '仅本地回环访问' : bind.includes('0.0.0.0') ? '绑定到所有接口' : `绑定到 ${bind}`,
        detail: `bind: ${bind || 'unknown'}`,
      });
      if (bind.includes('0.0.0.0')) score -= 25;
      else if (!isLocal) score -= 10;

      // TLS check
      const tls = statusResult.tls || healthResult.tls;
      checks.push({
        id: 'tls',
        name: 'TLS 加密',
        status: tls ? 'pass' : 'warn',
        description: tls ? 'TLS 已启用' : '未配置 TLS',
        detail: tls ? 'HTTPS/WSS 已启用' : '建议通过 Tailscale Serve 或 nginx 启用 TLS',
      });
      if (!tls) score -= 10;

      // Health overall
      const healthy = healthResult.healthy !== false;
      checks.push({
        id: 'health',
        name: '系统健康',
        status: healthy ? 'pass' : 'warn',
        description: healthy ? '系统运行正常' : '系统异常',
        detail: JSON.stringify(healthResult).slice(0, 200),
      });
      if (!healthy) score -= 15;

      setSecurity({ overallScore: Math.max(0, score), checks, lastScan: new Date() });
      setIsReal(true);
    } catch {
      setSecurity(MOCK_SECURITY);
      setIsReal(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { if (connected) rescan(); }, [connected, rescan]);

  return { security, loading, rescan, isReal };
}

export function useModelRoutes() {
  const { client, connected } = useGatewayContext();
  const [routeData, setRouteData] = useState<ModelRouteData>(MOCK_ROUTES);
  const [loading, setLoading] = useState(false);
  const [isReal, setIsReal] = useState(false);

  const refresh = useCallback(async () => {
    if (!client?.connected) { setRouteData(MOCK_ROUTES); setIsReal(false); return; }
    setLoading(true);
    try {
      const [modelsResult, configResult] = await Promise.all([
        client.modelsList(),
        client.configGet(),
      ]);
      const models = modelsResult.models || [];
      const config = configResult.config || {};
      const agents = config.agents as Record<string, unknown> || {};
      const defaults = agents.defaults as Record<string, unknown> || {};
      const gateway = config.gateway as Record<string, unknown> || {};
      const defaultModel = String(defaults.model || config.defaultModel || 'unknown');
      const totalModels = models.length;

      // Build routes from actual config, not from all available models
      const routes: ModelRoute[] = [];
      // Default route
      routes.push({
        id: 'r-default',
        pattern: 'default',
        model: defaultModel !== 'unknown' ? defaultModel : (typeof models[0] === 'string' ? models[0] : String((models[0] as Record<string, unknown>)?.id || 'unknown')),
        fallback: null,
        enabled: true,
        monthlyTokens: 0,
        monthlyCost: 0,
      });
      // Show gateway port/bind as info
      if (gateway.port) {
        routes.push({
          id: 'r-gateway',
          pattern: `gateway:${gateway.port}`,
          model: `${totalModels} models available`,
          fallback: null,
          enabled: true,
          monthlyTokens: 0,
          monthlyCost: 0,
        });
      }

      setRouteData({
        routes: routes.length > 0 ? routes : MOCK_ROUTES.routes,
        circuitBreakers: MOCK_ROUTES.circuitBreakers, // No real CB API yet
        defaultModel,
      });
      setIsReal(routes.length > 0);
    } catch {
      setRouteData(MOCK_ROUTES);
      setIsReal(false);
    }
    setLoading(false);
  }, [client]);

  const updateRoute = useCallback(async (_id: string, _updates: Partial<ModelRoute>) => {
    // Would update config via config.set
  }, []);

  const toggleRoute = useCallback(async (_id: string) => {
    // Would toggle route via config
  }, []);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { routeData, loading, updateRoute, toggleRoute, refresh, isReal };
}

// ============ Chat Hook ============

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  cost?: number;
  tokens?: { input: number; output: number };
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
  isAborted?: boolean;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  input: string;
  output?: string;
  duration?: number;
  status: 'running' | 'done' | 'error';
}

/**
 * Extract text content from various message content formats.
 * Anthropic API may return content as:
 * - string: "hello"
 * - array: [{type: "text", text: "hello"}, {type: "tool_use", ...}]
 * - object: {type: "text", text: "hello"}
 */
function extractContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((block: Record<string, unknown>) => block && (block.type === 'text' || block.text))
      .map((block: Record<string, unknown>) => String(block.text || ''))
      .join('\n');
  }
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (obj.text) return String(obj.text);
    if (obj.content) return extractContent(obj.content);
  }
  return String(content || '');
}

export function useChat(sessionKey: string) {
  const { client, connected } = useGatewayContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Subscribe to chat events
  useEffect(() => {
    if (!client) return;
    unsubRef.current?.();
    const unsub = client.onEvent((event, payload) => {
      if (event !== 'chat') return;
      const ev = payload as Record<string, unknown>;
      if (ev.sessionKey !== sessionKey) return;

      const state = ev.state as string;
      const msg = ev.message as Record<string, unknown> | undefined;

      if (state === 'delta' && msg) {
        // Streaming delta - content is cumulative (full text so far), not incremental
        const fullText = extractContent(msg.content || msg.text || '');
        setMessages(prev => {
          const existing = prev.find(m => m.id === ev.runId);
          if (existing) {
            return prev.map(m => m.id === ev.runId ? {
              ...m,
              content: fullText,
              isStreaming: true,
            } : m);
          }
          return [...prev, {
            id: String(ev.runId),
            role: 'assistant' as const,
            content: fullText,
            timestamp: new Date(),
            isStreaming: true,
          }];
        });
      } else if (state === 'final') {
        // Final message - update content with final text and clear streaming
        const usage = ev.usage as Record<string, number> | undefined;
        const finalText = msg ? extractContent(msg.content || msg.text || '') : undefined;
        setMessages(prev => prev.map(m => m.id === ev.runId ? {
          ...m,
          ...(finalText ? { content: finalText } : {}),
          isStreaming: false,
          tokens: usage ? { input: usage.inputTokens || 0, output: usage.outputTokens || 0 } : undefined,
        } : m));
        setSending(false);
        setRunId(null);
      } else if (state === 'aborted') {
        setMessages(prev => prev.map(m => m.id === ev.runId ? { ...m, isStreaming: false, isAborted: true } : m));
        setSending(false);
        setRunId(null);
      } else if (state === 'error') {
        const errMsg = String(ev.errorMessage || 'Unknown error');
        setMessages(prev => [...prev.filter(m => m.id !== ev.runId), {
          id: `err-${Date.now()}`,
          role: 'system' as const,
          content: `❌ ${errMsg}`,
          timestamp: new Date(),
        }]);
        setSending(false);
        setRunId(null);
      }
    });
    unsubRef.current = unsub;
    return () => { unsub(); };
  }, [client, sessionKey]);

  // Load history
  const loadHistory = useCallback(async () => {
    if (!client?.connected) return;
    setLoading(true);
    try {
      const result = await client.chatHistory(sessionKey, 50);
      const msgs = (result.messages || []).map((m: unknown, i: number) => {
        const msg = m as Record<string, unknown>;
        return {
          id: `h-${i}`,
          role: String(msg.role || 'assistant') as ChatMessage['role'],
          content: extractContent(msg.content || msg.text || ''),
          timestamp: new Date(Number(msg.timestamp || Date.now())),
        };
      });
      if (msgs.length > 0) setMessages(msgs);
    } catch { /* keep existing messages */ }
    setLoading(false);
  }, [client, sessionKey]);

  // Send message
  const send = useCallback(async (content: string) => {
    if (!client?.connected || !content.trim()) return;
    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const result = await client.chatSend(sessionKey, content.trim());
      setRunId(result.runId);
    } catch (e) {
      setSending(false);
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `❌ 发送失败: ${e instanceof Error ? e.message : e}`,
        timestamp: new Date(),
      }]);
    }
  }, [client, sessionKey]);

  // Abort
  const abort = useCallback(async () => {
    if (!client?.connected) return;
    try { await client.chatAbort(sessionKey); } catch { /* ignore */ }
  }, [client, sessionKey]);

  // Summarize (inject)
  const summarize = useCallback(async () => {
    if (!client?.connected) return;
    try {
      await client.chatInject(sessionKey, '[用户请求总结此会话]');
    } catch { /* ignore */ }
  }, [client, sessionKey]);

  useEffect(() => { if (connected) loadHistory(); }, [connected, loadHistory]);

  return { messages, loading, sending, runId, send, abort, summarize, loadHistory };
}
