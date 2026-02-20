import { useState } from 'react';
import './SkillList.css';

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  safetyScore: number; // 0-100
  source: 'clawhub' | 'local' | 'unknown';
  lastUpdated: Date;
}

interface SkillListProps {
  skills: SkillInfo[];
}

function getSafetyColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function getSafetyLabel(score: number): string {
  if (score >= 80) return '安全';
  if (score >= 50) return '注意';
  return '风险';
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function SkillList({ skills }: SkillListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const avgScore = skills.length > 0
    ? Math.round(skills.reduce((sum, s) => sum + s.safetyScore, 0) / skills.length)
    : 0;

  return (
    <div className="skill-list">
      <div className="skill-header">
        <div className="skill-header-left">
          <span className="skill-header-icon">🧩</span>
          <span className="skill-header-title">已安装技能</span>
          <span className="skill-count">{skills.length}</span>
        </div>
        <div className="skill-avg-score" style={{ color: getSafetyColor(avgScore) }}>
          平均 {avgScore}分
        </div>
      </div>

      <div className="skills">
        {skills.map(skill => {
          const isExpanded = expandedId === skill.id;
          const color = getSafetyColor(skill.safetyScore);
          return (
            <div
              key={skill.id}
              className={`skill-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : skill.id)}
            >
              <div className="skill-main">
                <div className="skill-info">
                  <div className="skill-name">{skill.name}</div>
                  <div className="skill-desc">{skill.description}</div>
                </div>
                <div className="skill-score-ring" style={{ borderColor: color }}>
                  <span style={{ color }}>{skill.safetyScore}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="skill-detail">
                  <div className="detail-row">
                    <span className="detail-label">版本</span>
                    <span className="detail-value">{skill.version}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">来源</span>
                    <span className="detail-value">{skill.source === 'clawhub' ? 'ClawHub' : skill.source === 'local' ? '本地' : '未知'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">安全评分</span>
                    <span className="detail-value" style={{ color }}>{getSafetyLabel(skill.safetyScore)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">更新日期</span>
                    <span className="detail-value">{formatDate(skill.lastUpdated)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
