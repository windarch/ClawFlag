/**
 * ClawFlag 模拟数据
 * 用于开发时测试 UI，模拟 Gateway 返回的状态数据
 */

// Agent 状态类型
export type AgentStatus = 'online' | 'offline' | 'busy';

// 概览数据接口
export interface GlanceData {
  agentStatus: AgentStatus;
  agentName: string;
  todayCost: number;
  yesterdayCost: number;
  dailyBudget: number;
  pendingApprovals: number;
  currentTask: string;
  lastUpdated: Date;
}

// 会话数据接口
export interface SessionData {
  id: string;
  title: string;
  model: string;
  tokenCount: number;
  cost: number;
  startTime: Date;
  status: 'active' | 'completed' | 'paused';
  messageCount: number;
}

// 安全警告接口
export interface SecurityAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
}

// 模拟概览数据
export const mockGlanceData: GlanceData = {
  agentStatus: 'online',
  agentName: 'Clawd',
  todayCost: 12.58,
  yesterdayCost: 8.42,
  dailyBudget: 50,
  pendingApprovals: 3,
  currentTask: '正在分析用户反馈并生成周报摘要...',
  lastUpdated: new Date(),
};

// 不同状态的模拟数据（用于测试）
export const mockGlanceDataOffline: GlanceData = {
  agentStatus: 'offline',
  agentName: 'Clawd',
  todayCost: 0,
  yesterdayCost: 5.20,
  dailyBudget: 50,
  pendingApprovals: 0,
  currentTask: 'Agent 已离线',
  lastUpdated: new Date(Date.now() - 3600000),
};

export const mockGlanceDataBusy: GlanceData = {
  agentStatus: 'busy',
  agentName: 'Clawd',
  todayCost: 45.32,
  yesterdayCost: 15.80,
  dailyBudget: 50,
  pendingApprovals: 7,
  currentTask: '正在执行复杂的代码重构任务 (3/5 步骤)...',
  lastUpdated: new Date(),
};

// 模拟会话列表
export const mockSessions: SessionData[] = [
  {
    id: 'session-001',
    title: '周报生成任务',
    model: 'claude-opus-4',
    tokenCount: 15420,
    cost: 6.82,
    startTime: new Date(Date.now() - 1800000), // 30分钟前
    status: 'active',
    messageCount: 12,
  },
  {
    id: 'session-002',
    title: '代码审查 - PR #234',
    model: 'claude-sonnet-4',
    tokenCount: 8750,
    cost: 2.15,
    startTime: new Date(Date.now() - 3600000), // 1小时前
    status: 'completed',
    messageCount: 8,
  },
  {
    id: 'session-003',
    title: '日常心跳检查',
    model: 'claude-haiku',
    tokenCount: 2340,
    cost: 0.42,
    startTime: new Date(Date.now() - 7200000), // 2小时前
    status: 'completed',
    messageCount: 4,
  },
  {
    id: 'session-004',
    title: '邮件回复草稿',
    model: 'claude-sonnet-4',
    tokenCount: 5200,
    cost: 1.28,
    startTime: new Date(Date.now() - 10800000), // 3小时前
    status: 'paused',
    messageCount: 6,
  },
];

// 模拟安全警告
export const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: 'alert-001',
    level: 'warning',
    title: 'Gateway 版本需要更新',
    description: '当前版本 2026.1.28 存在已知漏洞 (CVE-2026-25253)，建议升级到 2026.1.30+',
    actionLabel: '查看升级指南',
    actionUrl: '/docs/upgrade',
  },
];

// 无警告时的空数组
export const mockNoAlerts: SecurityAlert[] = [];

// 安全检查结果类型（从 security.ts 复用）
import type { SecurityCheckResult } from '../types/security';

// 模拟安全检查结果
export const mockSecurityCheckResult: SecurityCheckResult = {
  timestamp: new Date(),
  items: [
    {
      id: 'version-check',
      title: 'Gateway 版本',
      description: '当前版本 2026.1.28，低于安全基线 2026.1.30',
      level: 'critical',
      fix: '升级 Gateway 到 2026.1.30+ 以修补 CVE-2026-25253（远程代码执行漏洞）和 CVE-2026-24763。',
      fixUrl: 'https://docs.openclaw.ai/changelog',
    },
    {
      id: 'exposure-check',
      title: '网络暴露',
      description: 'Gateway 绑定到 loopback (127.0.0.1)，仅本地可访问',
      level: 'pass',
    },
    {
      id: 'auth-check',
      title: '认证状态',
      description: '已启用 Token 认证',
      level: 'pass',
    },
    {
      id: 'proxy-check',
      title: '可信代理',
      description: '未配置 trustedProxies，如果通过反向代理访问，可能有安全隐患',
      level: 'warning',
      fix: '如果你使用 Nginx/Caddy 等反向代理，请在 openclaw.json 中配置 trustedProxies 以确保正确验证来源 IP。',
    },
  ],
  summary: {
    pass: 2,
    warning: 1,
    critical: 1,
  },
};

// 全部通过的安全检查（用于测试）
export const mockSecurityCheckAllPass: SecurityCheckResult = {
  timestamp: new Date(),
  items: [
    {
      id: 'version-check',
      title: 'Gateway 版本',
      description: '版本 2026.2.19，已是最新',
      level: 'pass',
    },
    {
      id: 'exposure-check',
      title: '网络暴露',
      description: 'Gateway 绑定到 loopback，仅本地可访问',
      level: 'pass',
    },
    {
      id: 'auth-check',
      title: '认证状态',
      description: '已启用 Token 认证',
      level: 'pass',
    },
  ],
  summary: {
    pass: 3,
    warning: 0,
    critical: 0,
  },
};

// 获取状态显示文本
export function getStatusText(status: AgentStatus): string {
  const statusMap: Record<AgentStatus, string> = {
    online: '在线',
    offline: '离线',
    busy: '忙碌',
  };
  return statusMap[status];
}

// 获取状态颜色类名
export function getStatusColorClass(status: AgentStatus): string {
  const colorMap: Record<AgentStatus, string> = {
    online: 'status-online',
    offline: 'status-offline',
    busy: 'status-busy',
  };
  return colorMap[status];
}

// 格式化金额
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// 格式化相对时间
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  return date.toLocaleDateString('zh-CN');
}
