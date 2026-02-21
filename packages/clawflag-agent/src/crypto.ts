import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import { EncryptedPayload } from './types';

export class CryptoManager {
  private keyPair: nacl.BoxKeyPair;
  private sharedKey: Uint8Array | null = null;

  constructor(secretKeyBase64?: string) {
    if (secretKeyBase64) {
      const secretKey = decodeBase64(secretKeyBase64);
      this.keyPair = nacl.box.keyPair.fromSecretKey(secretKey);
    } else {
      this.keyPair = nacl.box.keyPair();
    }
  }

  get publicKeyBase64(): string {
    return encodeBase64(this.keyPair.publicKey);
  }

  get secretKeyBase64(): string {
    return encodeBase64(this.keyPair.secretKey);
  }

  // Derive shared secret from peer's public key
  deriveSharedKey(peerPublicKeyBase64: string): void {
    const peerPublicKey = decodeBase64(peerPublicKeyBase64);
    // Use nacl.box.before to compute shared key
    this.sharedKey = nacl.box.before(peerPublicKey, this.keyPair.secretKey);
  }

  get hasSharedKey(): boolean {
    return this.sharedKey !== null;
  }

  encrypt(plaintext: string): EncryptedPayload {
    if (!this.sharedKey) throw new Error('No shared key — complete key exchange first');
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageBytes = decodeUTF8(plaintext);
    const encrypted = nacl.box.after(messageBytes, nonce, this.sharedKey);
    if (!encrypted) throw new Error('Encryption failed');
    return {
      nonce: encodeBase64(nonce),
      data: encodeBase64(encrypted),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    if (!this.sharedKey) throw new Error('No shared key — complete key exchange first');
    const nonce = decodeBase64(payload.nonce);
    const data = decodeBase64(payload.data);
    const decrypted = nacl.box.open.after(data, nonce, this.sharedKey);
    if (!decrypted) throw new Error('Decryption failed — wrong key or corrupted data');
    return encodeUTF8(decrypted);
  }
}
