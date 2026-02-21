/**
 * Brain 页面 - 记忆浏览器 + 配置编辑器 (L0-L3)
 * V5: 记忆时间线、语义搜索、保真度评分环、分层配置
 */

import { useState, useCallback, useMemo } from 'react';
import SkillList from '../components/SkillList';
import type { SkillInfo } from '../components/SkillList';
import EmptyState from '../components/EmptyState';
import MemorySearch from '../components/MemorySearch';
import type { SearchResult } from '../components/MemorySearch';
import FidelityRing from '../components/FidelityRing';
import { useMemoryData } from '../hooks/useGatewayData';
import { useGatewayContext } from '../contexts/GatewayContext';
import '../styles/pages.css';

type BrainTab = 'memory' | 'config' | 'skills';
type ConfigLevel = 0 | 1 | 2 | 3;

// ============ Config Editor Data ============

interface ConfigFile {
  name: string;
  path: string;
  content: string;
  description: string;
  icon: string;
  level: ConfigLevel;
}

const MOCK_CONFIGS: ConfigFile[] = [
  { name: 'SOUL.md', path: '~/clawd/SOUL.md', level: 1, icon: '🎭',
    description: '人格定义 - Agent 的性格和行为准则',
    content: '# SOUL.md\n\n*You\'re not a chatbot. You\'re becoming someone.*\n\n## Core Truths\nBe genuinely helpful, not performatively helpful.' },
  { name: 'USER.md', path: '~/clawd/USER.md', level: 1, icon: '👤',
    description: '用户信息 - Agent 对你的了解',
    content: '# USER.md\n\n- **Name:** Raymond\n- **Timezone:** Asia/Shanghai\n- **Language:** 中文优先' },
  { name: 'AGENTS.md', path: '~/clawd/AGENTS.md', level: 2, icon: '📋',
    description: '工作规则 - 操作规范和安全边界',
    content: '# AGENTS.md\n\nThis folder is home...' },
  { name: 'TOOLS.md', path: '~/clawd/TOOLS.md', level: 2, icon: '🔧',
    description: '工具配置 - SSH、API 等本地设置',
    content: '# TOOLS.md\n\n## SSH\n...' },
  { name: 'HEARTBEAT.md', path: '~/clawd/HEARTBEAT.md', level: 2, icon: '💓',
    description: '心跳任务 - 定期自动检查清单',
    content: '# HEARTBEAT.md\n\n# Keep empty to skip.' },
  { name: 'BOOT.md', path: '~/clawd/BOOT.md', level: 3, icon: '🚀',
    description: '启动钩子 - 每次会话启动指令',
    content: '# Boot Instructions\n...' },
  { name: 'MEMORY.md', path: '~/clawd/MEMORY.md', level: 3, icon: '🧠',
    description: '长期记忆原始文件',
    content: '# MEMORY.md\n...' },
];

const LEVEL_META: Array<{ label: string; icon: string; desc: string; color: string }> = [
  { label: '概览', icon: '🏠', desc: '人格摘要 + 记忆健康度', color: '#22c55e' },
  { label: '人格', icon: '👤', desc: 'SOUL语调 + 用户信息', color: '#3b82f6' },
  { label: '高级', icon: '⚙️', desc: 'AGENTS/TOOLS 规则', color: '#eab308' },
  { label: '开发者', icon: '🔧', desc: '原始编辑器 + Git diff', color: '#a855f7' },
];

const DEFAULT_SKILLS: SkillInfo[] = [
  { id: 'weather', name: 'weather', description: '天气查询', version: '1.0.0', safetyScore: 95, source: 'clawhub', lastUpdated: new Date() },
  { id: 'coding-agent', name: 'coding-agent', description: '代码 Agent 委派', version: '1.2.0', safetyScore: 88, source: 'clawhub', lastUpdated: new Date() },
  { id: 'session-logs', name: 'session-logs', description: '会话日志搜索', version: '1.0.0', safetyScore: 92, source: 'clawhub', lastUpdated: new Date() },
  { id: 'volcengine-asr', name: 'volcengine-asr', description: '火山引擎语音识别', version: '0.1.0', safetyScore: 70, source: 'local', lastUpdated: new Date() },
  { id: 'windows-control', name: 'windows-control', description: 'Windows 远程控制', version: '0.1.0', safetyScore: 55, source: 'local', lastUpdated: new Date() },
];

// ============ Soul Summary Extraction ============

