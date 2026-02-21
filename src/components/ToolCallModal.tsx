/**
 * 工具调用详情模态框
 * 显示工具名称、参数、结果、耗时
 */

import { useEffect } from 'react';

interface ToolCallDisplay {
  name: string;
  args: string;
  result: string;
  duration: number;
}

interface ToolCallModalProps {
  toolCall: ToolCallDisplay | null;
  onClose: () => void;
}

export default function ToolCallModal({ toolCall, onClose }: ToolCallModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!toolCall) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tool-call-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔧 {toolCall.name}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Duration */}
          {toolCall.duration > 0 && (
            <div className="tool-meta">
              <span>⏱ {(toolCall.duration / 1000).toFixed(2)}s</span>
            </div>
          )}

          {/* Args */}
          {toolCall.args && (
            <div className="tool-section">
              <h4>参数</h4>
              <pre className="tool-code">{formatJSON(toolCall.args)}</pre>
            </div>
          )}

          {/* Result */}
          {toolCall.result && (
            <div className="tool-section">
              <h4>结果</h4>
              <pre className="tool-code">{formatJSON(toolCall.result)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
