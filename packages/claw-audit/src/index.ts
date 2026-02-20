#!/usr/bin/env node

/**
 * claw-audit - Security audit CLI for OpenClaw Gateway
 *
 * Usage:
 *   npx claw-audit ws://localhost:18789 --token <token>
 *   npx claw-audit http://localhost:18789 --token <token>
 */

import { program } from 'commander';
import chalk from 'chalk';
import WebSocket from 'ws';
import { runAllChecks, type CheckResult, type CheckLevel } from './checks.js';

const VERSION = '0.1.0';
const CLAWFLAG_URL = 'https://claw-flag.vercel.app/';

program
  .name('claw-audit')
  .description('Security audit for OpenClaw Gateway instances')
  .version(VERSION)
  .argument('<gateway-url>', 'Gateway WebSocket URL (e.g., ws://localhost:18789)')
  .option('-t, --token <token>', 'Authentication token')
  .option('--timeout <ms>', 'Connection timeout in milliseconds', '10000')
  .option('--json', 'Output results as JSON')
  .action(async (url: string, opts: { token?: string; timeout: string; json?: boolean }) => {
    const timeout = parseInt(opts.timeout, 10);

    // Normalize URL
    let wsUrl = url;
    if (wsUrl.startsWith('http://')) wsUrl = wsUrl.replace('http://', 'ws://');
    if (wsUrl.startsWith('https://')) wsUrl = wsUrl.replace('https://', 'wss://');
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      wsUrl = `ws://${wsUrl}`;
    }

    console.log('');
    console.log(chalk.bold('🛡️  claw-audit') + chalk.gray(` v${VERSION}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`Target: ${wsUrl}`));
    console.log('');

    try {
      const info = await probeGateway(wsUrl, opts.token, timeout);

      const results = runAllChecks(info);

      if (opts.json) {
        console.log(JSON.stringify({ url: wsUrl, timestamp: new Date().toISOString(), results }, null, 2));
        return;
      }

      printResults(results);

      const criticalCount = results.filter(r => r.level === 'critical').length;
      const warnCount = results.filter(r => r.level === 'warn').length;

      console.log('');
      console.log(chalk.gray('─'.repeat(50)));

      if (criticalCount > 0) {
        console.log(chalk.red.bold(`🚨 发现 ${criticalCount} 项严重安全问题！`));
      } else if (warnCount > 0) {
        console.log(chalk.yellow(`⚠️  发现 ${warnCount} 项需要注意的问题`));
      } else {
        console.log(chalk.green.bold('✅ 所有检查通过！'));
      }

      console.log('');
      console.log(chalk.cyan(`🔗 在 ClawFlag 中查看详情: ${CLAWFLAG_URL}`));
      console.log('');

      process.exit(criticalCount > 0 ? 2 : warnCount > 0 ? 1 : 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`❌ 连接失败: ${message}`));
      console.log('');
      console.log(chalk.gray('请检查:'));
      console.log(chalk.gray('  • Gateway 地址是否正确'));
      console.log(chalk.gray('  • Gateway 是否正在运行'));
      console.log(chalk.gray('  • Token 是否有效'));
      console.log('');
      process.exit(3);
    }
  });

interface GatewayProbeResult {
  version?: string;
  bind?: string;
  auth?: { mode?: string };
  skills?: number;
  hostname?: string;
}

async function probeGateway(
  wsUrl: string,
  token: string | undefined,
  timeout: number
): Promise<GatewayProbeResult> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const ws = new WebSocket(wsUrl, { headers, handshakeTimeout: timeout });
    const result: GatewayProbeResult = {};
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();
        // Return partial results even on timeout
        if (Object.keys(result).length > 0) {
          resolve(result);
        } else {
          reject(new Error(`连接超时 (${timeout}ms)`));
        }
      }
    }, timeout);

    ws.on('open', () => {
      // Try to get system info
      try {
        ws.send(JSON.stringify({ type: 'system_info' }));
      } catch {
        // Ignore send errors
      }
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Extract info from any response
        if (msg.version) result.version = msg.version;
        if (msg.gateway_version) result.version = msg.gateway_version;
        if (msg.bind) result.bind = msg.bind;
        if (msg.auth) result.auth = msg.auth;
        if (msg.hostname) result.hostname = msg.hostname;
        if (msg.skills !== undefined) result.skills = msg.skills;

        // Also check nested data
        if (msg.data) {
          if (msg.data.version) result.version = msg.data.version;
          if (msg.data.bind) result.bind = msg.data.bind;
          if (msg.data.auth) result.auth = msg.data.auth;
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on('error', (err: Error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);

        // If we have partial results, use them
        if (Object.keys(result).length > 0) {
          resolve(result);
        } else {
          reject(err);
        }
      }
    });

    ws.on('close', (code: number) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);

        if (code === 4001 || code === 401) {
          result.auth = { mode: 'token' }; // Auth is enabled (we got rejected)
          resolve(result);
        } else if (Object.keys(result).length > 0) {
          resolve(result);
        } else {
          // Even a close means the gateway is reachable
          resolve(result);
        }
      }
    });

    // Give it a few seconds to gather data then resolve
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        ws.close();
        resolve(result);
      }
    }, Math.min(5000, timeout));
  });
}

const levelSymbol: Record<CheckLevel, string> = {
  pass: chalk.green('✅'),
  warn: chalk.yellow('⚠️ '),
  critical: chalk.red('🚨'),
};

const levelColor: Record<CheckLevel, (s: string) => string> = {
  pass: chalk.green,
  warn: chalk.yellow,
  critical: chalk.red,
};

function printResults(results: CheckResult[]): void {
  for (const r of results) {
    const symbol = levelSymbol[r.level];
    const color = levelColor[r.level];

    console.log(`${symbol} ${chalk.bold(r.title)}`);
    console.log(`   ${color(r.detail)}`);

    if (r.fix && r.level !== 'pass') {
      console.log(`   ${chalk.gray('💡 ' + r.fix)}`);
    }

    console.log('');
  }
}

program.parse();
