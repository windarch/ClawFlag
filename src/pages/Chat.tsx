/**
 * Chat 页面 - 与 AI 助手的对话界面
 * 包含：流式响应、工具调用模态框、执行链路、总结按钮、成本标签、停止按钮
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';
import { useChat, useSessions, type ChatMessage } from '../hooks/useGatewayData';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import ToolCallModal from '../components/ToolCallModal';
import ContextBar from '../components/ContextBar';
import SummarizeButton from '../components/SummarizeButton';
// SessionHistory removed - using inline session selector instead
import EmptyState from '../components/EmptyState';
import '../styles/pages.css';

export default function Chat() {
  const { connected, client } = useGatewayContext();
  const { sessions } = useSessions();
  const [activeSession, setActiveSession] = useState('agent:main:main');
  const { messages, sending, send, abort, summarize, loading } = useChat(activeSession);

  const [showToolCall, setShowToolCall] = useState<{ name: string; input: string; output?: string; duration?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send
  const handleSend = useCallback((text: string) => {
    if (!text.trim() || !connected) return;
    send(text);
  }, [send, connected]);

  // Token usage from active session
  const activeSessionInfo = sessions.find(s => s.key === activeSession || s.label === activeSession);
  const tokenUsage = activeSessionInfo?.tokenUsage ?? 0;

  // Calculate total cost for this chat
  const totalCost = messages.reduce((sum, m) => sum + (m.cost || 0), 0);

  return (
    <div className="page chat-page">
      {/* Context Bar */}
      <ContextBar
        tokenUsage={tokenUsage}
        tokenCount={activeSessionInfo ? activeSessionInfo.inputTokens + activeSessionInfo.outputTokens : undefined}
        maxTokens={200000}
        onCompact={async () => {
          if (client?.connected) {
            await client.sessionsCompact(activeSession);
          }
        }}
      />

      {/* Session Selector */}
      {sessions.length > 1 && (
        <div className="session-selector">
          <select
            value={activeSession}
            onChange={e => setActiveSession(e.target.value)}
            className="session-select"
          >
            {sessions.filter(s => s.status !== 'completed').map(s => (
              <option key={s.key || s.id} value={s.key || s.id}>
                {s.label || s.key} ({s.model})
              </option>
            ))}
          </select>
          <button className="btn btn-icon" title="会话历史">📋</button>
        </div>
      )}

      {/* Session History - inline via selector above */}

      {/* Messages */}
      <div className="chat-messages">
        {loading && messages.length === 0 && (
          <div className="chat-loading">
            <div className="loading-spinner-small"></div>
            <span>加载历史消息...</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <EmptyState
            icon="💬"
            title="开始对话"
            description={connected ? '发送第一条消息开始与 Agent 对话' : '请先连接 Gateway'}
          />
        )}

        {messages.map((msg: ChatMessage) => (
          <ChatBubble
            key={msg.id}
            message={{
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.getTime(),
              tokens: msg.tokens,
              cost: msg.cost,
              toolCalls: msg.toolCalls?.map(tc => ({
                id: tc.id,
                name: tc.name,
                args: tc.input,
                result: tc.output,
                duration: tc.duration,
                status: tc.status,
              })),
              isStreaming: msg.isStreaming,
            }}
            onToolCallClick={(tc) => setShowToolCall({
              name: tc.name,
              input: tc.args || '',
              output: tc.result,
              duration: tc.duration,
            })}
          />
        ))}

        {/* Cost footer */}
        {totalCost > 0 && (
          <div className="chat-cost-footer">
            💰 会话总成本: ¥{totalCost.toFixed(2)}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {sending && (
          <button className="btn btn-stop" onClick={abort} title="停止生成">
            ⏹ 停止
          </button>
        )}
        <SummarizeButton onSummarize={summarize} disabled={!connected || sending} />
        <ChatInput
          onSend={handleSend}
          disabled={!connected || sending}
          isLoading={sending}
          placeholder={connected ? '输入消息...' : '连接 Gateway 后可发送消息'}
        />
      </div>

      {/* Tool Call Modal */}
      {showToolCall && (
        <ToolCallModal
          toolCall={{
            name: showToolCall.name,
            args: showToolCall.input,
            result: showToolCall.output || '',
            duration: showToolCall.duration || 0,
          }}
          onClose={() => setShowToolCall(null)}
        />
      )}
    </div>
  );
}
