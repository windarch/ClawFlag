/**
 * 分层配置编辑器 (L0-L3)
 * L0: 一句话人格摘要 + 记忆健康度 (always visible)
 * L1: 人格面板 SOUL + IDENTITY (tap)
 * L2: AGENTS.md / TOOLS.md / HEARTBEAT.md (long-press / advanced)
 * L3: 原始 Markdown 编辑器 + Git diff (developer mode)
 */

import { useState } from 'react';

interface ConfigFile {
  name: string;
  path: string;
  content: string;
  description: string;
  level: 0 | 1 | 2 | 3;
}

const MOCK_CONFIGS: ConfigFile[] = [
  {
    name: 'SOUL.md', path: '~/clawd/SOUL.md', level: 1,
    description: '人格定义 - 你的 Agent 的性格和行为准则',
    content: '# SOUL.md - Who You Are\n\n*You\'re not a chatbot. You\'re becoming someone.*\n\n## Core Truths\n\n**Be genuinely helpful, not performatively helpful.**\n...',
  },
  {
    name: 'IDENTITY.md', path: '~/clawd/IDENTITY.md', level: 1,
    description: '身份信息 - 名字、头像、个性特征',
    content: '# IDENTITY.md\n\n- **Name:** 龙虾 (Lobster)\n- **Emoji:** 🦞\n- **Vibe:** 实干、直接、偶尔幽默',
  },
  {
    name: 'USER.md', path: '~/clawd/USER.md', level: 1,
    description: '用户信息 - Agent 对你的了解',
    content: '# USER.md\n\n- **Name:** Raymond\n- **Timezone:** Asia/Shanghai\n- **Notes:** 偏好中文交流',
  },
  {
    name: 'AGENTS.md', path: '~/clawd/AGENTS.md', level: 2,
    description: '工作规则 - Agent 的操作规范和安全边界',
    content: '# AGENTS.md - Your Workspace\n\nThis folder is home. Treat it that way.\n\n## Every Session\n1. Read SOUL.md\n2. Read USER.md\n3. Read memory/YYYY-MM-DD.md\n...',
  },
  {
    name: 'TOOLS.md', path: '~/clawd/TOOLS.md', level: 2,
    description: '工具配置 - SSH、API 密钥等本地设置',
    content: '# TOOLS.md - Local Notes\n\n## SSH\n### 火山云服务器\n- Host: 14.103.222.87\n...',
  },
  {
    name: 'HEARTBEAT.md', path: '~/clawd/HEARTBEAT.md', level: 2,
    description: '心跳任务 - 定期自动执行的检查清单',
    content: '# HEARTBEAT.md\n\n# Keep this file empty to skip heartbeat API calls.',
  },
  {
    name: 'BOOT.md', path: '~/clawd/BOOT.md', level: 3,
    description: '启动钩子 - 每次会话启动时执行的指令',
    content: '# Boot Instructions\n\n## 永久指令\n...',
  },
];

const LEVEL_LABELS = ['🏠 概览', '👤 人格', '⚙️ 高级', '🔧 开发者'];
const LEVEL_COLORS = [
  'var(--color-status-online)',
  'var(--color-status-info)',
  'var(--color-status-warning)',
  'var(--color-accent)',
];

export default function ConfigEditor() {
  const [configs] = useState<ConfigFile[]>(MOCK_CONFIGS);
  const [activeLevel, setActiveLevel] = useState(1);
  const [editingFile, setEditingFile] = useState<ConfigFile | null>(null);
  const [editContent, setEditContent] = useState('');

  const visibleConfigs = configs.filter(c => c.level <= activeLevel);

  const startEdit = (config: ConfigFile) => {
    setEditingFile(config);
    setEditContent(config.content);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        📝 配置编辑器
      </h2>

      {/* Level selector */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '0.75rem',
        background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '3px',
      }}>
        {LEVEL_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveLevel(i)}
            style={{
              flex: 1, padding: '6px 4px', borderRadius: 6, border: 'none',
              background: activeLevel === i ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeLevel === i ? LEVEL_COLORS[i] : 'var(--color-text-muted)',
              fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* File list */}
      {visibleConfigs.map(config => (
        <div
          key={config.path}
          className="card"
          style={{ marginBottom: '0.5rem', padding: '0.75rem', cursor: 'pointer' }}
          onClick={() => startEdit(config)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {config.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {config.description}
              </div>
            </div>
            <span style={{
              fontSize: '0.6rem', padding: '1px 6px', borderRadius: 4,
              background: `${LEVEL_COLORS[config.level]}20`, color: LEVEL_COLORS[config.level],
            }}>
              L{config.level}
            </span>
          </div>
        </div>
      ))}

      {/* Editor modal */}
      {editingFile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem 1rem', background: 'var(--color-bg-primary)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {editingFile.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                {editingFile.path}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  console.log('Save:', editingFile.path, editContent);
                  setEditingFile(null);
                }}
                style={{
                  background: 'var(--color-accent)', border: 'none', borderRadius: 6,
                  padding: '6px 12px', color: 'white', fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                💾 保存
              </button>
              <button
                onClick={() => setEditingFile(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6,
                  padding: '6px 12px', color: 'var(--color-text-secondary)', fontSize: '0.75rem', cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>

          {/* Editor */}
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            style={{
              flex: 1, padding: '0.75rem', margin: 0, border: 'none',
              background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
              fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6,
              resize: 'none', outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}
