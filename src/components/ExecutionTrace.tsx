import { useState } from 'react';
import './ExecutionTrace.css';

export interface TraceStep {
  id: string;
  type: 'thought' | 'tool_call' | 'tool_result' | 'decision' | 'api_call';
  label: string;
  detail?: string;
  durationMs?: number;
  tokens?: number;
  timestamp: number;
}

interface ExecutionTraceProps {
  steps: TraceStep[];
  totalDurationMs: number;
  totalTokens: number;
}

const typeIcon: Record<string, string> = {
  thought: '💭',
  tool_call: '🔧',
  tool_result: '📦',
  decision: '🧠',
  api_call: '🌐',
};

const typeLabel: Record<string, string> = {
  thought: '思考',
  tool_call: '工具调用',
  tool_result: '返回结果',
  decision: '决策',
  api_call: 'API 调用',
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ExecutionTrace({ steps, totalDurationMs, totalTokens }: ExecutionTraceProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="execution-trace">
      <button className="trace-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="trace-toggle-icon">🔍</span>
        <span className="trace-toggle-text">
          {expanded ? '收起' : '探查'} 执行链路
        </span>
        <span className="trace-summary">
          {steps.length} 步 · {formatMs(totalDurationMs)} · {(totalTokens / 1000).toFixed(1)}K tokens
        </span>
      </button>

      {expanded && (
        <div className="trace-timeline">
          {steps.map((step, i) => (
            <div key={step.id} className={`trace-step trace-${step.type}`}>
              <div className="trace-line-wrapper">
                <div className="trace-dot" />
                {i < steps.length - 1 && <div className="trace-connector" />}
              </div>
              <div className="trace-content">
                <div className="trace-header">
                  <span className="trace-icon">{typeIcon[step.type]}</span>
                  <span className="trace-type">{typeLabel[step.type]}</span>
                  {step.durationMs !== undefined && (
                    <span className="trace-duration">{formatMs(step.durationMs)}</span>
                  )}
                </div>
                <div className="trace-label">{step.label}</div>
                {step.detail && (
                  <pre className="trace-detail">{step.detail}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
