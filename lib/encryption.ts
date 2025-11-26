import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-cbc";

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error(
    "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32"
  );
}

/**
 * Encrypt sensitive data (SMTP/IMAP credentials)
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV + encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not configured");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt SMTP config for storage
 */
export function encryptSmtpConfig(config: {
  host: string;
  port: number;
  user: string;
  password: string;
}): {
  host: string;
  port: number;
  user: string;
  encryptedPassword: string;
} {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    encryptedPassword: encrypt(config.password),
  };
}

/**
 * Decrypt SMTP config from storage
 */
export function decryptSmtpConfig(encrypted: {
  host: string;
  port: number;
  user: string;
  encryptedPassword: string;
}): {
  host: string;
  port: number;
  user: string;
  password: string;
} {
  return {
    host: encrypted.host,
    port: encrypted.port,
    user: encrypted.user,
    password: decrypt(encrypted.encryptedPassword),
  };
}
