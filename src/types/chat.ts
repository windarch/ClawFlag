/**
 * 聊天消息类型定义
 * 用于 ClawFlag 对话功能
 */

// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'streaming';

// 工具调用状态
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed';

// 工具调用信息
export interface ToolCall {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: ToolCallStatus;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
}

// Token 使用统计
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

// 成本信息
export interface MessageCost {
  tokens: TokenUsage;
  cost: number;
  currency: string;
  model?: string;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
  
  // 可选字段
  sessionId?: string;
  replyTo?: string;
  
  // 工具调用（仅助手消息）
  toolCalls?: ToolCall[];
  
  // 成本信息（仅助手消息）
  costInfo?: MessageCost;
  
  // 错误信息（仅当 status 为 failed 时）
  error?: {
    code: string;
    message: string;
  };
  
  // 流式消息的进度
  streamProgress?: {
    current: number;
    total?: number;
    stage?: string;
  };
}

// 会话信息
export interface ChatSession {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  totalCost: number;
  model?: string;
  status: 'active' | 'paused' | 'completed';
}

// 聊天上下文
export interface ChatContext {
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// 发送消息请求
export interface SendMessageRequest {
  content: string;
  sessionId?: string;
  replyTo?: string;
}

// 消息流事件类型
export type ChatEventType = 
  | 'message_start'
  | 'message_chunk'
  | 'message_complete'
  | 'tool_call_start'
  | 'tool_call_complete'
  | 'error';

// 消息流事件
export interface ChatEvent {
  type: ChatEventType;
  messageId: string;
  sessionId: string;
  data?: {
    content?: string;
    toolCall?: ToolCall;
    costInfo?: MessageCost;
    error?: {
      code: string;
      message: string;
    };
  };
  timestamp: number;
}

// 消息列表 Props
export interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
  onToolCallInspect?: (toolCall: ToolCall) => void;
}

// 消息气泡 Props
export interface ChatBubbleProps {
  message: ChatMessage;
  onRetry?: () => void;
  onToolCallInspect?: (toolCall: ToolCall) => void;
}

// 消息输入框 Props
export interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

// 模拟消息生成（用于开发测试）
export function createMockUserMessage(content: string): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'user',
    content,
    timestamp: Date.now(),
    status: 'sent',
  };
}

export function createMockAssistantMessage(
  content: string,
  options?: {
    toolCalls?: ToolCall[];
    costInfo?: MessageCost;
  }
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content,
    timestamp: Date.now(),
    status: 'sent',
    toolCalls: options?.toolCalls,
    costInfo: options?.costInfo || {
      tokens: { input: 100, output: 150, total: 250 },
      cost: 0.0025,
      currency: 'USD',
      model: 'claude-sonnet-4-20250514',
    },
  };
}

export function createMockSystemMessage(content: string): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'system',
    content,
    timestamp: Date.now(),
    status: 'sent',
  };
}
