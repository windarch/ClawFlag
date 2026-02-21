import fs from 'fs';
import path from 'path';
import os from 'os';
import { AgentConfig } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.clawflag');
const CONFIG_FILE = path.join(CONFIG_DIR, 'agent.json');

const DEFAULTS: AgentConfig = {
  relayUrl: 'ws://localhost:8099',
  gatewayUrl: 'ws://127.0.0.1:18789',
};

export function loadConfig(): AgentConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore parse errors, use defaults
  }
  return { ...DEFAULTS };
}

export function saveConfig(config: AgentConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
