/**
 * Real Gateway data hooks
 * Uses GatewayClient to fetch live data from OpenClaw Gateway
 * Falls back to mock data when not connected
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GatewayClient } from '../services/gatewayClient';

export interface RealGatewayConfig {
  url: string;
  token: string;
}

export function useRealGateway(config: RealGatewayConfig | null) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hello, setHello] = useState<Record<string, unknown> | null>(null);
  const clientRef = useRef<GatewayClient | null>(null);

  useEffect(() => {
    if (!config) return;

    const client = new GatewayClient({
      url: config.url,
      token: config.token || undefined,
      onHello: (payload) => {
        setConnected(true);
        setError(null);
        setHello(payload);
      },
      onClose: (_code, reason) => {
        setConnected(false);
        setError(`disconnected: ${reason}`);
      },
      onError: (err) => setError(err),
      onEvent: (_event, _payload) => {
        // Handle real-time events (chat, cron, etc.)
      },
    });

    clientRef.current = client;
    client.start();

    return () => {
      client.stop();
      clientRef.current = null;
    };
  }, [config?.url, config?.token]);

  const request = useCallback(async <T = unknown>(method: string, params: unknown = {}): Promise<T> => {
    if (!clientRef.current?.connected) throw new Error('not connected');
    return clientRef.current.request<T>(method, params);
  }, []);

  return { connected, error, hello, request, client: clientRef.current };
}

// Hook: fetch sessions list from real gateway
export function useRealSessions(request: <T>(m: string, p?: unknown) => Promise<T>, connected: boolean) {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const result = await request<{ sessions?: unknown[] }>('sessions.list', { activeMinutes: 60 });
      setSessions(result.sessions ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [request, connected]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { sessions, loading, refresh };
}

// Hook: fetch cron jobs from real gateway
export function useRealCronJobs(request: <T>(m: string, p?: unknown) => Promise<T>, connected: boolean) {
  const [jobs, setJobs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const result = await request<{ jobs?: unknown[] }>('cron.list', { includeDisabled: true });
      setJobs(result.jobs ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [request, connected]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { jobs, loading, refresh };
}

// Hook: fetch skills status from real gateway
export function useRealSkills(request: <T>(m: string, p?: unknown) => Promise<T>, connected: boolean) {
  const [skills, setSkills] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const result = await request<unknown>('skills.status', {});
      setSkills(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [request, connected]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { skills, loading, refresh };
}

// Hook: fetch usage/cost data from real gateway
export function useRealUsage(request: <T>(m: string, p?: unknown) => Promise<T>, connected: boolean) {
  const [usage, setUsage] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const result = await request<unknown>('sessions.usage', { startDate: today, endDate: today, limit: 100 });
      setUsage(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [request, connected]);

  useEffect(() => { if (connected) refresh(); }, [connected, refresh]);

  return { usage, loading, refresh };
}
