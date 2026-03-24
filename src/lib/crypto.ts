import crypto from "crypto";

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64-encoded string: [12-byte IV][16-byte auth tag][ciphertext]
 */
export function encryptToken(plaintext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32-byte key from 64-char hex
  const iv = crypto.randomBytes(12); // 96-bit IV — GCM standard
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts ciphertext produced by encryptToken.
 */
export function decryptToken(ciphertext: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const data = Buffer.from(ciphertext, "base64");

  const iv = data.subarray(0, 12);        // 12-byte IV
  const authTag = data.subarray(12, 28);   // 16-byte auth tag
  const encrypted = data.subarray(28);     // remaining ciphertext

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
