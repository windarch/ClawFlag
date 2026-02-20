import { useState } from 'react';
import CostAdvisor from '../components/CostAdvisor';
import type { CostAdvice } from '../components/CostAdvisor';
import '../styles/pages.css';

const mockAdvices: CostAdvice[] = [
  {
    id: 'cron-model-downgrade',
    title: '定时任务模型降级',
    description: '你的 cron-daily-news 使用 Opus (每次 ¥6)，历史数据显示 Sonnet 能达到同样质量。',
    savings: '¥175/月',
    actionLabel: '切换到 Sonnet',
  },
  {
    id: 'heartbeat-frequency',
    title: '心跳频率优化',
    description: '心跳每 30 分钟运行一次，但 92% 的时间返回 HEARTBEAT_OK。',
    savings: '¥85/月',
    actionLabel: '改为 2 小时',
  },
];

export default function Router() {
  const [advices] = useState<CostAdvice[]>(mockAdvices);

  return (
    <div className="page router-page">
      <h1 className="page-title">⚡ 路由</h1>
      <p className="page-subtitle">模型路由与成本优化</p>

      {/* 成本顾问 */}
      <CostAdvisor
        advices={advices}
        onApply={(id) => {
          console.log('Applied advice:', id);
          // TODO: 实际修改 OpenClaw 配置
        }}
      />

      {/* 路由配置占位 */}
      <section style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <p style={{ color: 'var(--text-secondary, #a0a0b0)', fontSize: '0.85rem' }}>
            🚧 模型路由配置开发中...
          </p>
        </div>
      </section>
    </div>
  );
}
