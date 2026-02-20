import { useState } from 'react';
import './BudgetSettings.css';

export interface BudgetData {
  dailyBudget: number;
  monthlyBudget: number;
  todaySpent: number;
  monthSpent: number;
  last7Days: { date: string; amount: number }[];
}

interface BudgetSettingsProps {
  data: BudgetData;
  onDailyBudgetChange?: (value: number) => void;
  onMonthlyBudgetChange?: (value: number) => void;
}

export default function BudgetSettings({ data, onDailyBudgetChange, onMonthlyBudgetChange }: BudgetSettingsProps) {
  const [dailyBudget, setDailyBudget] = useState(data.dailyBudget);
  const [monthlyBudget, setMonthlyBudget] = useState(data.monthlyBudget);
  const [editingDaily, setEditingDaily] = useState(false);
  const [editingMonthly, setEditingMonthly] = useState(false);

  const dailyPercent = Math.min((data.todaySpent / dailyBudget) * 100, 100);
  const monthlyPercent = Math.min((data.monthSpent / monthlyBudget) * 100, 100);
  const maxBar = Math.max(...data.last7Days.map(d => d.amount), 1);

  const getBarColor = (pct: number) =>
    pct >= 90 ? 'var(--color-status-error)' :
    pct >= 70 ? 'var(--color-status-warning)' :
    'var(--color-status-online)';

  return (
    <section className="budget-settings">
      <h2 className="section-title">💰 预算设置</h2>

      {/* Daily Budget */}
      <div className="budget-card">
        <div className="budget-header">
          <span className="budget-label">每日预算</span>
          {editingDaily ? (
            <div className="budget-edit">
              <input
                type="number"
                value={dailyBudget}
                onChange={e => setDailyBudget(Number(e.target.value))}
                min={1}
                max={1000}
              />
              <button onClick={() => { onDailyBudgetChange?.(dailyBudget); setEditingDaily(false); }}>✓</button>
            </div>
          ) : (
            <span className="budget-value" onClick={() => setEditingDaily(true)}>
              ¥{dailyBudget} <span className="edit-hint">✏️</span>
            </span>
          )}
        </div>
        <div className="budget-bar">
          <div
            className="budget-bar-fill"
            style={{ width: `${dailyPercent}%`, background: getBarColor(dailyPercent) }}
          />
        </div>
        <div className="budget-stats">
          <span>已用 ¥{data.todaySpent.toFixed(2)}</span>
          <span>剩余 ¥{Math.max(dailyBudget - data.todaySpent, 0).toFixed(2)}</span>
        </div>
        <input
          type="range"
          className="budget-slider"
          min={5}
          max={500}
          value={dailyBudget}
          onChange={e => {
            setDailyBudget(Number(e.target.value));
            onDailyBudgetChange?.(Number(e.target.value));
          }}
        />
      </div>

      {/* Monthly Budget */}
      <div className="budget-card">
        <div className="budget-header">
          <span className="budget-label">每月预算</span>
          {editingMonthly ? (
            <div className="budget-edit">
              <input
                type="number"
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(Number(e.target.value))}
                min={10}
                max={50000}
              />
              <button onClick={() => { onMonthlyBudgetChange?.(monthlyBudget); setEditingMonthly(false); }}>✓</button>
            </div>
          ) : (
            <span className="budget-value" onClick={() => setEditingMonthly(true)}>
              ¥{monthlyBudget} <span className="edit-hint">✏️</span>
            </span>
          )}
        </div>
        <div className="budget-bar">
          <div
            className="budget-bar-fill"
            style={{ width: `${monthlyPercent}%`, background: getBarColor(monthlyPercent) }}
          />
        </div>
        <div className="budget-stats">
          <span>已用 ¥{data.monthSpent.toFixed(2)}</span>
          <span>剩余 ¥{Math.max(monthlyBudget - data.monthSpent, 0).toFixed(2)}</span>
        </div>
      </div>

      {/* 7-Day History Chart */}
      <div className="budget-chart">
        <h3 className="subsection-title">📊 7天成本趋势</h3>
        <div className="chart-bars">
          {data.last7Days.map((day, i) => (
            <div key={i} className="chart-bar-col">
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{
                    height: `${(day.amount / maxBar) * 100}%`,
                    background: day.amount > dailyBudget
                      ? 'var(--color-status-error)'
                      : 'var(--color-accent)',
                  }}
                />
              </div>
              <span className="chart-bar-amount">¥{day.amount.toFixed(0)}</span>
              <span className="chart-bar-label">{day.date}</span>
            </div>
          ))}
        </div>
        {dailyBudget > 0 && (
          <div
            className="chart-budget-line"
            style={{ bottom: `${(dailyBudget / maxBar) * 100}%` }}
          />
        )}
      </div>
    </section>
  );
}
