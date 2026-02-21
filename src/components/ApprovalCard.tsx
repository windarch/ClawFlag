/**
 * ApprovalCard 组件 - 危险操作内联批准按钮 (任务 3.1)
 * 当 Agent 请求执行危险操作时，在聊天中显示批准卡片
 * 支持：操作描述 + ✅批准 / ❌拒绝 按钮 + 超时倒计时
 */

import { useState, useEffect, useRef } from 'react';
import './ApprovalCard.css';

export interface ApprovalRequest {
  id: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  timeoutMs?: number;
  timestamp: number;
}

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const RISK_CONFIG = {
  low: { icon: '⚠️', color: '#eab308', label: '低风险' },
  medium: { icon: '🟠', color: '#f97316', label: '中风险' },
  high: { icon: '🔴', color: '#ef4444', label: '高风险' },
  critical: { icon: '💀', color: '#dc2626', label: '危险' },
};

// Detect dangerous operations from message content
const DANGEROUS_PATTERNS = [
  { pattern: /\brm\s+(-rf?|--force)\b/i, action: 'rm', risk: 'critical' as const, desc: '删除文件/目录' },
  { pattern: /\bdrop\s+(table|database|collection)\b/i, action: 'drop', risk: 'critical' as const, desc: '删除数据库对象' },
  { pattern: /\bsend\s*(email|mail|message)\b/i, action: 'send', risk: 'high' as const, desc: '发送外部消息' },
  { pattern: /\bdelete\s+(from|all)\b/i, action: 'delete', risk: 'high' as const, desc: '删除数据' },
  { pattern: /\btruncate\b/i, action: 'truncate', risk: 'critical' as const, desc: '清空数据表' },
  { pattern: /\bformat\b/i, action: 'format', risk: 'critical' as const, desc: '格式化' },
  { pattern: /\bshutdown\b|poweroff\b|reboot\b/i, action: 'shutdown', risk: 'high' as const, desc: '关机/重启' },
  { pattern: /\bgit\s+push\s+.*--force\b/i, action: 'force-push', risk: 'high' as const, desc: '强制推送' },
];

export function detectApprovalRequest(content: string): ApprovalRequest | null {
  // Check for gateway-format approval requests first
  const match = content.match(/\[APPROVAL_REQUEST:(\w+)\](.*)/s);
  if (match) {
    return {
      id: match[1],
      action: match[1],
      description: match[2].trim(),
      risk: 'high',
      timeoutMs: 60000,
      timestamp: Date.now(),
    };
  }

  // Check for dangerous operation patterns
  for (const dp of DANGEROUS_PATTERNS) {
    if (dp.pattern.test(content)) {
      return {
        id: `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: dp.action,
        description: dp.desc + ': ' + content.slice(0, 120),
        risk: dp.risk,
        timeoutMs: 60000,
        timestamp: Date.now(),
      };
    }
  }
  return null;
}

export default function ApprovalCard({ request, onApprove, onReject }: ApprovalCardProps) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'timeout'>('pending');
  const [remaining, setRemaining] = useState<number>(request.timeoutMs || 60000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const riskCfg = RISK_CONFIG[request.risk];

  useEffect(() => {
    if (status !== 'pending' || !request.timeoutMs) return;
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, (request.timeoutMs || 60000) - elapsed);
      setRemaining(left);
      if (left <= 0) {
        setStatus('timeout');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, request.timeoutMs]);

  const handleApprove = () => {
    setStatus('approved');
    if (timerRef.current) clearInterval(timerRef.current);
    onApprove(request.id);
  };

  const handleReject = () => {
    setStatus('rejected');
    if (timerRef.current) clearInterval(timerRef.current);
    onReject(request.id);
  };

  const remainSec = Math.ceil(remaining / 1000);

  return (
    <div className={`approval-card risk-${request.risk} status-${status}`}>
      <div className="approval-header">
        <span className="approval-icon">{riskCfg.icon}</span>
        <span className="approval-risk" style={{ color: riskCfg.color }}>{riskCfg.label}</span>
        {status === 'pending' && request.timeoutMs && (
          <span className={`approval-timer ${remainSec <= 10 ? 'timer-urgent' : ''}`}>
            {remainSec}s
          </span>
        )}
      </div>

      <div className="approval-body">
        <div className="approval-action">{request.action}</div>
        <div className="approval-desc">{request.description}</div>
      </div>

      {status === 'pending' && (
        <div className="approval-actions">
          <button className="btn btn-approve" onClick={handleApprove}>✅ 批准</button>
          <button className="btn btn-reject" onClick={handleReject}>❌ 拒绝</button>
        </div>
      )}

      {status === 'approved' && <div className="approval-result approved">✅ 已批准</div>}
      {status === 'rejected' && <div className="approval-result rejected">❌ 已拒绝</div>}
      {status === 'timeout' && <div className="approval-result timeout">⏰ 已超时（自动拒绝）</div>}
    </div>
  );
}
