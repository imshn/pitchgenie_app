import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // For GCM, 12 bytes is recommended

function getSecretKey() {
  const key = process.env.SMTP_SECRET_KEY;
  if (!key) {
    throw new Error("SMTP_SECRET_KEY is not defined in environment variables");
  }
  // Ensure key is 32 bytes. If longer, slice it. If shorter, pad it (or throw error).
  // For simplicity, we'll assume the user provides a strong key or we hash it to 32 bytes.
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return IV:AuthTag:Encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getSecretKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
