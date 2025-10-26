import crypto from 'crypto';
import { env } from '../config';

/**
 * Encryption utility for securing sensitive data like tokens
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // For GCM, this should be 12 bytes
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * Get encryption key from environment variable
   */
  private static getEncryptionKey(): string {
    const key = env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    if (key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    return key;
  }

  /**
   * Derive key from password using PBKDF2
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, this.KEY_LENGTH, 'sha512');
  }

  /**
   * Encrypt sensitive data (like tokens)
   */
  static encrypt(text: string): string {
    if (!text) {
      return text;
    }

    try {
      const password = this.getEncryptionKey();
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const key = this.deriveKey(password, salt);

      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(salt); // Additional authenticated data

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine salt + iv + tag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
      ]);

      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data (like tokens)
   */
  static decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return encryptedData;
    }

    try {
      const password = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
      );
      const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

      const key = this.deriveKey(password, salt);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt access token
   */
  static encryptAccessToken(token: string): string {
    return this.encrypt(token);
  }

  /**
   * Decrypt access token
   */
  static decryptAccessToken(encryptedToken: string): string {
    return this.decrypt(encryptedToken);
  }

  /**
   * Encrypt refresh token
   */
  static encryptRefreshToken(token: string): string {
    return this.encrypt(token);
  }

  /**
   * Decrypt refresh token
   */
  static decryptRefreshToken(encryptedToken: string): string {
    return this.decrypt(encryptedToken);
  }

  /**
   * Check if data appears to be encrypted (base64 format)
   */
  static isEncrypted(data: string): boolean {
    if (!data) return false;
    
    try {
      // Check if it's valid base64 and has minimum length for encrypted data
      const decoded = Buffer.from(data, 'base64');
      return decoded.length > (this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
    } catch {
      return false;
    }
  }
}

export default EncryptionUtil;