import WebSocket from 'ws';

export type ConnectionRole = 'app' | 'agent';

export interface Token {
  id: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  paired: boolean;
}

export interface PairedConnection {
  tokenId: string;
  app: WebSocket | null;
  agent: WebSocket | null;
  lastActivity: number;
}

export type RelayMessageType =
  | 'pair-init'
  | 'pair-ack'
  | 'pair-complete'
  | 'relay'
  | 'key-exchange'
  | 'ping'
  | 'pong'
  | 'disconnect'
  | 'error';

export interface RelayMessage {
  type: RelayMessageType;
  payload?: any;
  from?: ConnectionRole;
  timestamp?: number;
}
