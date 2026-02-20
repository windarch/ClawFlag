import { useState } from 'react';
import './CostAdvisor.css';

export interface CostAdvice {
  id: string;
  title: string;
  description: string;
  savings: string;
  actionLabel: string;
  applied?: boolean;
}

interface CostAdvisorProps {
  advices: CostAdvice[];
  onApply?: (id: string) => void;
}

export default function CostAdvisor({ advices, onApply }: CostAdvisorProps) {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  if (advices.length === 0) return null;

  const handleApply = (id: string) => {
    setAppliedIds(prev => new Set([...prev, id]));
    onApply?.(id);
  };

  return (
    <div className="cost-advisor">
      <div className="advisor-header">
        <span className="advisor-icon">💡</span>
        <span className="advisor-title">成本顾问</span>
        <span className="advisor-badge">{advices.length} 条建议</span>
      </div>

      <div className="advice-list">
        {advices.map(advice => {
          const isApplied = appliedIds.has(advice.id) || advice.applied;
          return (
            <div key={advice.id} className={`advice-card ${isApplied ? 'applied' : ''}`}>
              <div className="advice-content">
                <div className="advice-title">{advice.title}</div>
                <div className="advice-desc">{advice.description}</div>
                <div className="advice-savings">
                  <span className="savings-icon">💰</span>
                  预计节省 {advice.savings}
                </div>
              </div>
              <button
                className={`advice-btn ${isApplied ? 'btn-applied' : ''}`}
                onClick={() => handleApply(advice.id)}
                disabled={isApplied}
              >
                {isApplied ? '✓ 已应用' : advice.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
