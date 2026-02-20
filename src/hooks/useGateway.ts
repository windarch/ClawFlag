/**
 * Gateway 连接 Hook
 * 管理与 OpenClaw Gateway 的 WebSocket 连接
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GatewayConfig,
  GatewayStatus,
  GatewayError,
  GatewayState,
  StoredGatewayConfig,
  WsIncomingMessage,
  WsOutgoingMessage,
  SystemInfoResponse,
} from '../types/gateway';

// 常量配置
const HEARTBEAT_INTERVAL = 15000; // 15秒心跳
const INITIAL_RECONNECT_DELAY = 1000; // 初始重连延迟 1秒
const MAX_RECONNECT_DELAY = 30000; // 最大重连延迟 30秒
const MAX_RECONNECT_ATTEMPTS = 10; // 最大重连次数
const STORAGE_KEY = 'clawflag_gateway_config';

// 消息事件类型
type MessageHandler = (message: WsIncomingMessage) => void;

interface UseGatewayReturn {
  // 状态
  status: GatewayStatus;
  error: GatewayError | null;
  config: GatewayConfig | null;
  systemInfo: SystemInfoResponse | null;
  isConnected: boolean;
  
  // 操作
  connect: (config: GatewayConfig) => Promise<boolean>;
  disconnect: () => void;
  send: (message: WsOutgoingMessage) => boolean;
  
  // 事件订阅
  subscribe: (handler: MessageHandler) => () => void;
  
  // 存储的配置
  loadStoredConfig: () => StoredGatewayConfig | null;
  clearStoredConfig: () => void;
}

export function useGateway(): UseGatewayReturn {
  // 状态管理
  const [state, setState] = useState<GatewayState>({
    status: 'disconnected',
    error: null,
    config: null,
    systemInfo: null,
    lastConnected: null,
    reconnectAttempts: 0,
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());
  const configRef = useRef<GatewayConfig | null>(null);
  const manualDisconnectRef = useRef(false);

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<GatewayState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // 通知消息处理器
  const notifyHandlers = useCallback((message: WsIncomingMessage) => {
    messageHandlersRef.current.forEach(handler => {
      try {
        handler(message);
      } catch (err) {
        console.error('[Gateway] Message handler error:', err);
      }
    });
  }, []);

  // 保存配置到 localStorage
  const saveConfig = useCallback((config: GatewayConfig) => {
    const stored: StoredGatewayConfig = {
      host: config.host,
      port: config.port,
      token: config.token,
      secure: config.secure ?? false,
      lastUsed: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, []);

  // 加载存储的配置
  const loadStoredConfig = useCallback((): StoredGatewayConfig | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StoredGatewayConfig;
      }
    } catch (err) {
      console.error('[Gateway] Failed to load stored config:', err);
    }
    return null;
  }, []);

  // 清除存储的配置
  const clearStoredConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 构建 WebSocket URL
  const buildWsUrl = useCallback((config: GatewayConfig): string => {
    const protocol = config.secure ? 'wss' : 'ws';
    return `${protocol}://${config.host}:${config.port}/ws`;
  }, []);

  // 发送心跳
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, []);

  // 启动心跳
  const startHeartbeat = useCallback(() => {
    clearTimers();
    heartbeatTimerRef.current = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }, [clearTimers, sendHeartbeat]);

  // 计算重连延迟（指数退避）
  const getReconnectDelay = useCallback((attempt: number): number => {
    const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, attempt);
    return Math.min(delay, MAX_RECONNECT_DELAY);
  }, []);

  // 尝试重连
  const attemptReconnect = useCallback(() => {
    if (manualDisconnectRef.current || !configRef.current) {
      return;
    }

    const attempts = state.reconnectAttempts;
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      updateState({
        status: 'error',
        error: {
          code: 'MAX_RECONNECT_EXCEEDED',
          message: `达到最大重连次数 (${MAX_RECONNECT_ATTEMPTS})`,
          timestamp: Date.now(),
        },
      });
      return;
    }

    const delay = getReconnectDelay(attempts);
    console.log(`[Gateway] 将在 ${delay}ms 后尝试第 ${attempts + 1} 次重连...`);

    reconnectTimerRef.current = window.setTimeout(() => {
      updateState({ reconnectAttempts: attempts + 1 });
      connectInternal(configRef.current!);
    }, delay);
  }, [state.reconnectAttempts, getReconnectDelay, updateState]);

  // 内部连接函数
  const connectInternal = useCallback((config: GatewayConfig) => {
    // 清理现有连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    clearTimers();

    updateState({ status: 'connecting', error: null });
    configRef.current = config;

    const wsUrl = buildWsUrl(config);
    console.log(`[Gateway] 正在连接到 ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Gateway] WebSocket 连接已建立');
        
        // 发送认证消息
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { token: config.token },
        }));

        // 请求系统信息
        ws.send(JSON.stringify({ type: 'system_info' }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WsIncomingMessage;
          
          // 处理心跳响应
          if (message.type === 'pong') {
            return;
          }

          // 处理认证响应
          if (message.type === 'auth_result') {
            const authData = message.data as { success: boolean } | undefined;
            if (authData?.success) {
              console.log('[Gateway] 认证成功');
              updateState({
                status: 'connected',
                config,
                lastConnected: Date.now(),
                reconnectAttempts: 0,
              });
              saveConfig(config);
              startHeartbeat();
            } else {
              console.error('[Gateway] 认证失败');
              updateState({
                status: 'error',
                error: {
                  code: 'AUTH_FAILED',
                  message: '认证失败，请检查 Token',
                  timestamp: Date.now(),
                },
              });
              ws.close();
            }
            return;
          }

          // 处理系统信息响应
          if (message.type === 'system_info') {
            const sysInfo = message.data as SystemInfoResponse | undefined;
            if (sysInfo) {
              updateState({ systemInfo: sysInfo });
            }
            return;
          }

          // 通知其他消息处理器
          notifyHandlers(message);
        } catch (err) {
          console.error('[Gateway] 解析消息失败:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Gateway] WebSocket 错误:', event);
      };

      ws.onclose = (event) => {
        console.log(`[Gateway] WebSocket 关闭: code=${event.code}, reason=${event.reason}`);
        clearTimers();

        if (!manualDisconnectRef.current) {
          // 非手动断开，尝试重连
          updateState({
            status: 'disconnected',
            error: event.code !== 1000 ? {
              code: `WS_CLOSE_${event.code}`,
              message: event.reason || '连接已断开',
              timestamp: Date.now(),
            } : null,
          });
          attemptReconnect();
        } else {
          updateState({
            status: 'disconnected',
            error: null,
            config: null,
            systemInfo: null,
          });
        }
      };
    } catch (err) {
      console.error('[Gateway] 创建 WebSocket 失败:', err);
      updateState({
        status: 'error',
        error: {
          code: 'CONNECTION_FAILED',
          message: err instanceof Error ? err.message : '连接失败',
          timestamp: Date.now(),
        },
      });
    }
  }, [buildWsUrl, clearTimers, updateState, saveConfig, startHeartbeat, notifyHandlers, attemptReconnect]);

  // 公开的连接函数
  const connect = useCallback(async (config: GatewayConfig): Promise<boolean> => {
    manualDisconnectRef.current = false;
    
    return new Promise((resolve) => {
      // 设置超时
      const timeout = setTimeout(() => {
        if (state.status !== 'connected') {
          resolve(false);
        }
      }, 10000); // 10秒超时

      // 监听状态变化
      const checkConnection = () => {
        if (state.status === 'connected') {
          clearTimeout(timeout);
          resolve(true);
        } else if (state.status === 'error') {
          clearTimeout(timeout);
          resolve(false);
        }
      };

      // 开始连接
      connectInternal(config);

      // 轮询检查状态
      const interval = setInterval(() => {
        checkConnection();
        if (state.status === 'connected' || state.status === 'error') {
          clearInterval(interval);
        }
      }, 100);

      // 确保清理
      setTimeout(() => clearInterval(interval), 10000);
    });
  }, [connectInternal, state.status]);

  // 断开连接
  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    updateState({
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
    });
  }, [clearTimers, updateState]);

  // 发送消息
  const send = useCallback((message: WsOutgoingMessage): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (err) {
        console.error('[Gateway] 发送消息失败:', err);
      }
    }
    return false;
  }, []);

  // 订阅消息
  const subscribe = useCallback((handler: MessageHandler): () => void => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      manualDisconnectRef.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimers]);

  return {
    status: state.status,
    error: state.error,
    config: state.config,
    systemInfo: state.systemInfo,
    isConnected: state.status === 'connected',
    connect,
    disconnect,
    send,
    subscribe,
    loadStoredConfig,
    clearStoredConfig,
  };
}

export default useGateway;
