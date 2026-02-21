import crypto from 'crypto';
import { Token } from './types';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const TOKEN_PREFIX = 'cf_tok_';

export class TokenManager {
  private tokens = new Map<string, Token>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  generate(): Token {
    const id = crypto.randomUUID();
    const hex = crypto.randomBytes(16).toString('hex');
    const token: Token = {
      id,
      token: `${TOKEN_PREFIX}${hex}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_TTL_MS,
      paired: false,
    };
    this.tokens.set(token.token, token);
    return token;
  }

  validate(tokenStr: string): Token | null {
    const token = this.tokens.get(tokenStr);
    if (!token) return null;
    if (Date.now() > token.expiresAt) {
      this.tokens.delete(tokenStr);
      return null;
    }
    return token;
  }

  markPaired(tokenStr: string): void {
    const token = this.tokens.get(tokenStr);
    if (token) token.paired = true;
  }

  get(tokenStr: string): Token | null {
    return this.tokens.get(tokenStr) ?? null;
  }

  get count(): number {
    return this.tokens.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, token] of this.tokens) {
      if (now > token.expiresAt && !token.paired) {
        this.tokens.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
