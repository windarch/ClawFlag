/**
 * Gateway 类型定义
 * 定义与 OpenClaw Gateway WebSocket 通信的相关类型
 */

// Gateway 连接配置
export interface GatewayConfig {
  // Gateway 地址 (IP 或域名)
  host: string;
  // 端口号，默认 18789
  port: number;
  // 认证 Token
  token: string;
  // 使用安全连接 (wss://)
  secure?: boolean;
}

// Gateway 连接状态
export type GatewayStatus = 
  | 'disconnected'  // 未连接
  | 'connecting'    // 连接中
  | 'connected'     // 已连接
  | 'error';        // 连接错误

// Gateway 连接错误信息
export interface GatewayError {
  code: string;
  message: string;
  timestamp: number;
}

// WebSocket 消息基础类型
export interface WsMessageBase {
  type: string;
  id?: string;
  timestamp?: number;
}

// 发送的消息类型
export interface WsOutgoingMessage extends WsMessageBase {
  payload?: unknown;
}

// 接收的消息类型
export interface WsIncomingMessage extends WsMessageBase {
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

// 心跳消息
export interface WsHeartbeatMessage extends WsMessageBase {
  type: 'ping' | 'pong';
}

// 系统信息响应 (用于版本检测)
export interface SystemInfoResponse {
  version?: string;
  gateway_version?: string;
  capabilities?: string[];
  uptime?: number;
}

// 认证请求
export interface AuthRequest extends WsOutgoingMessage {
  type: 'auth';
  payload: {
    token: string;
  };
}

// 认证响应
export interface AuthResponse extends WsIncomingMessage {
  type: 'auth_result';
  data?: {
    success: boolean;
    user?: string;
    permissions?: string[];
  };
}

// 工具调用事件
export interface ToolCallEvent extends WsIncomingMessage {
  type: 'tool_call';
  data: {
    tool: string;
    args?: Record<string, unknown>;
    session_id?: string;
  };
}

// 工具调用完成事件
export interface ToolResultEvent extends WsIncomingMessage {
  type: 'tool_result';
  data: {
    tool: string;
    result?: unknown;
    error?: string;
    duration_ms?: number;
    tokens?: {
      input: number;
      output: number;
    };
  };
}

// 会话事件
export interface SessionEvent extends WsIncomingMessage {
  type: 'session_start' | 'session_end' | 'session_update';
  data: {
    session_id: string;
    channel?: string;
    model?: string;
    status?: string;
  };
}

// 成本更新事件
export interface CostUpdateEvent extends WsIncomingMessage {
  type: 'cost_update';
  data: {
    today_cost: number;
    today_tokens: number;
    currency?: string;
  };
}

// 审批请求事件
export interface ApprovalRequestEvent extends WsIncomingMessage {
  type: 'approval_request';
  data: {
    request_id: string;
    action: string;
    description: string;
    risk_level?: 'low' | 'medium' | 'high';
    timeout_ms?: number;
  };
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  cost?: number;
  tool_calls?: Array<{
    name: string;
    args?: Record<string, unknown>;
    result?: unknown;
  }>;
}

// 发送聊天消息请求
export interface SendChatRequest extends WsOutgoingMessage {
  type: 'chat';
  payload: {
    message: string;
    session_id?: string;
  };
}

// 聊天消息响应
export interface ChatResponseEvent extends WsIncomingMessage {
  type: 'chat_response' | 'chat_chunk';
  data: {
    content?: string;
    done?: boolean;
    session_id?: string;
    message_id?: string;
  };
}

// Gateway 连接状态详情
export interface GatewayState {
  status: GatewayStatus;
  error: GatewayError | null;
  config: GatewayConfig | null;
  systemInfo: SystemInfoResponse | null;
  lastConnected: number | null;
  reconnectAttempts: number;
}

// 本地存储的 Gateway 配置
export interface StoredGatewayConfig {
  host: string;
  port: number;
  token: string;
  secure: boolean;
  lastUsed: number;
}
