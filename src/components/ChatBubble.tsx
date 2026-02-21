/**
 * ChatBubble 组件
 * 渲染聊天消息气泡，支持 Markdown、工具调用、折叠代码块、文件差异、内联批准
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatBubbleProps, ToolCall } from '../types/chat';
import './ChatBubble.css';

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return timeStr;
  const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  return `${dateStr} ${timeStr}`;
}

function formatCost(cost: number, currency: string): string {
  return currency === 'USD' ? `$${cost.toFixed(4)}` : currency === 'CNY' ? `¥${cost.toFixed(4)}` : `${cost.toFixed(4)} ${currency}`;
}

function formatTokens(tokens: number): string {
  return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
}

const toolStatusIcons: Record<string, string> = { pending: '⏳', running: '⚙️', completed: '✅', failed: '❌' };
const toolStatusLabels: Record<string, string> = { pending: '等待中', running: '执行中', completed: '完成', failed: '失败' };

// Collapsible code block for long output
function CollapsibleCode({ code, language }: { code: string; language?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = code.split('\n');
  const shouldCollapse = lines.length > 5;

  if (!shouldCollapse) {
    return <pre className="code-block"><code>{code}</code></pre>;
  }

  return (
    <div className="collapsible-code">
      <pre className="code-block">
        <code>{expanded ? code : lines.slice(0, 5).join('\n') + '\n...'}</code>
      </pre>
      <button className="code-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▲ 收起' : `▼ 展开 (${lines.length} 行${language ? ` · ${language}` : ''})`}
      </button>
    </div>
  );
}

// File diff card for Write/Edit tool calls
function FileDiffCard({ toolCall }: { toolCall: ToolCall }) {
  const isFileOp = ['Write', 'Edit', 'write', 'edit'].includes(toolCall.name);
  if (!isFileOp) return null;

  const filename = (toolCall.args?.path as string) || (toolCall.args?.file_path as string) || 'unknown';
  const result = typeof toolCall.result === 'string' ? toolCall.result : '';
  const addedMatch = result.match(/(\d+)\s*bytes/);

  return (
    <div className="file-diff-card">
      <div className="file-diff-header">
        <span className="file-diff-icon">📄</span>
        <span className="file-diff-name">{filename.split('/').pop()}</span>
        {toolCall.name.toLowerCase() === 'write' && <span className="file-diff-badge file-diff-add">新建</span>}
        {toolCall.name.toLowerCase() === 'edit' && <span className="file-diff-badge file-diff-edit">修改</span>}
      </div>
      <div className="file-diff-meta">
        {filename} {addedMatch && `· ${addedMatch[0]}`}
      </div>
    </div>
  );
}

// Inline approval buttons for dangerous operations
function InlineApproval({ toolCall }: { toolCall: ToolCall }) {
  const [decided, setDecided] = useState<'approved' | 'rejected' | null>(null);
  const isDangerous = toolCall.status === 'pending' && 
    /delete|rm|drop|destroy|remove|危险/i.test(`${toolCall.name} ${JSON.stringify(toolCall.args)}`);
  
  if (!isDangerous) return null;
  if (decided) {
    return (
      <div className={`inline-approval-result ${decided}`}>
        {decided === 'approved' ? '✅ 已批准' : '❌ 已拒绝'}
      </div>
    );
  }

  return (
    <div className="inline-approval">
      <span className="inline-approval-label">⚠️ 需要批准</span>
      <div className="inline-approval-buttons">
        <button className="approval-btn approve" onClick={() => setDecided('approved')}>✅ 批准</button>
        <button className="approval-btn reject" onClick={() => setDecided('rejected')}>❌ 拒绝</button>
      </div>
    </div>
  );
}

function ToolCallCard({ toolCall, onClick }: { toolCall: ToolCall; onClick?: () => void }) {
  return (
    <>
      <div className="tool-call-card" onClick={onClick} role="button" tabIndex={0}>
        <div className="tool-call-header">
          <span className="tool-call-icon">🔧</span>
          <span className="tool-call-name">{toolCall.name}</span>
          <span className={`tool-call-status tool-call-status--${toolCall.status}`}>
            {toolStatusIcons[toolCall.status]} {toolStatusLabels[toolCall.status]}
          </span>
          {toolCall.durationMs && <span className="tool-call-duration">{toolCall.durationMs}ms</span>}
        </div>
      </div>
      <FileDiffCard toolCall={toolCall} />
      <InlineApproval toolCall={toolCall} />
    </>
  );
}

// Custom markdown renderer with collapsible code blocks
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            const isBlock = codeStr.includes('\n');
            if (isBlock) {
              return <CollapsibleCode code={codeStr} language={match?.[1]} />;
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ChatBubble({ message, onRetry, onToolCallInspect }: ChatBubbleProps) {
  const { role, content, timestamp, status, toolCalls, costInfo } = message;

  const bubbleClass = [
    'chat-bubble', `chat-bubble--${role}`,
    status === 'streaming' ? 'bubble-streaming' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={bubbleClass}>
      <div className="bubble-content">
        {role === 'user' ? (
          <div className="markdown-content">{content}</div>
        ) : (
          <MarkdownContent content={content} />
        )}
        {toolCalls && toolCalls.length > 0 && (
          <div className="tool-calls">
            {toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} onClick={() => onToolCallInspect?.(tc)} />
            ))}
          </div>
        )}
      </div>
      <div className="bubble-meta">
        <span className="bubble-timestamp">{formatTime(timestamp)}</span>
        {status === 'sending' && (
          <span className="bubble-status bubble-status--sending"><span className="bubble-status-icon">⏳</span>发送中...</span>
        )}
        {status === 'failed' && (
          <span className="bubble-status bubble-status--failed">
            <span className="bubble-status-icon">❌</span>发送失败
            {onRetry && <button className="bubble-retry" onClick={onRetry}>重试</button>}
          </span>
        )}
        {role === 'assistant' && costInfo && status === 'sent' && (
          <span className="bubble-cost" title={`模型: ${costInfo.model || 'unknown'}`}>
            <span className="bubble-cost-icon">💰</span>
            <span>{formatCost(costInfo.cost, costInfo.currency)}</span>
            <span className="bubble-tokens">({formatTokens(costInfo.tokens.total)} tokens)</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
