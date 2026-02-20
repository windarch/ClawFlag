import SoulEditor from '../components/SoulEditor';
import SkillList from '../components/SkillList';
import type { SkillInfo } from '../components/SkillList';
import '../styles/pages.css';

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

const mockSkills: SkillInfo[] = [
  {
    id: 'weather',
    name: 'weather',
    description: '天气查询 (wttr.in / Open-Meteo)',
    version: '1.0.0',
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
    id: 'session-logs',
    name: 'session-logs',
    description: '搜索和分析会话日志',
    version: '1.0.0',
    safetyScore: 92,
    source: 'clawhub',
    lastUpdated: new Date(Date.now() - 86400000 * 14),
  },
  {
    id: 'volcengine-asr',
    name: 'volcengine-asr',
    description: '火山引擎语音识别',
    version: '0.1.0',
    safetyScore: 65,
    source: 'local',
    lastUpdated: new Date(Date.now() - 86400000 * 30),
  },
  {
    id: 'windows-control',
    name: 'windows-control',
    description: 'Windows 远程控制',
    version: '0.2.0',
    safetyScore: 45,
    source: 'local',
    lastUpdated: new Date(Date.now() - 86400000 * 5),
  },
];

export default function Brain() {
  return (
    <div className="page brain-page">
      <h1 className="page-title">🧠 大脑</h1>
      <p className="page-subtitle">记忆与人格管理</p>

      <SoulEditor
        soulContent={mockSoulContent}
        identityName="龙虾"
        identityEmoji="🦞"
        memoryHealthPercent={82}
        onSave={(content) => {
          console.log('Save SOUL.md:', content);
        }}
      />

      <SkillList skills={mockSkills} />
    </div>
  );
}
