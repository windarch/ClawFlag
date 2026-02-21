/**
 * InspectPanel - 消息探查面板
 * 展开显示 Agent 回复的内部细节：
 * - 思考链（thinking）
 * - 工具调用列表
 * - 子任务树
 * - Token 消耗
 */

import { useState } from 'react';
import ToolCallCard from './ToolCallCard';
import './InspectPanel.css';

interface ToolCallData {
  id: string;
  name: string;
  input?: string;
  output?: string;
  duration?: number;
  status: 'running' | 'done' | 'error';
}

interface InspectPanelProps {
  thinking?: string;
  toolCalls?: ToolCallData[];
  subTasks?: { id: string; name: string; status: string; children?: { id: string; name: string; status: string }[] }[];
  tokens?: { input: number; output: number };
  cost?: number;
}

export default function InspectPanel({ thinking, toolCalls, subTasks, tokens, cost }: InspectPanelProps) {
  const [section, setSection] = useState<'thinking' | 'tools' | 'subtasks' | 'stats'>('tools');

  const hasThinking = !!thinking;
  const hasTools = toolCalls && toolCalls.length > 0;
  const hasSubTasks = subTasks && subTasks.length > 0;
  const totalTokens = tokens ? tokens.input + tokens.output : 0;

  return (
    <div className="inspect-panel">
      {/* Tab bar */}
      <div className="inspect-tabs">
        {hasThinking && (
          <button className={`inspect-tab ${section === 'thinking' ? 'active' : ''}`} onClick={() => setSection('thinking')}>
            💭 思考
          </button>
        )}
        {hasTools && (
          <button className={`inspect-tab ${section === 'tools' ? 'active' : ''}`} onClick={() => setSection('tools')}>
            🔧 工具 ({toolCalls!.length})
          </button>
        )}
        {hasSubTasks && (
          <button className={`inspect-tab ${section === 'subtasks' ? 'active' : ''}`} onClick={() => setSection('subtasks')}>
            🌳 子任务
          </button>
        )}
        <button className={`inspect-tab ${section === 'stats' ? 'active' : ''}`} onClick={() => setSection('stats')}>
          📊 统计
        </button>
      </div>

      {/* Content */}
      <div className="inspect-content">
        {section === 'thinking' && thinking && (
          <div className="inspect-thinking">
            <pre>{thinking}</pre>
          </div>
        )}

        {section === 'tools' && hasTools && (
          <div className="inspect-tools">
            {toolCalls!.map(tc => (
              <ToolCallCard
                key={tc.id}
                name={tc.name}
                args={tc.input}
                result={tc.output}
                duration={tc.duration}
                status={tc.status}
              />
            ))}
          </div>
        )}

        {section === 'subtasks' && hasSubTasks && (
          <div className="inspect-subtasks">
            {subTasks!.map(task => (
              <div key={task.id} className="subtask-node">
                <div className="subtask-item">
                  <span className="subtask-status">{task.status === 'done' ? '✅' : task.status === 'running' ? '⏳' : '❌'}</span>
                  <span className="subtask-name">{task.name}</span>
                </div>
                {task.children && task.children.map(child => (
                  <div key={child.id} className="subtask-item subtask-child">
                    <span className="subtask-status">{child.status === 'done' ? '✅' : child.status === 'running' ? '⏳' : '❌'}</span>
                    <span className="subtask-name">{child.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {section === 'stats' && (
          <div className="inspect-stats">
            {tokens && (
              <>
                <div className="stat-row">
                  <span className="stat-label">输入 Token</span>
                  <span className="stat-value">{tokens.input.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">输出 Token</span>
                  <span className="stat-value">{tokens.output.toLocaleString()}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">总计</span>
                  <span className="stat-value">{totalTokens.toLocaleString()}</span>
                </div>
              </>
            )}
            {cost != null && cost > 0 && (
              <div className="stat-row">
                <span className="stat-label">成本</span>
                <span className="stat-value cost">¥{cost.toFixed(4)}</span>
              </div>
            )}
            {!tokens && !cost && (
              <div className="stat-empty">暂无统计数据</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
