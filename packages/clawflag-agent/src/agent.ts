import { EventEmitter } from 'events';
import { AgentConfig, AgentState, AppCommand, StatusSnapshot } from './types';
import { CryptoManager } from './crypto';
import { RelayClient } from './relay-client';
import { GatewayMonitor } from './gateway-monitor';
import { saveConfig } from './config';

export class ClawFlagAgent extends EventEmitter {
  private state: AgentState = 'disconnected';
  private relay: RelayClient;
  private gateway: GatewayMonitor;
  private crypto: CryptoManager;
  private startTime = Date.now();
  private statusInterval: NodeJS.Timeout | null = null;

  constructor(private config: AgentConfig, private token: string) {
    super();

    // Init or restore crypto keys
    this.crypto = new CryptoManager(config.secretKey);
    if (!config.secretKey) {
      config.publicKey = this.crypto.publicKeyBase64;
      config.secretKey = this.crypto.secretKeyBase64;
      saveConfig(config);
    }

    this.relay = new RelayClient(config.relayUrl, token, this.crypto);
    this.gateway = new GatewayMonitor(config.gatewayUrl, config.gatewayToken);

    this.setupRelayHandlers();
    this.setupGatewayHandlers();
  }

  private setupRelayHandlers(): void {
    this.relay.on('connected', () => {
      this.setState('connecting');
      this.log('Connected to Relay Server');
    });

    this.relay.on('pair-ack', () => {
      this.setState('pairing');
      this.log('Pairing initiated, exchanging keys...');
    });

    this.relay.on('pair-complete', () => {
      this.log('Paired with App!');
    });

    this.relay.on('key-exchanged', () => {
      this.setState('paired');
      this.log('Key exchange complete — E2EE active 🔐');
      this.config.pairedAt = Date.now();
      saveConfig(this.config);
      // Start forwarding gateway status
      this.startStatusUpdates();
    });

    this.relay.on('command', (cmd: AppCommand) => {
      this.handleAppCommand(cmd);
    });

    this.relay.on('peer-disconnected', () => {
      this.log('App disconnected');
      this.stopStatusUpdates();
    });

    this.relay.on('disconnected', () => {
      this.setState('disconnected');
      this.stopStatusUpdates();
    });

    this.relay.on('error', (err: Error) => {
      this.log(`Relay error: ${err.message}`);
    });
  }

  private setupGatewayHandlers(): void {
    this.gateway.on('connected', () => {
      this.setState('connected');
      this.log('Connected to OpenClaw Gateway');
    });

    this.gateway.on('disconnected', () => {
      this.log('Gateway disconnected');
    });

    this.gateway.on('gateway-event', (event: any) => {
      // Forward events to App
      if (this.state === 'paired' || this.state === 'connected') {
        try {
          this.relay.sendEncrypted({ type: 'gateway-event', event });
        } catch {
          // Ignore send errors
        }
      }
    });

    this.gateway.on('error', (err: Error) => {
      this.log(`Gateway error: ${err.message}`);
    });
  }

  private async handleAppCommand(cmd: AppCommand): Promise<void> {
    this.log(`Received command: ${cmd.cmd}`);

    try {
      let result: any;

      switch (cmd.cmd) {
        case 'emergency-stop':
          this.log('🚨 EMERGENCY STOP triggered!');
          await this.gateway.emergencyStop();
          result = { ok: true, message: 'All sessions aborted' };
          break;

        case 'get-status':
          result = await this.getStatusSnapshot();
          break;

        case 'get-history':
          result = await this.gateway.request('chat.history', cmd.params);
          break;

        case 'send-message':
          result = await this.gateway.request('chat.send', cmd.params);
          break;

        default:
          result = { error: `Unknown command: ${cmd.cmd}` };
      }

      // Send response back to App
      this.relay.sendEncrypted({
        type: 'command-response',
        requestId: cmd.requestId,
        result,
      });
    } catch (err: any) {
      this.relay.sendEncrypted({
        type: 'command-response',
        requestId: cmd.requestId,
        error: err.message,
      });
    }
  }

  private async getStatusSnapshot(): Promise<StatusSnapshot> {
    let sessions;
    try {
      const res = await this.gateway.getSessions();
      sessions = res?.sessions;
    } catch {
      sessions = undefined;
    }

    return {
      state: this.state,
      gatewayConnected: this.gateway.isConnected,
      sessions,
      uptime: (Date.now() - this.startTime) / 1000,
      timestamp: Date.now(),
    };
  }

  private startStatusUpdates(): void {
    // Send status every 30s
    this.statusInterval = setInterval(async () => {
      if (this.crypto.hasSharedKey) {
        try {
          const status = await this.getStatusSnapshot();
          this.relay.sendEncrypted({ type: 'status-update', status });
        } catch {
          // Ignore
        }
      }
    }, 30_000);
  }

  private stopStatusUpdates(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  private setState(state: AgentState): void {
    this.state = state;
    this.emit('state-change', state);
  }

  private log(msg: string): void {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${msg}`);
  }

  start(): void {
    this.log('Starting ClawFlag Agent...');
    this.relay.connect();
    this.gateway.connect();
  }

  stop(): void {
    this.log('Stopping...');
    this.stopStatusUpdates();
    this.relay.destroy();
    this.gateway.destroy();
  }
}
