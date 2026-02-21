/**
 * 工具调用详情模态框
 * 替代 alert，显示工具名称、参数、结果、耗时
 */

import { useEffect } from 'react';
import type { ToolCall } from '../types/chat';

interface ToolCallModalProps {
  toolCall: ToolCall | null;
  onClose: () => void;
}

export default function ToolCallModal({ toolCall, onClose }: ToolCallModalProps) {
  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!toolCall) return null;

  const statusColor = {
    pending: 'var(--color-status-warning)',
    running: 'var(--color-status-info)',
    completed: 'var(--color-status-online)',
    failed: 'var(--color-status-error)',
  }[toolCall.status];

  const statusLabel = {
    pending: '等待中',
    running: '运行中',
    completed: '已完成',
    failed: '出错',
  }[toolCall.status];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-bg-secondary, #16213e)', width: '100%', maxWidth: 480,
        borderRadius: '16px 16px 0 0', padding: '1.25rem', maxHeight: '70vh',
        overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              🔧 {toolCall.name}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.7rem', padding: '1px 6px', borderRadius: 6,
                background: `${statusColor}20`, color: statusColor,
              }}>
                {statusLabel}
              </span>
              {toolCall.durationMs && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  {toolCall.durationMs}ms
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, fontSize: '1rem', color: 'var(--color-text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Args */}
        {toolCall.args && Object.keys(toolCall.args).length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>参数</div>
            <pre style={{
              background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8,
              fontSize: '0.75rem', color: 'var(--color-text-primary)', overflowX: 'auto',
              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
        )}

        {/* Result */}
        {toolCall.result !== undefined && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>结果</div>
            <pre style={{
              background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: 8,
              fontSize: '0.75rem', color: 'var(--color-text-primary)', overflowX: 'auto',
              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '30vh',
            }}>
              {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {toolCall.error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-status-error)', fontWeight: 500 }}>错误</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {toolCall.error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