function extractSoulSummary(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('---') && !trimmed.startsWith('```')) {
      return trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed;
    }
  }
  return 'Agent 人格未配置';
}

// ============ Main Component ============

export default function Brain() {
  const [activeTab, setActiveTab] = useState<BrainTab>('memory');
  const { memory, search, expandedEntries, entryContents, toggleEntry } = useMemoryData();
  const { client } = useGatewayContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(memory.entries);
  const [configLevel, setConfigLevel] = useState<ConfigLevel>(0);
  const [editingFile, setEditingFile] = useState<ConfigFile | null>(null);
  const [editContent, setEditContent] = useState('');

  // Memory search
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setSearchResults(q.trim() ? search(q) : memory.entries);
  }, [search, memory.entries]);

  // Semantic search result click -> jump to entry
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const entry = memory.entries.find(e => e.filename === result.filename);
    if (entry) {
      toggleEntry(entry.id);
    }
  }, [memory.entries, toggleEntry]);

  // Group entries by date for timeline
  const timeline = useMemo(() => {
    const entries = searchQuery ? searchResults : memory.entries;
    const groups = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = entry.date.toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [memory.entries, searchResults, searchQuery]);

  // Config
  const visibleConfigs = MOCK_CONFIGS.filter(c => c.level <= configLevel);
  const soulConfig = MOCK_CONFIGS.find(c => c.name === 'SOUL.md');
  const soulSummary = soulConfig ? extractSoulSummary(soulConfig.content) : 'Agent 人格未配置';

  const memoryColor = memory.healthPercent >= 80 ? '#22c55e' : memory.healthPercent >= 60 ? '#eab308' : '#ef4444';

  const startEdit = (config: ConfigFile) => {
    setEditingFile(config);
    setEditContent(config.content);
  };

  const handleSaveConfig = async () => {
    if (!editingFile) return;
    // Try saving via gateway
    if (client?.connected) {
      try {
        await client.request('workspace.write', { path: editingFile.path.replace('~/', ''), content: editContent });
      } catch { /* gateway doesn't support this yet */ }
    }
    setEditingFile(null);
  };

  const tabs: { id: BrainTab; label: string; icon: string }[] = [
    { id: 'memory', label: '记忆', icon: '🧠' },
    { id: 'config', label: '配置', icon: '⚙️' },
    { id: 'skills', label: '技能', icon: '🛡️' },
  ];

  const isToday = (dateStr: string) => dateStr === new Date().toISOString().slice(0, 10);
  const isYesterday = (dateStr: string) => dateStr === new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const formatDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return '📅 今天';
    if (isYesterday(dateStr)) return '📅 昨天';
    return `📅 ${dateStr}`;
  };

  return (
    <div className="page brain-page">
      <div className="brain-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`brain-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="brain-content">
        {/* ============ MEMORY TAB ============ */}
        {activeTab === 'memory' && (
          <div className="brain-memory">
            {/* Health overview */}
            <div className="memory-health">
              <div className="health-ring" style={{ '--health': memory.healthPercent } as React.CSSProperties}>
                <span className="health-value">{memory.healthPercent}%</span>
              </div>
              <div className="health-stats">
                <span>{memory.totalFiles} 文件</span>
                <span>{memory.totalChunks} 块</span>
                <span>{(memory.totalSize / 1024).toFixed(1)} KB</span>
                {!memory.isReal && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>📡 模拟数据</span>}
              </div>
            </div>

            {/* Semantic search */}
            <MemorySearch
              onResultClick={handleSearchResultClick}
              onQueryChange={handleSearch}
            />

            {/* Timeline */}
            <div className="memory-timeline">
              {timeline.length === 0 ? (
                <EmptyState icon="📭" title="未找到记忆" description={searchQuery ? '尝试其他关键词' : 'Agent 还没有记忆文件'} />
              ) : (
                timeline.map(group => (
                  <div key={group.date} className="timeline-group">
                    <div className="timeline-date-header">
                      <span className="timeline-date">{formatDateLabel(group.date)}</span>
                      <span className="timeline-count">{group.items.length} 条</span>
                    </div>

                    {group.items.map(entry => (
                      <div key={entry.id} className="memory-entry-wrapper" style={{ position: 'relative' }}>
                        <div
                          className={`memory-entry ${entry.type}`}
                          onClick={() => toggleEntry(entry.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="entry-icon">
                            {entry.type === 'long-term' ? '📚' : entry.type === 'conversation' ? '💬' : '📅'}
                          </div>
                          <div className="entry-content">
                            <div className="entry-header">
                              <span className="entry-filename">{entry.filename}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {entry.fidelity && (
                                  <FidelityRing data={entry.fidelity} size={28} />
                                )}
                                <span className="entry-size">{(entry.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <p className="entry-summary">{entry.summary}</p>
                            <div className="entry-meta">
                              <span>{entry.chunks} 块</span>
                              <span>{entry.date.toLocaleDateString('zh-CN')}</span>
                              <span style={{ color: expandedEntries.has(entry.id) ? 'var(--color-accent)' : 'inherit' }}>
                                {expandedEntries.has(entry.id) ? '▲ 收起' : '▼ 展开'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {expandedEntries.has(entry.id) && (
                          <div className="entry-expanded">
                            <pre className="entry-full-content">
                              {entryContents.get(entry.id) || entry.content || '(点击加载内容...)'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============ CONFIG TAB (L0-L3) ============ */}
        {activeTab === 'config' && (
          <div className="brain-config">
            {/* L0: Always visible - Soul summary + Memory health */}
            <div className="config-l0">
              <div className="l0-identity">
                <span className="l0-emoji">🤖</span>
                <div className="l0-info">
                  <div className="l0-name">Agent</div>
                  <div className="l0-summary">{soulSummary}</div>
                </div>
              </div>
              <div className="l0-health">
                <div className="l0-health-label">
                  <span>记忆健康度</span>
                  <span style={{ color: memoryColor }}>{memory.healthPercent}%</span>
                </div>
                <div className="l0-health-bar">
                  <div className="l0-health-fill" style={{ width: `${memory.healthPercent}%`, background: memoryColor }} />
                </div>
              </div>
            </div>

            {/* Level selector */}
            <div className="config-level-selector">
              {LEVEL_META.map((meta, i) => (
                <button
                  key={i}
                  className={`level-btn ${configLevel >= i ? 'active' : ''} ${configLevel === i ? 'current' : ''}`}
                  onClick={() => setConfigLevel(i as ConfigLevel)}
                  style={{ '--level-color': meta.color } as React.CSSProperties}
                >
                  <span className="level-icon">{meta.icon}</span>
                  <span className="level-label">{meta.label}</span>
                </button>
              ))}
            </div>

            {/* Level description */}
            <div className="config-level-desc" style={{ borderLeftColor: LEVEL_META[configLevel].color }}>
              {LEVEL_META[configLevel].icon} {LEVEL_META[configLevel].desc}
            </div>

            {/* Config files for current level */}
            {configLevel >= 1 && (
              <div className="config-files">
                {visibleConfigs.map(config => (
                  <div
                    key={config.path}
                    className="config-file-card"
                    onClick={() => startEdit(config)}
                  >
                    <div className="config-file-header">
                      <span className="config-file-icon">{config.icon}</span>
                      <div className="config-file-info">
                        <div className="config-file-name">{config.name}</div>
                        <div className="config-file-desc">{config.description}</div>
                      </div>
                      <span className="config-file-level" style={{ color: LEVEL_META[config.level].color }}>
                        L{config.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* L3: Git diff placeholder */}
            {configLevel === 3 && (
              <div className="config-git-diff">
                <div className="git-diff-header">
                  <span>🔀 Git Diff</span>
                  <span className="git-diff-status">clean</span>
                </div>
                <pre className="git-diff-content">
                  No uncommitted changes in workspace files.
                </pre>
              </div>
            )}

            {/* Editor modal */}
            {editingFile && (
              <div className="config-editor-modal">
                <div className="editor-modal-header">
                  <div>
                    <div className="editor-modal-title">{editingFile.icon} {editingFile.name}</div>
                    <div className="editor-modal-path">{editingFile.path}</div>
                  </div>
                  <div className="editor-modal-actions">
                    <button className="btn btn-primary btn-small" onClick={handleSaveConfig}>💾 保存</button>
                    <button className="btn btn-small" onClick={() => setEditingFile(null)}>取消</button>
                  </div>
                </div>
                <textarea
                  className="editor-modal-textarea"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* ============ SKILLS TAB ============ */}
        {activeTab === 'skills' && (
          <div className="brain-skills">
            <SkillList skills={DEFAULT_SKILLS} />
          </div>
        )}
      </div>
    </div>
  );
}
