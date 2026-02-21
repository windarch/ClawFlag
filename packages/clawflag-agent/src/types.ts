export interface AgentConfig {
  relayUrl: string;
  gatewayUrl: string;
  gatewayToken?: string;
  deviceId?: string;
  publicKey?: string;
  secretKey?: string;
  peerPublicKey?: string;
  sharedSecret?: string;
  pairedAt?: number;
}

export type AgentState = 'disconnected' | 'connecting' | 'pairing' | 'paired' | 'connected';

export interface RelayMessage {
  type: 'pair-init' | 'pair-ack' | 'pair-complete' | 'relay' | 'key-exchange' | 'ping' | 'pong' | 'disconnect' | 'error';
  payload?: any;
  from?: string;
  timestamp?: number;
}

export interface EncryptedPayload {
  nonce: string;   // base64
  data: string;    // base64 encrypted
}

export interface AppCommand {
  cmd: 'emergency-stop' | 'get-status' | 'get-history' | 'send-message';
  params?: any;
  requestId?: string;
}

export interface StatusSnapshot {
  state: AgentState;
  gatewayConnected: boolean;
  sessions?: any[];
  uptime: number;
  timestamp: number;
}
