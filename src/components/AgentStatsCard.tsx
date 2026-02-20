import { useRef } from 'react';
import './AgentStatsCard.css';

export interface AgentStats {
  agentName: string;
  agentEmoji: string;
  periodLabel: string;
  tasksCompleted: number;
  totalCost: string;
  primaryModel: string;
  totalTokens: string;
  uptime: string;
  topSkills: string[];
}

interface AgentStatsCardProps {
  stats: AgentStats;
}

export default function AgentStatsCard({ stats }: AgentStatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${stats.agentName} Agent 统计`,
          text: `${stats.agentEmoji} ${stats.agentName} | ${stats.tasksCompleted} 个任务 | ${stats.totalCost} | 主力模型: ${stats.primaryModel}\n\n由 ClawFlag 生成 — clawflag.com`,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div className="stats-card-wrapper">
      <div className="stats-card" ref={cardRef}>
        {/* 头部 */}
        <div className="stats-header">
          <span className="stats-emoji">{stats.agentEmoji}</span>
          <div className="stats-header-text">
            <div className="stats-agent-name">{stats.agentName}</div>
            <div className="stats-period">{stats.periodLabel}</div>
          </div>
        </div>

        {/* 核心数字网格 */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{stats.tasksCompleted}</div>
            <div className="stat-label">任务完成</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.totalCost}</div>
            <div className="stat-label">总花费</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.totalTokens}</div>
            <div className="stat-label">Token 消耗</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.uptime}</div>
            <div className="stat-label">运行时间</div>
          </div>
        </div>

        {/* 主力模型 */}
        <div className="stats-model">
          <span className="model-label">主力模型</span>
          <span className="model-name">{stats.primaryModel}</span>
        </div>

        {/* 常用技能 */}
        {stats.topSkills.length > 0 && (
          <div className="stats-skills">
            {stats.topSkills.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            ))}
          </div>
        )}

        {/* 水印 */}
        <div className="stats-watermark">
          🚩 clawflag.com
        </div>
      </div>

      {/* 分享按钮 */}
      <button className="share-btn" onClick={handleShare}>
        📤 分享统计卡片
      </button>
    </div>
  );
}
