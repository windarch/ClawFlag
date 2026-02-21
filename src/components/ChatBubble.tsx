/**
 * ChatBubble 组件
 * 渲染聊天消息气泡，支持：
 * - Markdown 渲染
 * - 折叠长代码块
 * - 工具调用卡片
 * - 文件差异卡片
 * - 内联批准按钮
 * - 成本标签
 * - 流式动画
 */

import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatBubble.css';

interface ToolCallDisplay {
  id: string;
  name: string;
  args?: string;
  result?: string;
  duration?: number;
  status: 'running' | 'done' | 'error';
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  tokens?: { input: number; output: number };
  cost?: number;
  toolCalls?: ToolCallDisplay[];
  isStreaming?: boolean;
}

interface ChatBubbleProps {
  message: MessageData;
  onToolCallClick?: (tc: ToolCallDisplay) => void;
  onApprove?: (actionId: string) => void;
  onReject?: (actionId: string) => void;
}

// Detect code blocks that are too long
const CODE_COLLAPSE_THRESHOLD = 10; // lines

// Detect file diffs
const DIFF_PATTERN = /^(---|\+\+\+|@@|diff --git)/m;

export default function ChatBubble({ message, onToolCallClick, onApprove, onReject }: ChatBubbleProps) {
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isStreaming = message.isStreaming;

  // Process content: detect approval requests
  const approvalMatch = message.content.match(/\[APPROVAL_REQUEST:(\w+)\](.*)/s);
  const hasApproval = approvalMatch && !isUser;

  // Split content into segments (text + code blocks)
  const segments = useMemo(() => {
    const parts: { type: 'text' | 'code' | 'diff'; content: string; lang?: string; index: number }[] = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let idx = 0;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: message.content.slice(lastIndex, match.index), index: idx++ });
      }
      // Code block
      const code = match[2];
      const lang = match[1] || '';
      const isDiff = DIFF_PATTERN.test(code) || lang === 'diff';
      parts.push({
        type: isDiff ? 'diff' : 'code',
        content: code,
        lang,
        index: idx++,
      });
      lastIndex = match.index + match[0].length;
    }
    // Remaining text
    if (lastIndex < message.content.length) {
      parts.push({ type: 'text', content: message.content.slice(lastIndex), index: idx++ });
    }
    return parts;
  }, [message.content]);

  const toggleCollapse = (index: number) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`chat-bubble ${isUser ? 'user' : isSystem ? 'system' : 'assistant'} ${isStreaming ? 'streaming' : ''}`}>
      {/* Role indicator */}
      <div className="bubble-header">
        <span className="bubble-role">
          {isUser ? '👤' : isSystem ? '⚙️' : '🤖'}
        </span>
        <span className="bubble-time">{formatTime(message.timestamp)}</span>
        {message.tokens && (
          <span className="bubble-tokens" title={`输入: ${message.tokens.input} / 输出: ${message.tokens.output}`}>
            {((message.tokens.input + message.tokens.output) / 1000).toFixed(1)}K
          </span>
        )}
        {message.cost != null && message.cost > 0 && (
          <span className="bubble-cost">¥{message.cost.toFixed(3)}</span>
        )}
      </div>

      {/* Content */}
      <div className="bubble-content">
        {segments.map(seg => {
          if (seg.type === 'text') {
            return (
              <div key={seg.index} className="bubble-text">
                <ReactMarkdown>{seg.content}</ReactMarkdown>
              </div>
            );
          }

          if (seg.type === 'diff') {
            return (
              <div key={seg.index} className="bubble-diff">
                <div className="diff-header">
                  <span>📄 文件差异</span>
                  <button className="btn-collapse" onClick={() => toggleCollapse(seg.index)}>
                    {collapsedBlocks.has(seg.index) ? '展开' : '折叠'}
                  </button>
                </div>
                {!collapsedBlocks.has(seg.index) && (
                  <pre className="diff-content">
                    {seg.content.split('\n').map((line, i) => (
                      <span
                        key={i}
                        className={`diff-line ${line.startsWith('+') ? 'added' : line.startsWith('-') ? 'removed' : line.startsWith('@@') ? 'hunk' : ''}`}
                      >
                        {line}
                        {'\n'}
                      </span>
                    ))}
                  </pre>
                )}
              </div>
            );
          }

          // Code block
          const lines = seg.content.split('\n');
          const isLong = lines.length > CODE_COLLAPSE_THRESHOLD;
          const isCollapsed = collapsedBlocks.has(seg.index) || (isLong && !collapsedBlocks.has(seg.index) && collapsedBlocks.size === 0);

          return (
            <div key={seg.index} className="bubble-code">
              <div className="code-header">
                <span className="code-lang">{seg.lang || 'code'}</span>
                <span className="code-lines">{lines.length} 行</span>
                {isLong && (
                  <button className="btn-collapse" onClick={() => toggleCollapse(seg.index)}>
                    {isCollapsed ? `展开 (${lines.length} 行)` : '折叠'}
                  </button>
                )}
              </div>
              <pre className="code-content">
                <code>
                  {isCollapsed
                    ? lines.slice(0, 5).join('\n') + `\n... (${lines.length - 5} 行已折叠)`
                    : seg.content}
                </code>
              </pre>
            </div>
          );
        })}
      </div>

      {/* Tool Calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="bubble-tools">
          {message.toolCalls.map(tc => (
            <button
              key={tc.id}
              className={`tool-call-card ${tc.status}`}
              onClick={() => onToolCallClick?.(tc)}
            >
              <span className="tool-icon">
                {tc.status === 'running' ? '⏳' : tc.status === 'error' ? '❌' : '🔧'}
              </span>
              <span className="tool-name">{tc.name}</span>
              {tc.duration != null && (
                <span className="tool-duration">{(tc.duration / 1000).toFixed(1)}s</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Inline Approval */}
      {hasApproval && onApprove && onReject && (
        <div className="bubble-approval">
          <p className="approval-desc">{approvalMatch[2]}</p>
          <div className="approval-actions">
            <button className="btn btn-approve" onClick={() => onApprove(approvalMatch[1])}>
              ✅ 批准
            </button>
            <button className="btn btn-reject" onClick={() => onReject(approvalMatch[1])}>
              ❌ 拒绝
            </button>
          </div>
        </div>
      )}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="bubble-streaming">
          <span className="streaming-dot"></span>
          <span className="streaming-dot"></span>
          <span className="streaming-dot"></span>
        </div>
      )}
    </div>
  );
}
