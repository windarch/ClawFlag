/**
 * Chat 页面
 * 与 AI 助手的对话界面
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import ContextBar from '../components/ContextBar';
import { useGatewayContext } from '../contexts/GatewayContext';
import type { ChatMessage, ToolCall } from '../types/chat';
import '../styles/pages.css';
import './Chat.css';

// 模拟数据（用于开发测试）
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'sys_1',
    role: 'system',
    content: '🤖 会话已开始，AI 助手已就绪。',
    timestamp: Date.now() - 3600000,
    status: 'sent',
  },
  {
    id: 'user_1',
    role: 'user',
    content: '你好！帮我查一下今天的天气怎么样？',
    timestamp: Date.now() - 3500000,
    status: 'sent',
  },
  {
    id: 'assistant_1',
    role: 'assistant',
    content: '好的，我来帮你查询一下今天的天气情况。\n\n根据最新数据，上海今天的天气如下：\n\n- **天气**：晴转多云\n- **温度**：12°C - 18°C\n- **风力**：东南风 2-3级\n- **空气质量**：良好 (AQI 65)\n\n今天是个适合外出的好天气！记得带件外套，早晚温差较大。',
    timestamp: Date.now() - 3400000,
    status: 'sent',
    toolCalls: [
      {
        id: 'tc_1',
        name: 'web_search',
        args: { query: '上海今天天气' },
        status: 'completed',
        durationMs: 850,
      },
    ],
    costInfo: {
      tokens: { input: 120, output: 180, total: 300 },
      cost: 0.0035,
      currency: 'USD',
      model: 'claude-sonnet-4-20250514',
    },
  },
  {
    id: 'user_2',
    role: 'user',
    content: '帮我写一段简单的 Python 代码，实现一个计算斐波那契数列的函数。',
    timestamp: Date.now() - 300000,
    status: 'sent',
  },
  {
    id: 'assistant_2',
    role: 'assistant',
    content: '当然！这是一个计算斐波那契数列的 Python 函数：\n\n```python\ndef fibonacci(n):\n    """计算斐波那契数列的第 n 项"""\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    \n    # 使用迭代方式，效率更高\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\n# 示例用法\nfor i in range(10):\n    print(f"F({i}) = {fibonacci(i)}")\n```\n\n这个实现使用迭代方式，时间复杂度是 O(n)，空间复杂度是 O(1)，比递归方式更高效。\n\n你想要我解释代码的某个部分吗？',
    timestamp: Date.now() - 200000,
    status: 'sent',
    costInfo: {
      tokens: { input: 85, output: 320, total: 405 },
      cost: 0.0048,
      currency: 'USD',
      model: 'claude-sonnet-4-20250514',
    },
  },
];

export default function Chat() {
  const { isConnected } = useGatewayContext();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // 发送消息
  const handleSend = useCallback((content: string) => {
    // 创建用户消息
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: Date.now(),
      status: 'sent',
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // 模拟 AI 响应（开发测试用）
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: `收到你的消息：「${content}」\n\n这是一条模拟的 AI 回复。在实际使用中，消息将通过 Gateway WebSocket 发送给 AI Agent 并获取真实响应。\n\n**当前状态**：\n- Gateway 连接：${isConnected ? '✅ 已连接' : '❌ 未连接'}\n- 消息数量：${messages.length + 2}`,
        timestamp: Date.now(),
        status: 'sent',
        costInfo: {
          tokens: { input: 50 + content.length, output: 120, total: 170 + content.length },
          cost: 0.002,
          currency: 'USD',
          model: 'claude-sonnet-4-20250514',
        },
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  }, [isConnected, messages.length]);
  
  // 重试发送
  const handleRetry = useCallback((messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message && message.role === 'user') {
      // 移除失败的消息并重新发送
      setMessages(prev => prev.filter(m => m.id !== messageId));
      handleSend(message.content);
    }
  }, [messages, handleSend]);
  
  // 工具调用详情查看
  const handleToolCallInspect = useCallback((toolCall: ToolCall) => {
    console.log('查看工具调用详情:', toolCall);
    // TODO: 打开工具调用详情模态框
    alert(`工具: ${toolCall.name}\n参数: ${JSON.stringify(toolCall.args, null, 2)}\n状态: ${toolCall.status}\n耗时: ${toolCall.durationMs}ms`);
  }, []);
  
  return (
    <div className="page chat-page">
      {/* 上下文压缩警告 */}
      <ContextBar
        tokenUsage={65}
        tokenCount={650000}
        maxTokens={1000000}
        onCompact={() => console.log('Compact session')}
      />

      {/* 页面头部 */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h1 className="chat-title">💬 对话</h1>
          <span className={`chat-status ${isConnected ? 'chat-status--connected' : 'chat-status--disconnected'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
        </div>
        <p className="chat-subtitle">
          {isConnected 
            ? '与 AI 助手实时交流' 
            : '请先连接 Gateway 以开始对话'}
        </p>
      </div>
      
      {/* 消息列表 */}
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
            
            {/* 加载指示器 */}
            {isLoading && (
              <div className="chat-typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">AI 正在思考...</span>
              </div>
            )}
            
            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* 输入框 */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        placeholder={isConnected ? '输入消息...' : '连接 Gateway 后可发送消息'}
        disabled={false} // 开发模式下允许发送模拟消息
      />
    </div>
  );
}
