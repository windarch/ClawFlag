/**
 * Gateway Context
 * Provides GatewayClient instance and connection state to entire app.
 * Manages connect/disconnect lifecycle and event subscriptions.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { GatewayClient, type HelloPayload, type GatewayClientOpts } from '../services/gatewayClient';

// Storage key for persisted connection config
const STORAGE_KEY = 'clawflag_gateway';

export interface GatewayConfig {
  host: string;
  port: number;
  token?: string;
  password?: string;
  secure?: boolean;
}

export interface StoredConfig extends GatewayConfig {
  lastUsed: number;
}

interface GatewayContextValue {
  // State
  connected: boolean;
  connecting: boolean;
  error: string | null;
  hello: HelloPayload | null;
  config: GatewayConfig | null;
  client: GatewayClient | null;

  // Actions
  connect: (config: GatewayConfig) => void;
  disconnect: () => void;
  loadStoredConfig: () => StoredConfig | null;
  clearStoredConfig: () => void;
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hello, setHello] = useState<HelloPayload | null>(null);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const clientRef = useRef<GatewayClient | null>(null);

  const buildUrl = useCallback((cfg: GatewayConfig) => {
    const protocol = cfg.secure ? 'wss' : 'ws';
    return `${protocol}://${cfg.host}:${cfg.port}/ws`;
  }, []);

  const saveConfig = useCallback((cfg: GatewayConfig) => {
    const stored: StoredConfig = { ...cfg, lastUsed: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, []);

  const loadStoredConfig = useCallback((): StoredConfig | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const clearStoredConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.stop();
    clientRef.current = null;
    setConnected(false);
    setConnecting(false);
    setError(null);
    setHello(null);
    setConfig(null);
  }, []);

  const connect = useCallback((cfg: GatewayConfig) => {
    // Clean up previous
    clientRef.current?.stop();

    setConnecting(true);
    setError(null);
    setConfig(cfg);

    const opts: GatewayClientOpts = {
      url: buildUrl(cfg),
      token: cfg.token,
      password: cfg.password,
      onHello: (payload) => {
        setConnected(true);
        setConnecting(false);
        setError(null);
        setHello(payload);
        saveConfig(cfg);
      },
      onClose: (_code, reason) => {
        setConnected(false);
        setError(`断开连接: ${reason}`);
      },
      onError: (err) => {
        setConnecting(false);
        setError(err);
      },
      onReconnecting: (attempt, delay) => {
        setConnecting(true);
        setError(`重连中 (第${attempt}次, ${Math.round(delay / 1000)}秒后)...`);
      },
    };

    const client = new GatewayClient(opts);
    clientRef.current = client;
    client.start();
  }, [buildUrl, saveConfig]);

  // Auto-connect from stored config on mount
  useEffect(() => {
    const stored = loadStoredConfig();
    if (stored) {
      connect(stored);
    }
    return () => {
      clientRef.current?.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GatewayContext.Provider value={{
      connected,
      connecting,
      error,
      hello,
      config,
      client: clientRef.current,
      connect,
      disconnect,
      loadStoredConfig,
      clearStoredConfig,
    }}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGatewayContext() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error('useGatewayContext must be used within GatewayProvider');
  return ctx;
}

export default GatewayContext;
