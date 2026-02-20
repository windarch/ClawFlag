/**
 * ChatBubble 组件
 * 用于渲染聊天消息气泡，支持 Markdown 和工具调用显示
 */

import ReactMarkdown from 'react-markdown';
import type { ChatBubbleProps, ToolCall } from '../types/chat';
import './ChatBubble.css';

// 格式化时间戳
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  const timeStr = date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  if (isToday) {
    return timeStr;
  }
  
  const dateStr = date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
  
  return `${dateStr} ${timeStr}`;
}

// 格式化成本
function formatCost(cost: number, currency: string): string {
  if (currency === 'USD') {
    return `$${cost.toFixed(4)}`;
  } else if (currency === 'CNY') {
    return `¥${cost.toFixed(4)}`;
  }
  return `${cost.toFixed(4)} ${currency}`;
}

// 格式化 Token 数量
function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

// 工具调用状态图标
const toolStatusIcons: Record<string, string> = {
  pending: '⏳',
  running: '⚙️',
  completed: '✅',
  failed: '❌',
};

// 工具调用状态标签
const toolStatusLabels: Record<string, string> = {
  pending: '等待中',
  running: '执行中',
  completed: '完成',
  failed: '失败',
};

// 工具调用卡片组件
function ToolCallCard({
  toolCall,
  onClick,
}: {
  toolCall: ToolCall;
  onClick?: () => void;
}) {
  return (
    <div className="tool-call-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="tool-call-header">
        <span className="tool-call-icon">🔧</span>
        <span className="tool-call-name">{toolCall.name}</span>
        <span className={`tool-call-status tool-call-status--${toolCall.status}`}>
          {toolStatusIcons[toolCall.status]} {toolStatusLabels[toolCall.status]}
        </span>
        {toolCall.durationMs && (
          <span className="tool-call-duration">
            {toolCall.durationMs}ms
          </span>
        )}
      </div>
    </div>
  );
}

export function ChatBubble({ message, onRetry, onToolCallInspect }: ChatBubbleProps) {
  const { role, content, timestamp, status, toolCalls, costInfo } = message;
  
  // 构建类名
  const bubbleClass = [
    'chat-bubble',
    `chat-bubble--${role}`,
    status === 'streaming' ? 'bubble-streaming' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div className={bubbleClass}>
      {/* 消息内容 */}
      <div className="bubble-content">
        {role === 'user' ? (
          // 用户消息直接显示文本
          <div className="markdown-content">{content}</div>
        ) : (
          // 助手和系统消息使用 Markdown 渲染
          <div className="markdown-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        
        {/* 工具调用卡片 */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="tool-calls">
            {toolCalls.map((tc) => (
              <ToolCallCard
                key={tc.id}
                toolCall={tc}
                onClick={() => onToolCallInspect?.(tc)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 元信息 */}
      <div className="bubble-meta">
        {/* 时间戳 */}
        <span className="bubble-timestamp">{formatTime(timestamp)}</span>
        
        {/* 消息状态 */}
        {status === 'sending' && (
          <span className="bubble-status bubble-status--sending">
            <span className="bubble-status-icon">⏳</span>
            发送中...
          </span>
        )}
        
        {status === 'failed' && (
          <span className="bubble-status bubble-status--failed">
            <span className="bubble-status-icon">❌</span>
            发送失败
            {onRetry && (
              <button className="bubble-retry" onClick={onRetry}>
                重试
              </button>
            )}
          </span>
        )}
        
        {/* 成本标签（仅助手消息） */}
        {role === 'assistant' && costInfo && status === 'sent' && (
          <span className="bubble-cost" title={`模型: ${costInfo.model || 'unknown'}`}>
            <span className="bubble-cost-icon">💰</span>
            <span>{formatCost(costInfo.cost, costInfo.currency)}</span>
            <span className="bubble-tokens">
              ({formatTokens(costInfo.tokens.total)} tokens)
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
