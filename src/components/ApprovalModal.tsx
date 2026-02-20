import './ApprovalModal.css';

export interface ApprovalRequest {
  id: string;
  action: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeoutMs?: number;
  details?: string;
}

interface ApprovalModalProps {
  request: ApprovalRequest | null;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const riskConfig = {
  low: { color: '#22c55e', label: '低风险', icon: 'ℹ️' },
  medium: { color: '#eab308', label: '中等风险', icon: '⚠️' },
  high: { color: '#ef4444', label: '高风险', icon: '🚨' },
};

export default function ApprovalModal({ request, onApprove, onReject }: ApprovalModalProps) {
  if (!request) return null;

  const risk = riskConfig[request.riskLevel];

  return (
    <div className="approval-overlay" onClick={() => onReject?.(request.id)}>
      <div className="approval-modal" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="approval-header">
          <span className="approval-icon">{risk.icon}</span>
          <div>
            <div className="approval-title">需要你的批准</div>
            <div className="approval-risk" style={{ color: risk.color }}>
              {risk.label}
            </div>
          </div>
        </div>

        {/* 操作描述 */}
        <div className="approval-body">
          <div className="approval-action">{request.action}</div>
          <div className="approval-desc">{request.description}</div>
          {request.details && (
            <pre className="approval-details">{request.details}</pre>
          )}
        </div>

        {/* 按钮 */}
        <div className="approval-buttons">
          <button
            className="btn-reject"
            onClick={() => onReject?.(request.id)}
          >
            ✕ 拒绝
          </button>
          <button
            className={`btn-approve risk-${request.riskLevel}`}
            onClick={() => onApprove?.(request.id)}
          >
            ✓ 批准
          </button>
        </div>
      </div>
    </div>
  );
}
