/**
 * Platform Account Encryption Utility
 * Handles encryption/decryption of platform account tokens at the service level
 */

import { EncryptionUtil } from './encryption';
import { PlatformAccountDocument } from '../models/platform-account.model';

export class PlatformAccountEncryption {
  /**
   * Encrypts tokens before saving a platform account
   */
  static encryptTokensBeforeSave(account: any): any {
    const encryptedAccount = { ...account };

    try {
      // Encrypt access token if it exists and is not already encrypted
      if (encryptedAccount.accessToken && !EncryptionUtil.isEncrypted(encryptedAccount.accessToken)) {
        encryptedAccount.accessToken = EncryptionUtil.encryptAccessToken(encryptedAccount.accessToken);
      }

      // Encrypt refresh token if it exists and is not already encrypted
      if (encryptedAccount.refreshToken && !EncryptionUtil.isEncrypted(encryptedAccount.refreshToken)) {
        encryptedAccount.refreshToken = EncryptionUtil.encryptRefreshToken(encryptedAccount.refreshToken);
      }
    } catch (error) {
      console.error('Failed to encrypt platform account tokens:', error);
      throw new Error('Token encryption failed');
    }

    return encryptedAccount;
  }

  /**
   * Decrypts tokens after retrieving a platform account
   */
  static decryptTokensAfterRetrieve(account: PlatformAccountDocument | null): PlatformAccountDocument | null {
    if (!account) return null;

    try {
      // Decrypt access token if it exists and is encrypted
      if (account.accessToken && EncryptionUtil.isEncrypted(account.accessToken)) {
        try {
          account.accessToken = EncryptionUtil.decryptAccessToken(account.accessToken);
        } catch (decryptError) {
          console.error('Failed to decrypt access token for platform account:', {
            userId: account.userId,
            platform: account.platform,
            error: decryptError instanceof Error ? decryptError.message : 'Unknown decryption error'
          });
          // Set token to undefined if decryption fails
          (account as any).accessToken = undefined;
        }
      }

      // Decrypt refresh token if it exists and is encrypted
      if (account.refreshToken && EncryptionUtil.isEncrypted(account.refreshToken)) {
        try {
          account.refreshToken = EncryptionUtil.decryptRefreshToken(account.refreshToken);
        } catch (decryptError) {
          console.error('Failed to decrypt refresh token for platform account:', {
            userId: account.userId,
            platform: account.platform,
            error: decryptError instanceof Error ? decryptError.message : 'Unknown decryption error'
          });
          // Set token to undefined if decryption fails
          (account as any).refreshToken = undefined;
        }
      }
    } catch (error) {
      console.error('Error decrypting platform account tokens:', error);
    }

    return account;
  }

  /**
   * Decrypts tokens for an array of platform accounts
   */
  static decryptTokensForArray(accounts: PlatformAccountDocument[]): PlatformAccountDocument[] {
    return accounts.map(account => this.decryptTokensAfterRetrieve(account)).filter(Boolean) as PlatformAccountDocument[];
  }

  /**
   * Safely gets the decrypted access token from a platform account
   */
  static getDecryptedAccessToken(account: PlatformAccountDocument): string | null {
    if (!account.accessToken) return null;

    try {
      if (EncryptionUtil.isEncrypted(account.accessToken)) {
        return EncryptionUtil.decryptAccessToken(account.accessToken);
      }
      return account.accessToken;
    } catch (error) {
      console.error('Failed to decrypt access token:', {
        userId: account.userId,
        platform: account.platform,
        error: error instanceof Error ? error.message : 'Unknown decryption error'
      });
      return null;
    }
  }

  /**
   * Safely gets the decrypted refresh token from a platform account
   */
  static getDecryptedRefreshToken(account: PlatformAccountDocument): string | null {
    if (!account.refreshToken) return null;

    try {
      if (EncryptionUtil.isEncrypted(account.refreshToken)) {
        return EncryptionUtil.decryptRefreshToken(account.refreshToken);
      }
      return account.refreshToken;
    } catch (error) {
      console.error('Failed to decrypt refresh token:', {
        userId: account.userId,
        platform: account.platform,
        error: error instanceof Error ? error.message : 'Unknown decryption error'
      });
      return null;
    }
  }

  /**
   * Encrypts tokens on an existing platform account instance before saving
   */
  static encryptTokensOnInstance(account: PlatformAccountDocument): void {
    try {
      // Encrypt access token if it exists and is not already encrypted
      if (account.accessToken && !EncryptionUtil.isEncrypted(account.accessToken)) {
        account.accessToken = EncryptionUtil.encryptAccessToken(account.accessToken);
      }

      // Encrypt refresh token if it exists and is not already encrypted
      if (account.refreshToken && !EncryptionUtil.isEncrypted(account.refreshToken)) {
        account.refreshToken = EncryptionUtil.encryptRefreshToken(account.refreshToken);
      }
    } catch (error) {
      console.error('Failed to encrypt platform account tokens on instance:', error);
      throw new Error('Token encryption failed');
    }
  }
}