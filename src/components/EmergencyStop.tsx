/**
 * EmergencyStop 紧急停止浮动按钮
 * - 红色圆形大按钮，固定右下角，z-index 最高
 * - 点击弹出确认对话框
 * - 通过 Gateway 发送 emergency-stop (chat.abort 所有活跃 session)
 * - 停止后显示"已停止"+ 恢复按钮
 * - 脉冲呼吸效果表示 Agent 活跃中
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';
import './EmergencyStop.css';

interface EmergencyStopProps {
  onStop?: () => void;
  visible?: boolean;
}

type StopState = 'idle' | 'confirming' | 'stopping' | 'stopped';

export default function EmergencyStop({ onStop, visible = true }: EmergencyStopProps) {
  const { client, connected } = useGatewayContext();
  const [state, setState] = useState<StopState>('idle');
  const [agentActive, setAgentActive] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for chat events to detect active agents
  useEffect(() => {
    if (!client) return;
    const unsub = client.onEvent((event, payload) => {
      if (event !== 'chat') return;
      const ev = payload as Record<string, unknown>;
      if (ev.state === 'delta') setAgentActive(true);
      if (ev.state === 'final' || ev.state === 'aborted' || ev.state === 'error') {
        setAgentActive(false);
      }
    });
    return unsub;
  }, [client]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const sendEmergencyStop = useCallback(async (): Promise<boolean> => {
    if (!client?.connected) return false;
    try {
      // Get all active sessions and abort them all
      const result = await client.sessionsList({ activeMinutes: 60 });
      const sessions = (result.sessions || []) as Record<string, unknown>[];
      const activeSessions = sessions.filter(s => {
        const updatedAt = Number(s.updatedAt || s.updatedAtMs || 0);
        return updatedAt > Date.now() - 5 * 60 * 1000;
      });

      // Fire abort for all active sessions simultaneously - don't wait
      const abortPromises = activeSessions.map(s =>
        client.chatAbort(String(s.key || '')).catch(() => {})
      );
      await Promise.all(abortPromises);
      return true;
    } catch {
      return false;
    }
  }, [client]);

  const handleClick = useCallback(async () => {
    if (state === 'stopped') {
      // Resume
      setState('idle');
      setRetryCount(0);
      return;
    }

    if (state === 'idle') {
      // First click: show confirm
      setState('confirming');
      confirmTimerRef.current = setTimeout(() => setState('idle'), 4000);
      return;
    }

    if (state === 'confirming') {
      // Second click: execute stop
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setState('stopping');

      const success = await sendEmergencyStop();
      if (success) {
        setState('stopped');
        setAgentActive(false);
        onStop?.();
      } else {
        // Retry with 1s timeout
        if (retryCount < 3) {
          setRetryCount(c => c + 1);
          retryTimerRef.current = setTimeout(async () => {
            const retryOk = await sendEmergencyStop();
            setState(retryOk ? 'stopped' : 'idle');
            if (retryOk) {
              setAgentActive(false);
              onStop?.();
            }
          }, 1000);
        } else {
          setState('idle');
          setRetryCount(0);
        }
      }
    }
  }, [state, retryCount, sendEmergencyStop, onStop]);

  if (!visible) return null;

  const btnClass = [
    'emergency-stop-fab',
    state === 'confirming' ? 'confirming' : '',
    state === 'stopping' ? 'stopping' : '',
    state === 'stopped' ? 'stopped' : '',
    agentActive && state === 'idle' ? 'agent-active' : '',
    !connected ? 'disconnected' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Confirm overlay */}
      {state === 'confirming' && (
        <div className="emergency-confirm-overlay" onClick={() => setState('idle')}>
          <div className="emergency-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="emergency-confirm-icon">⚠️</div>
            <div className="emergency-confirm-title">确定终止所有Agent任务？</div>
            <div className="emergency-confirm-desc">所有活跃的 Agent 会话将立即中止</div>
            <div className="emergency-confirm-actions">
              <button className="emergency-confirm-btn cancel" onClick={() => setState('idle')}>取消</button>
              <button className="emergency-confirm-btn confirm" onClick={handleClick}>确认停止</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={btnClass}
        onClick={handleClick}
        disabled={state === 'stopping'}
        title={state === 'stopped' ? '点击恢复' : '紧急停止所有Agent'}
      >
        {state === 'stopped' ? (
          <span className="emergency-icon">▶</span>
        ) : state === 'stopping' ? (
          <span className="emergency-icon spinning">⏳</span>
        ) : (
          <span className="emergency-icon">⏹</span>
        )}
      </button>

      {/* Status label */}
      {state === 'stopped' && (
        <div className="emergency-status-label">已停止 · 点击恢复</div>
      )}
    </>
  );
}
