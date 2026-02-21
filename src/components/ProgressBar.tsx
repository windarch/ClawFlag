/**
 * ProgressBar 组件 - 多步骤进度条 (任务 3.2)
 * 格式："步骤 2/5 · 正在编译..."
 * 支持：进行中（蓝色动画）、完成（绿色）、失败（红色）
 */

import './ProgressBar.css';

export interface ProgressInfo {
  current: number;
  total: number;
  label: string;
  status: 'running' | 'done' | 'error';
}

interface ProgressBarProps {
  progress: ProgressInfo;
}

// Parse step info from agent message content
// Patterns: "Step 2/5: ...", "步骤 2/5 · ...", "[2/5] ...", "Phase 3 of 5: ..."
const STEP_PATTERNS = [
  /(?:step|步骤)\s*(\d+)\s*[/／]\s*(\d+)\s*[·:：\-]\s*(.+)/i,
  /\[(\d+)\s*[/／]\s*(\d+)\]\s*(.+)/,
  /(?:phase|阶段)\s*(\d+)\s*(?:of|\/)\s*(\d+)\s*[·:：\-]\s*(.+)/i,
  /(\d+)\s*[/／]\s*(\d+)\s*[·:：\-]\s*(.+)/,
];

export function parseProgress(content: string): ProgressInfo | null {
  for (const pattern of STEP_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (current > 0 && total > 0 && current <= total) {
        const label = match[3].trim();
        const isError = /fail|error|错误|失败/i.test(label);
        const isDone = current === total && /done|complete|完成|成功/i.test(label);
        return {
          current,
          total,
          label,
          status: isError ? 'error' : isDone ? 'done' : 'running',
        };
      }
    }
  }
  return null;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const { current, total, label, status } = progress;
  const percent = Math.round((current / total) * 100);

  const statusClass = status === 'error' ? 'progress-error' : status === 'done' ? 'progress-done' : 'progress-running';

  return (
    <div className={`progress-bar-card ${statusClass}`}>
      <div className="progress-bar-header">
        <span className="progress-bar-step">
          {status === 'done' ? '✅' : status === 'error' ? '❌' : '⚡'}
          {' '}步骤 {current}/{total}
        </span>
        <span className="progress-bar-percent">{percent}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${statusClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="progress-bar-label">{label}</div>
    </div>
  );
}
