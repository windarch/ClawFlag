/**
 * Chat 页面 - 与 AI 助手的对话界面
 * 包含：工具调用模态框、执行链路、总结按钮、成本标签
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import ContextBar from '../components/ContextBar';
import ToolCallModal from '../components/ToolCallModal';
import { useGatewayContext } from '../contexts/GatewayContext';
import type { ChatMessage, ToolCall } from '../types/chat';
import '../styles/pages.css';
import './Chat.css';

// Mock messages
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'sys_1', role: 'system',
    content: '🤖 会话已开始，AI 助手已就绪。',
    timestamp: Date.now() - 3600000, status: 'sent',
  },
  {
    id: 'user_1', role: 'user',
    content: '你好！帮我查一下今天的天气怎么样？',
    timestamp: Date.now() - 3500000, status: 'sent',
  },
  {
    id: 'assistant_1', role: 'assistant',
    content: '好的，我来帮你查询一下今天的天气情况。\n\n根据最新数据，上海今天的天气如下：\n\n- **天气**：晴转多云\n- **温度**：12°C - 18°C\n- **风力**：东南风 2-3级\n- **空气质量**：良好 (AQI 65)\n\n今天是个适合外出的好天气！记得带件外套，早晚温差较大。',
    timestamp: Date.now() - 3400000, status: 'sent',
    toolCalls: [
      {
        id: 'tc_1', name: 'web_search',
        args: { query: '上海今天天气' },
        result: '晴转多云，12-18°C，东南风2-3级，AQI 65',
        status: 'completed', durationMs: 850,
      },
    ],
    costInfo: {
      tokens: { input: 120, output: 180, total: 300 },
      cost: 0.0035, currency: 'USD', model: 'claude-sonnet-4-20250514',
    },
  },
  {
    id: 'user_2', role: 'user',
    content: '帮我写一段简单的 Python 代码，实现一个计算斐波那契数列的函数。',
    timestamp: Date.now() - 300000, status: 'sent',
  },
  {
    id: 'assistant_2', role: 'assistant',
    content: '当然！这是一个计算斐波那契数列的 Python 函数：\n\n```python\ndef fibonacci(n):\n    """计算斐波那契数列的第 n 项"""\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nfor i in range(10):\n    print(f"F({i}) = {fibonacci(i)}")\n```\n\n时间复杂度 O(n)，空间复杂度 O(1)。',
    timestamp: Date.now() - 200000, status: 'sent',
    toolCalls: [
      {
        id: 'tc_2', name: 'Write',
        args: { path: '/tmp/fibonacci.py', content: 'def fibonacci(n):\n    ...' },
        result: 'Successfully wrote 245 bytes',
        status: 'completed', durationMs: 12,
      },
    ],
    costInfo: {
      tokens: { input: 85, output: 320, total: 405 },
      cost: 0.0048, currency: 'USD', model: 'claude-sonnet-4-20250514',
    },
  },
];

export default function Chat() {
  const { isConnected } = useGatewayContext();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToolCall, setSelectedToolCall] = useState<ToolCall | null>(null);
  const [showSummarize, setShowSummarize] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`, role: 'user', content,
      timestamp: Date.now(), status: 'sent',
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`, role: 'assistant',
        content: `收到你的消息：「${content}」\n\n这是一条模拟的 AI 回复。连接 Gateway 后将获取真实响应。`,
        timestamp: Date.now(), status: 'sent',
        costInfo: {
          tokens: { input: 50 + content.length, output: 120, total: 170 + content.length },
          cost: 0.002, currency: 'USD', model: 'claude-sonnet-4-20250514',
        },
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleRetry = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      handleSend(message.content);
    }
  }, [messages, handleSend]);

  const handleToolCallInspect = useCallback((toolCall: ToolCall) => {
    setSelectedToolCall(toolCall);
  }, []);

  const handleSummarize = useCallback(() => {
    setShowSummarize(false);
    // Mock: add summary message
    const summaryMsg: ChatMessage = {
      id: `msg_${Date.now()}_sys`, role: 'system',
      content: '📋 **会话摘要**\n\n本次对话包含 2 个主题：\n1. 天气查询（上海，晴转多云 12-18°C）\n2. Python 斐波那契函数编写\n\n共消耗 705 tokens，花费 $0.0083。',
      timestamp: Date.now(), status: 'sent',
    };
    setMessages(prev => [...prev, summaryMsg]);
  }, []);

  // Long press on input area to show summarize
  const handleInputLongPressStart = useCallback(() => {
    longPressTimer.current = window.setTimeout(() => setShowSummarize(true), 800);
  }, []);
  const handleInputLongPressEnd = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  // Calculate total cost
  const totalCost = messages.reduce((sum, m) => sum + (m.costInfo?.cost || 0), 0);
  const totalTokens = messages.reduce((sum, m) => sum + (m.costInfo?.tokens?.total || 0), 0);

  return (
    <div className="page chat-page">
      {/* Context bar */}
      <ContextBar tokenUsage={65} tokenCount={650000} maxTokens={1000000} onCompact={() => console.log('Compact')} />

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h1 className="chat-title">💬 对话</h1>
          <span className={`chat-status ${isConnected ? 'chat-status--connected' : 'chat-status--disconnected'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="chat-subtitle" style={{ margin: '4px 0 0' }}>
            {isConnected ? '与 AI 助手实时交流' : '请先连接 Gateway'}
          </p>
          {/* Session cost summary */}
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {totalTokens > 0 && `${(totalTokens / 1000).toFixed(1)}K tokens · $${totalCost.toFixed(4)}`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💭</div>
            <p className="chat-empty-text">还没有消息</p>
            <p className="chat-empty-hint">发送第一条消息开始对话</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatBubble
                key={message.id}
                message={message}
                onRetry={() => handleRetry(message.id)}
                onToolCallInspect={handleToolCallInspect}
              />
            ))}
            {isLoading && (
              <div className="chat-typing">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
                <span className="typing-text">AI 正在思考...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Summarize popover */}
      {showSummarize && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '0.5rem', display: 'flex', gap: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 100,
        }}>
          <button onClick={handleSummarize} style={{
            background: 'var(--color-accent)', border: 'none', borderRadius: 8,
            padding: '0.5rem 1rem', color: 'white', fontSize: '0.8rem', cursor: 'pointer',
          }}>📋 总结此会话</button>
          <button onClick={() => setShowSummarize(false)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
            padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
          }}>取消</button>
        </div>
      )}

      {/* Input with long-press */}
      <div onTouchStart={handleInputLongPressStart} onTouchEnd={handleInputLongPressEnd}
           onMouseDown={handleInputLongPressStart} onMouseUp={handleInputLongPressEnd}>
        <ChatInput
          onSend={handleSend} isLoading={isLoading}
          placeholder={isConnected ? '输入消息... (长按可总结)' : '连接 Gateway 后可发送消息'}
          disabled={false}
        />
      </div>

      {/* Tool call modal */}
      <ToolCallModal toolCall={selectedToolCall} onClose={() => setSelectedToolCall(null)} />
    </div>
  );
}
