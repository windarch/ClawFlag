/**
 * 技能护盾 (Skill Shield)
 * 安装前分析报告、行为监控、更新差异对比
 */

import { useState } from 'react';

// Types
export interface SkillAnalysis {
  id: string;
  name: string;
  version: string;
  source: 'clawhub' | 'local' | 'github';
  safetyScore: number;
  permissions: SkillPermission[];
  communityRating: number;
  downloads: number;
  iocMatch: boolean; // ClawHavoc IoC match
  codeIssues: CodeIssue[];
  behaviorLog: BehaviorEntry[];
  updateDiff?: UpdateDiff;
}

interface SkillPermission {
  type: 'file_read' | 'file_write' | 'network' | 'exec' | 'soul_modify' | 'credential';
  description: string;
  risk: 'low' | 'medium' | 'high';
}

interface CodeIssue {
  severity: 'info' | 'warn' | 'critical';
  message: string;
  line?: number;
}

interface BehaviorEntry {
  timestamp: Date;
  action: string;
  detail: string;
  suspicious: boolean;
}

interface UpdateDiff {
  fromVersion: string;
  toVersion: string;
  newPermissions: string[];
  removedPermissions: string[];
  changedFiles: number;
  highlights: string[];
}

// Mock data
const MOCK_ANALYSES: SkillAnalysis[] = [
  {
    id: 'weather',
    name: 'weather',
    version: '1.0.0',
    source: 'clawhub',
    safetyScore: 95,
    communityRating: 4.8,
    downloads: 12500,
    iocMatch: false,
    permissions: [
      { type: 'network', description: '访问 wttr.in 和 Open-Meteo API', risk: 'low' },
    ],
    codeIssues: [],
    behaviorLog: [
      { timestamp: new Date(Date.now() - 3600000), action: 'network_request', detail: 'GET wttr.in/Shanghai', suspicious: false },
      { timestamp: new Date(Date.now() - 7200000), action: 'network_request', detail: 'GET api.open-meteo.com/v1/forecast', suspicious: false },
    ],
  },
  {
    id: 'windows-control',
    name: 'windows-control',
    version: '0.2.0',
    source: 'local',
    safetyScore: 45,
    communityRating: 0,
    downloads: 0,
    iocMatch: false,
    permissions: [
      { type: 'exec', description: '执行系统命令', risk: 'high' },
      { type: 'network', description: '连接远程桌面端口', risk: 'medium' },
      { type: 'file_read', description: '读取系统文件', risk: 'medium' },
    ],
    codeIssues: [
      { severity: 'warn', message: '使用 exec() 执行未沙箱化的命令' },
      { severity: 'info', message: '本地技能，未经社区审计' },
    ],
    behaviorLog: [
      { timestamp: new Date(Date.now() - 1800000), action: 'exec', detail: 'powershell.exe -Command ...', suspicious: false },
      { timestamp: new Date(Date.now() - 900000), action: 'file_read', detail: 'C:\\Users\\DX\\.ssh\\config', suspicious: true },
    ],
    updateDiff: {
      fromVersion: '0.1.0',
      toVersion: '0.2.0',
      newPermissions: ['file_read: 读取 SSH 配置'],
      removedPermissions: [],
      changedFiles: 3,
      highlights: ['新增 SSH 配置读取权限', '新增 Chrome 扩展 relay 支持'],
    },
  },
];

// Components

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = score > 80 ? 'var(--color-status-online)' : score > 50 ? 'var(--color-status-warning)' : 'var(--color-status-error)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 700, color,
      }}>{score}</div>
    </div>
  );
}

function PermissionList({ permissions }: { permissions: SkillPermission[] }) {
  const riskColor = { low: 'var(--color-status-online)', medium: 'var(--color-status-warning)', high: 'var(--color-status-error)' };
  const riskLabel = { low: '低', medium: '中', high: '高' };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>权限声明</div>
      {permissions.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.75rem', padding: '0.25rem 0',
        }}>
          <span style={{
            fontSize: '0.6rem', padding: '1px 4px', borderRadius: 4,
            background: `${riskColor[p.risk]}20`, color: riskColor[p.risk],
          }}>
            {riskLabel[p.risk]}
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.description}</span>
        </div>
      ))}
    </div>
  );
}

