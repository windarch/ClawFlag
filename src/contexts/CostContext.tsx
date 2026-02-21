/**
 * Cost Context
 * 提供实时成本数据给整个应用
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { costTracker, type DailyCostSummary } from '../services/costTracker';
import { useGatewayContext } from './GatewayContext';

export type FuseLevel = 'normal' | 'warning' | 'degraded' | 'tripped';

interface CostContextValue {
  summary: DailyCostSummary;
  dailyBudget: number;
  setDailyBudget: (v: number) => void;
  fuseLevel: FuseLevel;
  fusePercent: number;
  fuseTripped: boolean;
  resetFuse: () => void;
  /** Manually acknowledged the fuse trip */
  fuseAcknowledged: boolean;
  acknowledgeFuse: () => void;
}

const CostContext = createContext<CostContextValue | null>(null);

const BUDGET_STORAGE_KEY = 'clawflag_daily_budget';

export function CostProvider({ children }: { children: ReactNode }) {
  const { client, connected } = useGatewayContext();
  const [summary, setSummary] = useState<DailyCostSummary>(costTracker.getSummary());
  const [dailyBudget, setDailyBudgetState] = useState(() => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    return stored ? Number(stored) : 50;
  });
  const [fuseAcknowledged, setFuseAcknowledged] = useState(false);

  // Attach tracker to gateway client
  useEffect(() => {
    if (client && connected) {
      costTracker.attach(client);
    }
    return () => costTracker.detach();
  }, [client, connected]);

  // Subscribe to cost updates
  useEffect(() => {
    return costTracker.onChange(setSummary);
  }, []);

  const setDailyBudget = useCallback((v: number) => {
    setDailyBudgetState(v);
    localStorage.setItem(BUDGET_STORAGE_KEY, String(v));
  }, []);

  const fusePercent = dailyBudget > 0 ? (summary.totalCostCNY / dailyBudget) * 100 : 0;
  const fuseLevel: FuseLevel =
    fusePercent >= 100 ? 'tripped' :
    fusePercent >= 90 ? 'degraded' :
    fusePercent >= 70 ? 'warning' :
    'normal';
  const fuseTripped = fuseLevel === 'tripped';

  const resetFuse = useCallback(() => {
    costTracker.reset();
    setSummary(costTracker.getSummary());
    setFuseAcknowledged(false);
  }, []);

  const acknowledgeFuse = useCallback(() => {
    setFuseAcknowledged(true);
  }, []);

  return (
    <CostContext.Provider value={{
      summary, dailyBudget, setDailyBudget,
      fuseLevel, fusePercent, fuseTripped,
      resetFuse, fuseAcknowledged, acknowledgeFuse,
    }}>
      {children}
    </CostContext.Provider>
  );
}

export function useCostContext(): CostContextValue {
  const ctx = useContext(CostContext);
  if (!ctx) throw new Error('useCostContext must be used within CostProvider');
  return ctx;
}
