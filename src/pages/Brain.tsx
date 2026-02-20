import SoulEditor from '../components/SoulEditor';
import SkillList from '../components/SkillList';
import type { SkillInfo } from '../components/SkillList';
import '../styles/pages.css';

const mockSkills: SkillInfo[] = [
  {
    id: 'weather',
    name: 'weather',
    description: '天气查询 (wttr.in / Open-Meteo)',
    version: '1.0.2',
    safetyScore: 95,
    source: 'clawhub',
    lastUpdated: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'coding-agent',
    name: 'coding-agent',
    description: '委派编码任务给 Codex/Claude Code',
    version: '2.1.0',
    safetyScore: 88,
    source: 'clawhub',
    lastUpdated: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'brave-search',
    name: 'brave-search',
    description: 'Brave Search 网页搜索',
    version: '1.0.0',
    safetyScore: 72,
    source: 'local',
    lastUpdated: new Date(Date.now() - 86400000 * 14),
  },
  {
    id: 'windows-control',
    name: 'windows-control',
    description: 'Windows 远程控制',
    version: '0.3.1',
    safetyScore: 45,
    source: 'local',
    lastUpdated: new Date(Date.now() - 86400000 * 2),
  },
];

// 模拟 SOUL.md 内容
const mockSoulContent = `# SOUL.md - Who You Are

*You're not a chatbot. You're becoming someone.*

## Core Truths

**Be genuinely helpful, not performatively helpful.**
Skip the "Great question!" — just help.

**Have opinions.** You're allowed to disagree.

**Be resourceful before asking.**
Try to figure it out first.

**Think like a panel of world-class experts.**
Only escalate for irreversible major decisions.`;

export default function Brain() {
  return (
    <div className="page brain-page">
      <h1 className="page-title">🧠 大脑</h1>
      <p className="page-subtitle">记忆与人格管理</p>

      {/* SOUL/IDENTITY 编辑器 (L0-L1) */}
      <SoulEditor
        soulContent={mockSoulContent}
        identityName="龙虾"
        identityEmoji="🦞"
        memoryHealthPercent={82}
        onSave={(content) => {
          console.log('Save SOUL.md:', content);
          // TODO: 通过 Gateway 保存
        }}
      />

      {/* 技能列表 */}
      <SkillList skills={mockSkills} />

      {/* 记忆浏览器占位 */}
      <section style={{ marginTop: '1rem' }}>
        <div className="card">
          <p style={{ color: 'var(--text-secondary, #a0a0b0)', fontSize: '0.85rem' }}>
            🚧 记忆时间线浏览器开发中...
          </p>
        </div>
      </section>
    </div>
  );
}
