/**
 * Cost Tracker Service
 * 监听 Gateway WebSocket 事件流，实时累计今日成本
 */

import type { GatewayClient } from './gatewayClient';
import { calculateCostCNY, getModelPricing, formatTokens } from '../config/modelPricing';

export interface TokenEvent {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens?: number;
  sessionKey?: string;
  runId?: string;
  timestamp: number;
}

export interface DailyCostSummary {
  date: string; // YYYY-MM-DD
  totalCostCNY: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheTokens: number;
  events: TokenEvent[];
  byModel: Map<string, { inputTokens: number; outputTokens: number; costCNY: number }>;
  bySession: Map<string, { inputTokens: number; outputTokens: number; costCNY: number }>;
}

type CostUpdateCallback = (summary: DailyCostSummary) => void;

const STORAGE_KEY = 'clawflag_daily_cost';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class CostTracker {
  private summary: DailyCostSummary;
  private listeners = new Set<CostUpdateCallback>();
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.summary = this.loadOrCreate();
  }

  /** Attach to a GatewayClient and listen for token events */
  attach(client: GatewayClient): void {
    this.detach();
    this.unsubscribe = client.onEvent((event, payload) => {
      if (event === 'chat.delta' || event === 'chat.final' || event === 'chat.complete') {
        this.handleChatEvent(payload);
      }
      if (event === 'session.usage') {
        this.handleUsageEvent(payload);
      }
    });
  }

  detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Subscribe to cost updates */
  onChange(cb: CostUpdateCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  getSummary(): DailyCostSummary {
    // Reset if date changed
    if (this.summary.date !== todayKey()) {
      this.summary = this.createEmpty();
      this.persist();
    }
    return this.summary;
  }

  /** Manually add a token event (e.g. from historical data) */
  addEvent(event: TokenEvent): void {
    if (this.summary.date !== todayKey()) {
      this.summary = this.createEmpty();
    }

    const costCNY = calculateCostCNY(
      event.model,
      event.inputTokens,
      event.outputTokens,
      event.cacheTokens,
    );

    this.summary.totalInputTokens += event.inputTokens;
    this.summary.totalOutputTokens += event.outputTokens;
    this.summary.totalCacheTokens += (event.cacheTokens ?? 0);
    this.summary.totalCostCNY += costCNY;
    this.summary.events.push(event);

    // By model
    const modelKey = getModelPricing(event.model).model;
    const modelEntry = this.summary.byModel.get(modelKey) ?? { inputTokens: 0, outputTokens: 0, costCNY: 0 };
    modelEntry.inputTokens += event.inputTokens;
    modelEntry.outputTokens += event.outputTokens;
    modelEntry.costCNY += costCNY;
    this.summary.byModel.set(modelKey, modelEntry);

    // By session
    if (event.sessionKey) {
      const sessEntry = this.summary.bySession.get(event.sessionKey) ?? { inputTokens: 0, outputTokens: 0, costCNY: 0 };
      sessEntry.inputTokens += event.inputTokens;
      sessEntry.outputTokens += event.outputTokens;
      sessEntry.costCNY += costCNY;
      this.summary.bySession.set(event.sessionKey, sessEntry);
    }

    this.persist();
    this.notify();
  }

  /** Reset today's tracking */
  reset(): void {
    this.summary = this.createEmpty();
    this.persist();
    this.notify();
  }

  private handleChatEvent(payload: unknown): void {
    const p = payload as Record<string, unknown>;
    const usage = p.usage as Record<string, number> | undefined;
    if (!usage) return;
    // Only count on final events to avoid double-counting
    if (p.state !== 'final') return;

    this.addEvent({
      model: String(p.model || 'unknown'),
      inputTokens: usage.inputTokens || 0,
      outputTokens: usage.outputTokens || 0,
      cacheTokens: usage.cacheReadTokens || usage.cacheTokens || 0,
      sessionKey: String(p.sessionKey || ''),
      runId: String(p.runId || ''),
      timestamp: Date.now(),
    });
  }

  private handleUsageEvent(payload: unknown): void {
    const p = payload as Record<string, unknown>;
    if (!p.inputTokens && !p.outputTokens) return;
    this.addEvent({
      model: String(p.model || 'unknown'),
      inputTokens: Number(p.inputTokens || 0),
      outputTokens: Number(p.outputTokens || 0),
      cacheTokens: Number(p.cacheTokens || 0),
      sessionKey: String(p.sessionKey || ''),
      timestamp: Date.now(),
    });
  }

  private notify(): void {
    for (const cb of this.listeners) {
      try { cb(this.summary); } catch { /* ignore */ }
    }
  }

  private persist(): void {
    try {
      const data = {
        ...this.summary,
        byModel: Object.fromEntries(this.summary.byModel),
        bySession: Object.fromEntries(this.summary.bySession),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* quota exceeded, ignore */ }
  }

  private loadOrCreate(): DailyCostSummary {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.date === todayKey()) {
          return {
            ...data,
            byModel: new Map(Object.entries(data.byModel || {})),
            bySession: new Map(Object.entries(data.bySession || {})),
          };
        }
      }
    } catch { /* corrupted data */ }
    return this.createEmpty();
  }

  private createEmpty(): DailyCostSummary {
    return {
      date: todayKey(),
      totalCostCNY: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheTokens: 0,
      events: [],
      byModel: new Map(),
      bySession: new Map(),
    };
  }
}

// Singleton
export const costTracker = new CostTracker();

// Re-export for convenience
export { formatTokens };
