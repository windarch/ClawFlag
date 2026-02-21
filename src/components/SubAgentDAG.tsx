/**
 * SubAgentDAG - 子Agent有向无环图可视化
 * 纯CSS/SVG实现，展示主session与子agent的关系
 */

import { useMemo } from 'react';
import type { SessionInfo } from '../hooks/useGatewayData';
import './SubAgentDAG.css';

interface SubAgentDAGProps {
  sessions: SessionInfo[];
}

interface DAGNode {
  id: string;
  label: string;
  status: 'active' | 'idle' | 'completed';
  model: string;
  duration: string;
  children: string[];
  x: number;
  y: number;
}

function formatDuration(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function SubAgentDAG({ sessions }: SubAgentDAGProps) {
  const { nodes, edges } = useMemo(() => {
    if (sessions.length === 0) return { nodes: [], edges: [] };

    // Identify main sessions and subagents by key pattern
    const mainSessions = sessions.filter(s => s.kind === 'main' || s.key.includes(':main:main'));
    const subSessions = sessions.filter(s => s.kind !== 'main' && !s.key.includes(':main:main'));

    const dagNodes: DAGNode[] = [];
    const dagEdges: { from: string; to: string }[] = [];

    // Layout: main nodes at top, children below
    const nodeWidth = 160;
    const nodeHeight = 70;
    const gapX = 30;
    const gapY = 80;

    // Place main sessions
    mainSessions.forEach((s, i) => {
      dagNodes.push({
        id: s.id,
        label: s.label || 'main',
        status: s.status,
        model: s.model,
        duration: formatDuration(s.lastActive),
        children: [],
        x: i * (nodeWidth + gapX) + 20,
        y: 20,
      });
    });

    // Place sub sessions, linking to first main or standalone
    subSessions.forEach((s, i) => {
      const parentId = mainSessions[0]?.id;
      const x = i * (nodeWidth + gapX) + 20;
      const y = 20 + nodeHeight + gapY;

      dagNodes.push({
        id: s.id,
        label: s.label || s.key.split(':').pop() || 'sub',
        status: s.status,
        model: s.model,
        duration: formatDuration(s.lastActive),
        children: [],
        x,
        y,
      });

      if (parentId) {
        dagEdges.push({ from: parentId, to: s.id });
      }
    });

    return { nodes: dagNodes, edges: dagEdges };
  }, [sessions]);

  if (nodes.length === 0) {
    return null;
  }

  const svgWidth = Math.max(400, nodes.reduce((max, n) => Math.max(max, n.x + 180), 0));
  const svgHeight = Math.max(200, nodes.reduce((max, n) => Math.max(max, n.y + 90), 0));

  return (
    <div className="subagent-dag">
      <div className="dag-header">
        <span className="dag-title">🔗 Agent 拓扑</span>
        <span className="dag-count">{nodes.length} 个节点</span>
      </div>
      <div className="dag-canvas">
        <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--color-text-secondary)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from);
            const to = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;
            const x1 = from.x + 80;
            const y1 = from.y + 70;
            const x2 = to.x + 80;
            const y2 = to.y;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--color-text-secondary)" strokeWidth={1.5}
                strokeDasharray="4 3" markerEnd="url(#arrowhead)" opacity={0.6} />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const statusColor = node.status === 'active' ? 'var(--color-status-online)' :
              node.status === 'idle' ? 'var(--color-status-warning)' : 'var(--color-text-secondary)';
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect width={160} height={70} rx={8} ry={8}
                  fill="var(--color-bg-secondary)" stroke={statusColor} strokeWidth={2} />
                <circle cx={14} cy={18} r={5} fill={statusColor} />
                <text x={24} y={22} fill="var(--color-text-primary)" fontSize={13} fontWeight={600}>
                  {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                </text>
                <text x={10} y={42} fill="var(--color-text-secondary)" fontSize={10}>
                  {node.model}
                </text>
                <text x={10} y={58} fill="var(--color-text-secondary)" fontSize={10}>
                  ⏱ {node.duration}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
