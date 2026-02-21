/**
 * Brain 页面 - 记忆浏览器 + 配置编辑器
 */

import { useState, useCallback } from 'react';
import SoulEditor from '../components/SoulEditor';
import SkillList from '../components/SkillList';
import type { SkillInfo } from '../components/SkillList';
import ConfigEditor from '../components/ConfigEditor';
import EmptyState from '../components/EmptyState';
import { useMemoryData } from '../hooks/useGatewayData';
import '../styles/pages.css';

type BrainTab = 'memory' | 'config' | 'skills';

const DEFAULT_SOUL = `# SOUL.md - Who You Are\n\n*You're not a chatbot. You're becoming someone.*`;

const DEFAULT_SKILLS: SkillInfo[] = [
  { id: 'weather', name: 'weather', description: '天气查询', version: '1.0.0', safetyScore: 95, source: 'clawhub', lastUpdated: new Date() },
  { id: 'coding-agent', name: 'coding-agent', description: '代码 Agent 委派', version: '1.2.0', safetyScore: 88, source: 'clawhub', lastUpdated: new Date() },
  { id: 'session-logs', name: 'session-logs', description: '会话日志搜索', version: '1.0.0', safetyScore: 92, source: 'clawhub', lastUpdated: new Date() },
  { id: 'volcengine-asr', name: 'volcengine-asr', description: '火山引擎语音识别', version: '0.1.0', safetyScore: 70, source: 'local', lastUpdated: new Date() },
  { id: 'windows-control', name: 'windows-control', description: 'Windows 远程控制', version: '0.1.0', safetyScore: 55, source: 'local', lastUpdated: new Date() },
];

export default function Brain() {
  const [activeTab, setActiveTab] = useState<BrainTab>('memory');
  const { memory, search } = useMemoryData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(memory.entries);
  const [soulContent, setSoulContent] = useState(DEFAULT_SOUL);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setSearchResults(q.trim() ? search(q) : memory.entries);
  }, [search, memory.entries]);

  const tabs: { id: BrainTab; label: string; icon: string }[] = [
    { id: 'memory', label: '记忆', icon: '🧠' },
    { id: 'config', label: '配置', icon: '⚙️' },
    { id: 'skills', label: '技能', icon: '🛡️' },
  ];

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
        {activeTab === 'memory' && (
          <div className="brain-memory">
            <div className="memory-health">
              <div className="health-ring" style={{ '--health': memory.healthPercent } as React.CSSProperties}>
                <span className="health-value">{memory.healthPercent}%</span>
              </div>
              <div className="health-stats">
                <span>{memory.totalFiles} 文件</span>
                <span>{memory.totalChunks} 块</span>
                <span>{(memory.totalSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <div className="memory-search">
              <input type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)} placeholder="搜索记忆..." className="search-input" />
            </div>
            <div className="memory-timeline">
              {searchResults.length === 0 ? (
                <EmptyState icon="📭" title="未找到记忆" description={searchQuery ? '尝试其他关键词' : 'Agent 还没有记忆文件'} />
              ) : (
                searchResults.map(entry => (
                  <div key={entry.id} className={`memory-entry ${entry.type}`}>
                    <div className="entry-icon">{entry.type === 'long-term' ? '📚' : entry.type === 'conversation' ? '💬' : '📅'}</div>
                    <div className="entry-content">
                      <div className="entry-header">
                        <span className="entry-filename">{entry.filename}</span>
                        <span className="entry-size">{(entry.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <p className="entry-summary">{entry.summary}</p>
                      <div className="entry-meta">
                        <span>{entry.chunks} 块</span>
                        <span>{entry.date.toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="brain-config">
            <SoulEditor
              soulContent={soulContent}
              memoryHealthPercent={memory.healthPercent}
              onSave={(content) => setSoulContent(content)}
            />
            <ConfigEditor />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="brain-skills">
            <SkillList skills={DEFAULT_SKILLS} />
          </div>
        )}
      </div>
    </div>
  );
}
