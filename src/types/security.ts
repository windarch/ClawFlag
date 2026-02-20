/**
 * 安全检查相关类型定义
 */

export type SecurityLevel = 'pass' | 'warning' | 'critical';

export interface SecurityCheckItem {
  id: string;
  title: string;
  description: string;
  level: SecurityLevel;
  fix?: string;
  fixUrl?: string;
}

export interface SecurityCheckResult {
  timestamp: Date;
  items: SecurityCheckItem[];
  summary: {
    pass: number;
    warning: number;
    critical: number;
  };
}

// 安全检查函数类型
export type SecurityChecker = (config: SecurityCheckConfig) => SecurityCheckItem;

export interface SecurityCheckConfig {
  gatewayVersion?: string;
  bind?: string;
  authMode?: string;
  authEnabled?: boolean;
  publiclyAccessible?: boolean;
  installedSkills?: number;
  trustedProxies?: boolean;
}
