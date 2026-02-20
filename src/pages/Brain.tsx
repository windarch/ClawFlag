import SoulEditor from '../components/SoulEditor';
import '../styles/pages.css';

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
