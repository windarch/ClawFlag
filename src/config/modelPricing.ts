/**
 * 模型定价表
 * 价格单位: USD per 1M tokens
 * 汇率: 可通过环境变量 VITE_USD_CNY_RATE 配置，默认 7.25
 */

export interface ModelPricing {
  model: string;
  /** 模型匹配模式 (支持通配符) */
  patterns: string[];
  inputPer1M: number;   // USD
  outputPer1M: number;  // USD
  cachePer1M?: number;  // USD (cache read)
  tier: 'premium' | 'standard' | 'budget';
}

export const USD_CNY_RATE = Number(import.meta.env.VITE_USD_CNY_RATE) || 7.25;

export const MODEL_PRICING: ModelPricing[] = [
  // Anthropic
  { model: 'Claude Opus', patterns: ['claude-opus*', '*opus-4*'], inputPer1M: 15, outputPer1M: 75, cachePer1M: 1.875, tier: 'premium' },
  { model: 'Claude Sonnet', patterns: ['claude-sonnet*', '*sonnet-4*', '*sonnet-3*'], inputPer1M: 3, outputPer1M: 15, cachePer1M: 0.375, tier: 'standard' },
  { model: 'Claude Haiku', patterns: ['claude-haiku*', '*haiku-3*'], inputPer1M: 0.25, outputPer1M: 1.25, cachePer1M: 0.03, tier: 'budget' },
  // DeepSeek
  { model: 'DeepSeek V3', patterns: ['deepseek-v3*', 'deepseek-chat*'], inputPer1M: 0.27, outputPer1M: 1.10, tier: 'budget' },
  { model: 'DeepSeek R1', patterns: ['deepseek-r1*', 'deepseek-reasoner*'], inputPer1M: 0.55, outputPer1M: 2.19, tier: 'standard' },
  // Qwen
  { model: 'Qwen Max', patterns: ['qwen-max*', 'qwen2.5-max*'], inputPer1M: 1.60, outputPer1M: 6.40, tier: 'standard' },
  { model: 'Qwen Plus', patterns: ['qwen-plus*', 'qwen2.5-plus*'], inputPer1M: 0.40, outputPer1M: 1.20, tier: 'budget' },
  { model: 'Qwen Turbo', patterns: ['qwen-turbo*', 'qwen2.5-turbo*'], inputPer1M: 0.10, outputPer1M: 0.30, tier: 'budget' },
  // GLM
  { model: 'GLM-4', patterns: ['glm-4*'], inputPer1M: 1.40, outputPer1M: 1.40, tier: 'standard' },
  // Fallback
  { model: 'Unknown', patterns: ['*'], inputPer1M: 3, outputPer1M: 15, tier: 'standard' },
];

/** Match a model name to pricing */
export function getModelPricing(modelName: string): ModelPricing {
  const lower = modelName.toLowerCase();
  for (const p of MODEL_PRICING) {
    for (const pattern of p.patterns) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
      if (regex.test(lower)) return p;
    }
  }
  return MODEL_PRICING[MODEL_PRICING.length - 1];
}

/** Calculate cost in CNY */
export function calculateCostCNY(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  cacheTokens = 0,
): number {
  const pricing = getModelPricing(modelName);
  const usd =
    (inputTokens / 1_000_000) * pricing.inputPer1M +
    (outputTokens / 1_000_000) * pricing.outputPer1M +
    (cacheTokens / 1_000_000) * (pricing.cachePer1M ?? 0);
  return usd * USD_CNY_RATE;
}

/** Get cost color class based on CNY amount */
export function getCostColor(costCNY: number): 'low' | 'medium' | 'high' {
  if (costCNY < 0.1) return 'low';
  if (costCNY < 1.0) return 'medium';
  return 'high';
}

/** Format token count for display */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/** Downgrade path for cost fuse */
export const DOWNGRADE_PATH = ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-3.5'];
