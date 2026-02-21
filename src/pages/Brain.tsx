import { useState, useCallback } from 'react';
import SoulEditor from '../components/SoulEditor';
import SkillList from '../components/SkillList';
import type { SkillInfo } from '../components/SkillList';
import SkillShield from '../components/SkillShield';
import ConfigEditor from '../components/ConfigEditor';
import { useMemoryData } from '../hooks/useGatewayData';
import type { MemoryEntry } from '../hooks/useGatewayData';
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
  { id: 'weather', name: 'weather', description: '天气查询 (wttr.in / Open-Meteo)', version: '1.0.0', safetyScore: 95, source: 'clawhub', lastUpdated: new Date(Date.now() - 86400000 * 3) },
  { id: 'coding-agent', name: 'coding-agent', description: '委派编码任务给 Codex/Claude Code', version: '2.1.0', safetyScore: 88, source: 'clawhub', lastUpdated: new Date(Date.now() - 86400000 * 7) },
  { id: 'session-logs', name: 'session-logs', description: '搜索和分析会话日志', version: '1.0.0', safetyScore: 92, source: 'clawhub', lastUpdated: new Date(Date.now() - 86400000 * 14) },
  { id: 'volcengine-asr', name: 'volcengine-asr', description: '火山引擎语音识别', version: '0.1.0', safetyScore: 65, source: 'local', lastUpdated: new Date(Date.now() - 86400000 * 30) },
  { id: 'windows-control', name: 'windows-control', description: 'Windows 远程控制', version: '0.2.0', safetyScore: 45, source: 'local', lastUpdated: new Date(Date.now() - 86400000 * 5) },
];

// Memory Fidelity Ring (SVG)
function FidelityRing({ percent, size = 120 }: { percent: number; size?: number }) {
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);
  const color = percent > 80 ? 'var(--color-status-online)' : percent > 50 ? 'var(--color-status-warning)' : 'var(--color-status-error)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ marginTop: -size / 2 - 12, textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{percent}%</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>记忆保真度</div>
      </div>
      <div style={{ height: size / 2 - 12 }} />
    </div>
  );
}

// Memory Stats
function MemoryStats({ totalFiles, totalChunks, totalSize }: {
  totalFiles: number; totalChunks: number; totalSize: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
      {[
        { label: '文件', value: `${totalFiles}` },
        { label: '分块', value: `${totalChunks}` },
        { label: '大小', value: `${(totalSize / 1024).toFixed(1)}KB` },
      ].map(s => (
        <div key={s.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.value}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// Memory Timeline
function MemoryTimeline({ entries }: { entries: MemoryEntry[] }) {
  const typeEmoji = { daily: '📝', 'long-term': '🧠', conversation: '💬' };
  const typeLabel = { daily: '日记', 'long-term': '长期', conversation: '对话' };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>📅 记忆时间线</h3>
      {entries.map((entry, i) => (
        <div key={entry.id} style={{
          display: 'flex', gap: '0.75rem', padding: '0.6rem 0',
          borderBottom: i < entries.length - 1 ? '1px solid var(--color-divider)' : 'none',
        }}>
          {/* Timeline dot + line */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: i === 0 ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
            }} />
            {i < entries.length - 1 && (
              <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 }} />
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {entry.filename}
              </span>
              <span style={{
                fontSize: '0.65rem', padding: '1px 6px', borderRadius: 6,
                background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)',
              }}>
                {typeEmoji[entry.type]} {typeLabel[entry.type]}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {entry.summary}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {entry.date.toLocaleDateString('zh-CN')} · {entry.chunks} 块 · {(entry.size / 1024).toFixed(1)}KB
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Semantic Search
function MemorySearch({ onSearch, results }: {
  onSearch: (q: string) => void;
  results: MemoryEntry[];
}) {
  const [query, setQuery] = useState('');

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>🔍 语义搜索</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && query.trim() && onSearch(query.trim())}
          placeholder="搜索记忆..."
          style={{
            flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)',
            color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none',
          }}
        />
        <button
          onClick={() => query.trim() && onSearch(query.trim())}
          style={{
            padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
            background: 'var(--color-accent)', color: 'white', fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          搜索
        </button>
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          {results.map(r => (
            <div key={r.id} style={{
              padding: '0.5rem 0', borderBottom: '1px solid var(--color-divider)',
              fontSize: '0.8rem',
            }}>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{r.filename}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>{r.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Brain() {
  const { memory, search } = useMemoryData();
  const [searchResults, setSearchResults] = useState<MemoryEntry[]>([]);

  const handleSearch = useCallback((q: string) => {
    setSearchResults(search(q));
  }, [search]);

  return (
    <div className="page brain-page">
      <h1 className="page-title">🧠 大脑</h1>
      <p className="page-subtitle">记忆与人格管理</p>

      {/* Memory Health */}
      <div className="card" style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <FidelityRing percent={memory.healthPercent} />
        <MemoryStats
          totalFiles={memory.totalFiles}
          totalChunks={memory.totalChunks}
          totalSize={memory.totalSize}
        />
      </div>

      <MemorySearch onSearch={handleSearch} results={searchResults} />

      <MemoryTimeline entries={memory.entries} />

      <ConfigEditor />

      <SoulEditor
        soulContent={mockSoulContent}
        identityName="龙虾"
        identityEmoji="🦞"
        memoryHealthPercent={memory.healthPercent}
        onSave={(content) => console.log('Save SOUL.md:', content)}
      />

      <SkillList skills={mockSkills} />

      <SkillShield />
    </div>
  );
}
