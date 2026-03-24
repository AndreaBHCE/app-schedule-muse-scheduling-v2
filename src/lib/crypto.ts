import crypto from "crypto";

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64-encoded ciphertext with IV and auth tag.
 */
export function encryptToken(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes hex
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher("aes-256-gcm", key);
  cipher.setIV(iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();
  const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, "base64")]);

  return result.toString("base64");
}

/**
 * Decrypts ciphertext encrypted with encryptToken.
 */
export function decryptToken(ciphertext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const data = Buffer.from(ciphertext, "base64");

  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);

  const decipher = crypto.createDecipher("aes-256-gcm", key);
  decipher.setIV(iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted += decipher.final("utf8");

  return decrypted;
}
