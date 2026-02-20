import { useState } from 'react';
import './SoulEditor.css';

interface SoulEditorProps {
  soulContent: string;
  identityName?: string;
  identityEmoji?: string;
  memoryHealthPercent: number;
  onSave?: (content: string) => void;
}

type ViewLayer = 'L0' | 'L1';

export default function SoulEditor({
  soulContent,
  identityName,
  identityEmoji,
  memoryHealthPercent,
  onSave,
}: SoulEditorProps) {
  const [layer, setLayer] = useState<ViewLayer>('L0');
  const [editContent, setEditContent] = useState(soulContent);
  const [isEditing, setIsEditing] = useState(false);

  // Extract one-liner summary from SOUL.md (first non-empty, non-heading line)
  const soulSummary = soulContent
    .split('\n')
    .find(line => line.trim() && !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('---'))
    ?.trim() || 'Agent 人格未配置';

  const memoryColor =
    memoryHealthPercent >= 80 ? '#22c55e' :
    memoryHealthPercent >= 60 ? '#eab308' : '#ef4444';

  const handleSave = () => {
    onSave?.(editContent);
    setIsEditing(false);
  };

  return (
    <div className="soul-editor">
      {/* L0: 始终可见的概览 */}
      <div className="soul-overview" onClick={() => setLayer(layer === 'L1' ? 'L0' : 'L1')}>
        {/* 身份卡片 */}
        <div className="identity-card">
          <span className="identity-emoji">{identityEmoji || '🤖'}</span>
          <div className="identity-info">
            <div className="identity-name">{identityName || 'Agent'}</div>
            <div className="soul-summary">{soulSummary}</div>
          </div>
          <span className="layer-toggle">{layer === 'L0' ? '▼' : '▲'}</span>
        </div>

        {/* 记忆健康度条 */}
        <div className="memory-health">
          <div className="health-label">
            <span>记忆健康度</span>
            <span style={{ color: memoryColor }}>{memoryHealthPercent}%</span>
          </div>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{ width: `${memoryHealthPercent}%`, background: memoryColor }}
            />
          </div>
        </div>
      </div>

      {/* L1: 展开的编辑面板 */}
      {layer === 'L1' && (
        <div className="soul-detail">
          {/* SOUL.md 内容 */}
          <div className="detail-section">
            <div className="detail-header">
              <span className="detail-title">🎭 SOUL.md</span>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  编辑
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={() => { setIsEditing(false); setEditContent(soulContent); }}>
                    取消
                  </button>
                  <button className="save-btn" onClick={handleSave}>
                    保存
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <textarea
                className="soul-textarea"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={12}
              />
            ) : (
              <pre className="soul-preview">{soulContent}</pre>
            )}
          </div>

          {/* IDENTITY 卡片 */}
          <div className="detail-section">
            <div className="detail-header">
              <span className="detail-title">🪪 IDENTITY</span>
            </div>
            <div className="identity-detail-card">
              <div className="id-row">
                <span className="id-label">名称</span>
                <span className="id-value">{identityName || '未设置'}</span>
              </div>
              <div className="id-row">
                <span className="id-label">表情</span>
                <span className="id-value">{identityEmoji || '未设置'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
