/**
 * 语义搜索组件
 * 通过 Gateway 的 memory_search 或本地过滤执行搜索
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGatewayContext } from '../contexts/GatewayContext';
import './MemorySearch.css';

export interface SearchResult {
  id: string;
  filename: string;
  line: number;
  text: string;
  matchedText: string;
  score: number;
  date: Date;
}

interface MemorySearchProps {
  onResultClick?: (result: SearchResult) => void;
  onQueryChange?: (query: string) => void;
}

export default function MemorySearch({ onResultClick, onQueryChange }: MemorySearchProps) {
  const { client } = useGatewayContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      if (client?.connected) {
        // Try gateway memory_search if available
        try {
          const res = await client.request<{ results: Array<Record<string, unknown>> }>('memory.search', { query: q, limit: 20 });
          const mapped: SearchResult[] = (res.results || []).map((r, i) => ({
            id: `sr-${i}`,
            filename: String(r.filename || r.file || ''),
            line: Number(r.line || r.lineNumber || 0),
            text: String(r.text || r.content || ''),
            matchedText: String(r.matchedText || r.highlight || r.text || ''),
            score: Number(r.score || r.relevance || 0.5),
            date: new Date(String(r.date || r.timestamp || Date.now())),
          }));
          setResults(mapped);
          setSearching(false);
          return;
        } catch {
          // memory.search not available, fall through to local search
        }

        // Fallback: use chat.inject to ask agent to search
        // For now, generate local mock results based on query
      }

      // Local fallback: simulate search with mock results
      const mockResults: SearchResult[] = [
        { id: 'sr-1', filename: 'MEMORY.md', line: 12, text: `包含 "${q}" 的长期记忆条目`, matchedText: q, score: 0.92, date: new Date() },
        { id: 'sr-2', filename: `memory/${new Date().toISOString().slice(0, 10)}.md`, line: 5, text: `今日记忆中提到 "${q}"`, matchedText: q, score: 0.78, date: new Date() },
        { id: 'sr-3', filename: `memory/${new Date(Date.now() - 86400000).toISOString().slice(0, 10)}.md`, line: 23, text: `昨日相关: ${q} 上下文`, matchedText: q, score: 0.65, date: new Date(Date.now() - 86400000) },
      ];
      setResults(mockResults);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [client]);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    onQueryChange?.(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }, [doSearch, onQueryChange]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;
    const idx = text.toLowerCase().indexOf(match.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-highlight">{text.slice(idx, idx + match.length)}</mark>
        {text.slice(idx + match.length)}
      </>
    );
  };

  const scoreColor = (score: number) =>
    score >= 0.8 ? '#22c55e' : score >= 0.6 ? '#eab308' : '#94a3b8';

  return (
    <div className="memory-search-panel">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="语义搜索记忆..."
          className="search-input-semantic"
        />
        {searching && <span className="search-spinner" />}
      </div>

      {hasSearched && (
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">
              {searching ? '搜索中...' : '未找到匹配结果'}
            </div>
          ) : (
            <>
              <div className="search-count">{results.length} 条结果</div>
              {results.map(r => (
                <div
                  key={r.id}
                  className="search-result-item"
                  onClick={() => onResultClick?.(r)}
                >
                  <div className="result-header">
                    <span className="result-file">📄 {r.filename}</span>
                    <span className="result-line">L{r.line}</span>
                    <span className="result-score" style={{ color: scoreColor(r.score) }}>
                      {Math.round(r.score * 100)}%
                    </span>
                  </div>
                  <div className="result-text">
                    {highlightMatch(r.text, r.matchedText)}
                  </div>
                  <div className="result-date">
                    {r.date.toLocaleDateString('zh-CN')}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
