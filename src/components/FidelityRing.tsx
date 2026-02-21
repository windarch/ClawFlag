/**
 * 记忆保真度评分环
 * 环形指示器显示记忆保真度分数
 * 绿(>80%) / 黄(60-80%) / 红(<60%)
 */

import { useState } from 'react';
import './FidelityRing.css';

export interface FidelityData {
  score: number; // 0-100
  retained: string[];   // 保留的实体
  lost: string[];       // 丢失的实体
  totalEntities: number;
  compressedAt?: Date;
}

interface FidelityRingProps {
  data: FidelityData;
  size?: number;
}

export default function FidelityRing({ data, size = 36 }: FidelityRingProps) {
  const [showDetail, setShowDetail] = useState(false);

  const { score } = data;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  const label = score >= 80 ? '优' : score >= 60 ? '中' : '低';

  // SVG ring params
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <>
      <div
        className="fidelity-ring"
        onClick={(e) => { e.stopPropagation(); setShowDetail(!showDetail); }}
        title={`保真度: ${score}%`}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <span className="fidelity-label" style={{ color, fontSize: size * 0.28 }}>
          {label}
        </span>
      </div>

      {showDetail && (
        <div className="fidelity-detail" onClick={(e) => e.stopPropagation()}>
          <div className="fidelity-detail-header">
            <span className="fidelity-score" style={{ color }}>{score}%</span>
            <span className="fidelity-title">记忆保真度</span>
            <button className="fidelity-close" onClick={() => setShowDetail(false)}>✕</button>
          </div>

          <div className="fidelity-bar">
            <div className="fidelity-bar-fill" style={{ width: `${score}%`, background: color }} />
          </div>

          <div className="fidelity-stats">
            <span>总实体: {data.totalEntities}</span>
            <span style={{ color: '#22c55e' }}>保留: {data.retained.length}</span>
            <span style={{ color: '#ef4444' }}>丢失: {data.lost.length}</span>
          </div>

          {data.retained.length > 0 && (
            <div className="fidelity-section">
              <div className="fidelity-section-title">✅ 保留的实体</div>
              <div className="fidelity-tags">
                {data.retained.map((e, i) => (
                  <span key={i} className="fidelity-tag retained">{e}</span>
                ))}
              </div>
            </div>
          )}

          {data.lost.length > 0 && (
            <div className="fidelity-section">
              <div className="fidelity-section-title">❌ 丢失的实体</div>
              <div className="fidelity-tags">
                {data.lost.map((e, i) => (
                  <span key={i} className="fidelity-tag lost">{e}</span>
                ))}
              </div>
            </div>
          )}

          {data.compressedAt && (
            <div className="fidelity-footer">
              压缩于 {data.compressedAt.toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      )}
    </>
  );
}
