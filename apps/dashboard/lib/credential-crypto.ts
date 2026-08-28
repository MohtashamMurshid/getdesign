const KEY_ENV = "GETDESIGN_CREDENTIALS_KEY";
const AES_KEY_BYTES = 32;
const IV_BYTES = 12;

export class CredentialCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialCryptoError";
  }
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(AES_KEY_BYTES);
  for (let i = 0; i < AES_KEY_BYTES; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array<ArrayBuffer>): string {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function parseKeyMaterial(value: string): Uint8Array<ArrayBuffer> {
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return hexToBytes(value);
  }

  const decoded = base64ToBytes(value);
  if (decoded.byteLength === AES_KEY_BYTES) {
    return decoded;
  }

  throw new CredentialCryptoError(
    `${KEY_ENV} must be 32 bytes (64 hex characters or base64).`,
  );
}

function getMasterKeyBytes(): Uint8Array<ArrayBuffer> {
  const raw = process.env[KEY_ENV];
  if (!raw || raw.trim() === "") {
    throw new CredentialCryptoError(
      `${KEY_ENV} is not set. Provide a 32-byte key as 64 hex characters or base64.`,
    );
  }
  return parseKeyMaterial(raw.trim());
}

async function importAesKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    getMasterKeyBytes(),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export function keySuffix(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.length < 4) {
    throw new CredentialCryptoError("API key is too short to store.");
  }
  return trimmed.slice(-4);
}

export async function encryptCredential(plaintext: string): Promise<{
  ciphertext: string;
  iv: string;
}> {
  const trimmed = plaintext.trim();
  if (!trimmed) {
    throw new CredentialCryptoError("API key cannot be empty.");
  }

  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(trimmed),
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(new Uint8Array(iv)),
  };
}

export async function decryptCredential(
  ciphertext: string,
  iv: string,
): Promise<string> {
  const key = await importAesKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  );
  return new TextDecoder().decode(decrypted);
}
