/**
 * Gateway 上下文
 * 在整个应用中共享 Gateway 连接状态
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGateway } from '../hooks/useGateway';
import type {
  GatewayConfig,
  GatewayStatus,
  GatewayError,
  SystemInfoResponse,
  StoredGatewayConfig,
  WsIncomingMessage,
  WsOutgoingMessage,
} from '../types/gateway';

type MessageHandler = (message: WsIncomingMessage) => void;

interface GatewayContextValue {
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

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const gateway = useGateway();

  return (
    <GatewayContext.Provider value={gateway}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGatewayContext(): GatewayContextValue {
  const context = useContext(GatewayContext);
  if (!context) {
    throw new Error('useGatewayContext must be used within a GatewayProvider');
  }
  return context;
}

export default GatewayContext;
