/**
 * ToolCallCard - 工具调用内联卡片
 * 根据工具类型显示不同样式的卡片：
 * - browser/screenshot → 图片缩略图
 * - exec/shell → 可折叠命令输出（默认3行）
 * - read/write/edit → 文件路径 + diff 预览
 * - web_search → 搜索结果摘要
 * - 其他 → 通用参数/结果卡片
 */

import { useState, useMemo } from 'react';
import './ToolCallCard.css';

interface ToolCallCardProps {
  name: string;
  args?: string;
  result?: string;
  duration?: number;
  status: 'running' | 'done' | 'error';
  onClick?: () => void;
}

type ToolCategory = 'browser' | 'exec' | 'file' | 'search' | 'generic';

function categorize(name: string): ToolCategory {
  const n = name.toLowerCase();
  if (n.includes('browser') || n.includes('screenshot') || n.includes('image')) return 'browser';
  if (n.includes('exec') || n.includes('shell') || n === 'process') return 'exec';
  if (n.includes('read') || n.includes('write') || n.includes('edit')) return 'file';
  if (n.includes('search') || n.includes('web_search') || n.includes('web_fetch')) return 'search';
  return 'generic';
}

function parseArgs(args?: string): Record<string, unknown> {
  if (!args) return {};
  try { return JSON.parse(args); } catch { return { raw: args }; }
}

function truncateLines(text: string, maxLines: number): { text: string; totalLines: number; truncated: boolean } {
  const lines = text.split('\n');
  return {
    text: lines.slice(0, maxLines).join('\n'),
    totalLines: lines.length,
    truncated: lines.length > maxLines,
  };
}

export default function ToolCallCard({ name, args, result, duration, status, onClick }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const category = useMemo(() => categorize(name), [name]);
  const parsedArgs = useMemo(() => parseArgs(args), [args]);

  const statusIcon = status === 'running' ? '⏳' : status === 'error' ? '❌' : '✅';
  const durationText = duration != null ? `${(duration / 1000).toFixed(1)}s` : '';

  const renderContent = () => {
    switch (category) {
      case 'browser': {
        // Check if result contains base64 image or URL
        const hasImage = result && (result.startsWith('data:image') || result.match(/\.(png|jpg|jpeg|gif|webp)/i));
        return (
          <div className="tc-browser">
            <div className="tc-label">🌐 {name}</div>
            {parsedArgs.url ? <div className="tc-url">{String(parsedArgs.url).slice(0, 60)}</div> : null}
            {parsedArgs.action ? <div className="tc-action">动作: {String(parsedArgs.action)}</div> : null}
            {hasImage && expanded && (
              <div className="tc-image-preview">
                <img src={result!} alt="screenshot" loading="lazy" />
              </div>
            )}
            {hasImage && !expanded && <div className="tc-image-hint">📸 点击查看截图</div>}
          </div>
        );
      }

      case 'exec': {
        const command = String(parsedArgs.command || parsedArgs.cmd || '');
        const output = result || '';
        const { text: preview, totalLines, truncated } = truncateLines(output, expanded ? 999 : 3);
        return (
          <div className="tc-exec">
            <div className="tc-label">⚡ {name}</div>
            {command && <div className="tc-command">$ {command.slice(0, 80)}{command.length > 80 ? '...' : ''}</div>}
            {output && (
              <pre className="tc-output">{preview}{truncated && !expanded ? `\n... (${totalLines} 行)` : ''}</pre>
            )}
          </div>
        );
      }

      case 'file': {
        const filePath = String(parsedArgs.file_path || parsedArgs.path || parsedArgs.file || '');
        const shortPath = filePath.split(/[/\\]/).slice(-2).join('/');
        const hasDiff = result && (result.includes('+++') || result.includes('---') || result.includes('@@'));
        return (
          <div className="tc-file">
            <div className="tc-label">{name.includes('read') ? '📖' : name.includes('edit') ? '✏️' : '💾'} {name}</div>
            {filePath && <div className="tc-filepath">{shortPath || filePath}</div>}
            {hasDiff && expanded && (
              <pre className="tc-diff">{result!.slice(0, 500)}</pre>
            )}
            {hasDiff && !expanded && <div className="tc-diff-hint">📝 点击查看变更</div>}
          </div>
        );
      }

      case 'search': {
        const query = String(parsedArgs.query || parsedArgs.q || '');
        return (
          <div className="tc-search">
            <div className="tc-label">🔍 {name}</div>
            {query && <div className="tc-query">"{query.slice(0, 60)}"</div>}
            {result && expanded && (
              <div className="tc-search-result">{result.slice(0, 300)}{result.length > 300 ? '...' : ''}</div>
            )}
          </div>
        );
      }

      default: {
        const argsSummary = args ? args.slice(0, 80) : '';
        return (
          <div className="tc-generic">
            <div className="tc-label">🔧 {name}</div>
            {argsSummary && <div className="tc-args-summary">{argsSummary}{(args?.length || 0) > 80 ? '...' : ''}</div>}
            {result && expanded && (
              <pre className="tc-generic-result">{result.slice(0, 500)}</pre>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`tool-call-inline-card ${category} ${status} ${expanded ? 'expanded' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick && !expanded) { onClick(); return; }
        setExpanded(!expanded);
      }}
    >
      <div className="tc-header">
        <span className="tc-status">{statusIcon}</span>
        {renderContent()}
        {durationText && <span className="tc-duration">{durationText}</span>}
        <span className="tc-expand-icon">{expanded ? '▾' : '▸'}</span>
      </div>
    </div>
  );
}