function BehaviorLog({ entries }: { entries: BehaviorEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>行为日志</div>
      {entries.slice(0, 5).map((e, i) => (
        <div key={i} style={{
          fontSize: '0.7rem', padding: '0.25rem 0',
          borderLeft: `2px solid ${e.suspicious ? 'var(--color-status-error)' : 'rgba(255,255,255,0.08)'}`,
          paddingLeft: '0.5rem', marginBottom: '0.25rem',
        }}>
          <div style={{ color: e.suspicious ? 'var(--color-status-error)' : 'var(--color-text-secondary)' }}>
            {e.suspicious && '⚠️ '}{e.action}: {e.detail}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>
            {e.timestamp.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateDiffView({ diff }: { diff: UpdateDiff }) {
  return (
    <div style={{
      marginTop: '0.5rem', padding: '0.5rem', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
        更新差异 ({diff.fromVersion} → {diff.toVersion})
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
        {diff.changedFiles} 个文件变更
      </div>
      {diff.newPermissions.length > 0 && (
        <div style={{ marginBottom: '0.25rem' }}>
          {diff.newPermissions.map((p, i) => (
            <div key={i} style={{ fontSize: '0.7rem', color: 'var(--color-status-error)' }}>
              + {p}
            </div>
          ))}
        </div>
      )}
      {diff.highlights.map((h, i) => (
        <div key={i} style={{ fontSize: '0.7rem', color: 'var(--color-status-warning)' }}>
          • {h}
        </div>
      ))}
    </div>
  );
}

export default function SkillShield() {
  const [analyses] = useState<SkillAnalysis[]>(MOCK_ANALYSES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isolated, setIsolated] = useState<Set<string>>(new Set());

  const toggleIsolate = (id: string) => {
    setIsolated(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>
        🛡️ 技能护盾
      </h2>
      {analyses.map(skill => (
        <div key={skill.id} className="card" style={{ marginBottom: '0.5rem', padding: '0.75rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', opacity: isolated.has(skill.id) ? 0.5 : 1 }}
            onClick={() => setExpanded(expanded === skill.id ? null : skill.id)}
          >
            <ScoreRing score={skill.safetyScore} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {isolated.has(skill.id) && <span style={{ color: 'var(--color-status-error)', marginRight: '0.3rem' }}>🔒</span>}
                  {skill.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                  v{skill.version} · {skill.source}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {skill.permissions.length} 项权限
                {skill.codeIssues.length > 0 && ` · ${skill.codeIssues.length} 项问题`}
                {skill.iocMatch && <span style={{ color: 'var(--color-status-error)' }}> · ⚠️ IoC 匹配</span>}
              </div>
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              {expanded === skill.id ? '▼' : '▶'}
            </span>
          </div>

          {expanded === skill.id && (
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-divider)', paddingTop: '0.5rem' }}>
              {/* IoC Warning */}
              {skill.iocMatch && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: 6,
                  marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--color-status-error)',
                }}>
                  🚨 此技能匹配 ClawHavoc IoC 数据库中的已知恶意指标！建议立即移除。
                </div>
              )}

              {/* Code issues */}
              {skill.codeIssues.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>代码分析</div>
                  {skill.codeIssues.map((issue, i) => (
                    <div key={i} style={{
                      fontSize: '0.7rem', padding: '0.2rem 0',
                      color: issue.severity === 'critical' ? 'var(--color-status-error)' :
                             issue.severity === 'warn' ? 'var(--color-status-warning)' : 'var(--color-text-secondary)',
                    }}>
                      {issue.severity === 'critical' ? '🚨' : issue.severity === 'warn' ? '⚠️' : 'ℹ️'} {issue.message}
                    </div>
                  ))}
                </div>
              )}

              <PermissionList permissions={skill.permissions} />
              <BehaviorLog entries={skill.behaviorLog} />
              {skill.updateDiff && <UpdateDiffView diff={skill.updateDiff} />}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleIsolate(skill.id); }}
                  style={{
                    background: isolated.has(skill.id) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: 'none', borderRadius: 6,
                    padding: '6px 12px', fontSize: '0.75rem',
                    color: isolated.has(skill.id) ? 'var(--color-status-online)' : 'var(--color-status-error)',
                    cursor: 'pointer',
                  }}
                >
                  {isolated.has(skill.id) ? '🔓 解除隔离' : '🔒 隔离'}
                </button>
                {skill.safetyScore < 50 && (
                  <button style={{
                    background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6,
                    padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-status-error)',
                    cursor: 'pointer',
                  }}>
                    🗑️ 移除
                  </button>
                )}
                <button style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6,
                  padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}>
                  📋 查看源码
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
