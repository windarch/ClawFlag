#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, saveConfig, getConfigPath } from './config';
import { ClawFlagAgent } from './agent';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('clawflag-agent')
  .description('Bridge between OpenClaw Gateway and ClawFlag App')
  .version(VERSION)
  .requiredOption('--token <token>', 'Pairing token from ClawFlag App (cf_tok_xxx)')
  .option('--relay <url>', 'Relay server URL', 'ws://localhost:8099')
  .option('--gateway <url>', 'OpenClaw Gateway URL', 'ws://127.0.0.1:18789')
  .option('--gateway-token <token>', 'OpenClaw Gateway auth token')
  .action((opts) => {
    const config = loadConfig();

    // Override with CLI args
    config.relayUrl = opts.relay;
    config.gatewayUrl = opts.gateway;
    if (opts.gatewayToken) config.gatewayToken = opts.gatewayToken;
    saveConfig(config);

    // Banner
    console.log(`
🚩 ClawFlag Agent v${VERSION}
   Relay:   ${config.relayUrl}
   Gateway: ${config.gatewayUrl}
   Config:  ${getConfigPath()}
`);

    const agent = new ClawFlagAgent(config, opts.token);

    // Graceful shutdown
    const shutdown = () => {
      agent.stop();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    agent.start();
  });

program.parse();
