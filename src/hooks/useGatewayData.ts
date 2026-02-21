/**
 * Gateway 业务数据 Hooks
 * 提供各页面所需的业务数据，当前使用 mock 数据，后续切换到真实 WebSocket 数据
 */

import { useState, useCallback } from 'react';

// ============ Types ============

export interface SessionInfo {
  id: string;
  label: string;
  model: string;
  kind: 'main' | 'isolated' | 'cron';
  tokenUsage: number; // percentage
  inputTokens: number;
  outputTokens: number;
  cost: number;
  status: 'active' | 'idle' | 'completed';
  lastActive: Date;
  messageCount: number;
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
  hourly: number[]; // 24 hours
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
  size: number; // bytes
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
  schedule: string; // human readable
  scheduleExpr: string;
  lastRun: Date | null;
  nextRun: Date;
  status: 'enabled' | 'disabled' | 'running';
  lastResult: 'success' | 'error' | 'pending';
  payload: string;
}

export interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'warn' | 'fail';
  description: string;
  detail: string;
}

export interface SecurityStatus {
  overallScore: number; // 0-100
  checks: SecurityCheck[];
  lastScan: Date;
}

export interface ModelRoute {
  id: string;
  pattern: string; // e.g. "cron/*", "main", "default"
  model: string;
  fallback: string | null;
  enabled: boolean;
  monthlyTokens: number;
  monthlyCost: number;
}

export interface CircuitBreaker {
  model: string;
  status: 'closed' | 'open' | 'half-open';
  failureRate: number; // percentage
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
  {
    id: 'main-001',
    label: 'main',
    model: 'claude-opus-4',
    kind: 'main',
    tokenUsage: 42,
    inputTokens: 85000,
    outputTokens: 32000,
    cost: 8.50,
    status: 'active',
    lastActive: new Date(Date.now() - 60000),
    messageCount: 47,
  },
  {
    id: 'sub-clawflag',
    label: 'clawflag-phase1',
    model: 'claude-sonnet-4',
    kind: 'isolated',
    tokenUsage: 78,
    inputTokens: 120000,
    outputTokens: 45000,
    cost: 3.20,
    status: 'active',
    lastActive: new Date(Date.now() - 300000),
    messageCount: 12,
  },
  {
    id: 'cron-daily',
    label: 'daily-news',
    model: 'claude-haiku-3.5',
    kind: 'cron',
    tokenUsage: 15,
    inputTokens: 8000,
    outputTokens: 2000,
    cost: 0.05,
    status: 'completed',
    lastActive: new Date(Date.now() - 3600000),
    messageCount: 3,
  },
];

const MOCK_COST: CostData = {
  todayCost: 12.58,
  yesterdayCost: 8.42,
  dailyBudget: 50,
  monthlyBudget: 500,
  monthlyCost: 186.30,
  trend: 'up',
  trendPercent: 49.4,
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
    { id: 'm3', filename: '2026-02-20-1849.md', date: new Date(Date.now() - 172800000), summary: '新三条核心指令确立', size: 1800, chunks: 6, type: 'daily' },
    { id: 'm4', filename: 'conversation-log.md', date: new Date(Date.now() - 86400000), summary: '完整对话记录存档', size: 4500, chunks: 18, type: 'conversation' },
    { id: 'm5', filename: '2026-02-06-0758.md', date: new Date(Date.now() - 1296000000), summary: '服务器维护和部署记录', size: 2100, chunks: 8, type: 'daily' },
  ],
  healthPercent: 82,
  totalFiles: 12,
  totalChunks: 89,
  totalSize: 24400,
  lastUpdated: new Date(Date.now() - 3600000),
};

const MOCK_CRON: CronJob[] = [
  {
    id: 'cron-1',
    name: 'daily-news',
    schedule: '每天 9:00',
    scheduleExpr: '0 9 * * *',
    lastRun: new Date(Date.now() - 54000000),
    nextRun: new Date(Date.now() + 32400000),
    status: 'enabled',
    lastResult: 'success',
    payload: '生成每日新闻摘要',
  },
  {
    id: 'cron-2',
    name: 'heartbeat',
    schedule: '每 30 分钟',
    scheduleExpr: '*/30 * * * *',
    lastRun: new Date(Date.now() - 900000),
    nextRun: new Date(Date.now() + 900000),
    status: 'enabled',
    lastResult: 'success',
    payload: '心跳检查',
  },
  {
    id: 'cron-3',
    name: 'weekly-report',
    schedule: '每周一 10:00',
    scheduleExpr: '0 10 * * 1',
    lastRun: new Date(Date.now() - 432000000),
    nextRun: new Date(Date.now() + 172800000),
    status: 'disabled',
    lastResult: 'pending',
    payload: '生成周报',
  },
];

const MOCK_SECURITY: SecurityStatus = {
  overallScore: 72,
  checks: [
    { id: 's1', name: '版本检查', status: 'warn', description: 'Gateway 版本略旧', detail: '当前 2026.2.19-2，最新 2026.2.22' },
    { id: 's2', name: '认证配置', status: 'pass', description: 'Token 认证已启用', detail: 'auth_token 已配置' },
    { id: 's3', name: '网络暴露', status: 'pass', description: '仅本地回环访问', detail: 'bind: loopback (127.0.0.1)' },
    { id: 's4', name: '代理配置', status: 'fail', description: '未配置反向代理', detail: '建议通过 nginx/caddy 提供 TLS' },
    { id: 's5', name: 'Skill 安全', status: 'warn', description: '2 个本地 skill 未经审计', detail: 'volcengine-asr, windows-control 安全评分较低' },
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

// ============ Hooks ============

export function useSessions() {
  const [sessions] = useState<SessionInfo[]>(MOCK_SESSIONS);
  const [loading] = useState(false);

  const refresh = useCallback(() => {
    // TODO: fetch from gateway
  }, []);

  return { sessions, loading, refresh };
}

export function useCostData() {
  const [cost] = useState<CostData>(MOCK_COST);
  const [loading] = useState(false);

  return { cost, loading };
}

export function useMemoryData() {
  const [memory] = useState<MemoryData>(MOCK_MEMORY);
  const [loading] = useState(false);

  const search = useCallback((_query: string): MemoryEntry[] => {
    // TODO: semantic search via gateway
    return memory.entries.filter(e =>
      e.summary.toLowerCase().includes(_query.toLowerCase()) ||
      e.filename.toLowerCase().includes(_query.toLowerCase())
    );
  }, [memory.entries]);

  return { memory, loading, search };
}

export function useCronJobs() {
  const [jobs] = useState<CronJob[]>(MOCK_CRON);
  const [loading] = useState(false);

  const toggleJob = useCallback((_id: string) => {
    // TODO: enable/disable via gateway
  }, []);

  const runJob = useCallback((_id: string) => {
    // TODO: trigger via gateway
  }, []);

  return { jobs, loading, toggleJob, runJob };
}

export function useSecurityStatus() {
  const [security] = useState<SecurityStatus>(MOCK_SECURITY);
  const [loading] = useState(false);

  const rescan = useCallback(() => {
    // TODO: trigger rescan
  }, []);

  return { security, loading, rescan };
}

export function useModelRoutes() {
  const [routeData] = useState<ModelRouteData>(MOCK_ROUTES);
  const [loading] = useState(false);

  const updateRoute = useCallback((_id: string, _updates: Partial<ModelRoute>) => {
    // TODO: update via gateway
  }, []);

  const toggleRoute = useCallback((_id: string) => {
    // TODO: toggle via gateway
  }, []);

  return { routeData, loading, updateRoute, toggleRoute };
}
