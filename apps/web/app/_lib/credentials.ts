import "server-only";

import { getWorkOS } from "@workos-inc/authkit-nextjs";

import type { ResolvedCredentials } from "./credentials-resolver";

/**
 * Per-user secret storage backed by WorkOS Vault.
 *
 * Each user's Daytona and OpenAI keys are stored as individual encrypted Vault
 * objects, namespaced by the WorkOS user id. The encryption key context is
 * scoped to the user so objects are cryptographically isolated per user.
 *
 * Plaintext values never reach the browser: callers either pass them straight
 * to the SDK on the server, or request a masked status for display.
 */

export type CredentialKind = "daytona" | "openai";

export type CredentialStatus = {
  /** Whether a value is stored for this credential. */
  set: boolean;
  /** Masked hint (last 4 chars) for display, when set. */
  hint?: string;
  /** ISO timestamp the value was last updated, when available. */
  updatedAt?: string;
};

export type UserCredentialStatus = Record<CredentialKind, CredentialStatus>;

const FIELD_BY_KIND: Record<CredentialKind, keyof ResolvedCredentials> = {
  daytona: "daytonaApiKey",
  openai: "openaiApiKey",
};

function vaultName(userId: string, kind: CredentialKind): string {
  return `getdesign.user.${userId}.${kind}-api-key`;
}

function maskHint(value: string): string {
  const tail = value.slice(-4);
  return tail.length > 0 ? `••••${tail}` : "••••";
}

/**
 * Distinguish "object does not exist" from real failures. WorkOS surfaces a
 * 404 for unknown Vault objects; we treat that as "not set" and re-throw the
 * rest so genuine misconfiguration is visible.
 */
function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number; statusCode?: number }).status ??
    (error as { statusCode?: number }).statusCode;
  if (status === 404) return true;
  const code = (error as { code?: string }).code;
  if (code === "entity_not_found" || code === "object_not_found") return true;
  const message = (error as { message?: string }).message ?? "";
  return /not\s*found/i.test(message);
}

type VaultObjectLike = {
  id: string;
  value: string;
  metadata?: { versionId?: string; updatedAt?: string };
};

async function readVaultObject(
  userId: string,
  kind: CredentialKind,
): Promise<VaultObjectLike | null> {
  const workos = getWorkOS();
  try {
    const object = (await workos.vault.readObjectByName(
      vaultName(userId, kind),
    )) as unknown as VaultObjectLike;
    return object;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Store (create or update) a single credential for a user. */
export async function saveUserCredential(
  userId: string,
  kind: CredentialKind,
  value: string,
): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Refusing to store an empty credential.");
  }

  const workos = getWorkOS();
  const existing = await readVaultObject(userId, kind);

  if (existing) {
    await workos.vault.updateObject({
      id: existing.id,
      value: trimmed,
      versionCheck: existing.metadata?.versionId,
    });
    return;
  }

  await workos.vault.createObject({
    name: vaultName(userId, kind),
    value: trimmed,
    context: { userId },
  });
}

/** Remove a stored credential for a user. No-op if it was never set. */
export async function clearUserCredential(
  userId: string,
  kind: CredentialKind,
): Promise<void> {
  const existing = await readVaultObject(userId, kind);
  if (!existing) return;
  const workos = getWorkOS();
  await workos.vault.deleteObject({ id: existing.id });
}

/** Read all of a user's stored credentials as plaintext (server-side only). */
export async function getUserCredentials(
  userId: string,
): Promise<ResolvedCredentials> {
  const [daytona, openai] = await Promise.all([
    readVaultObject(userId, "daytona"),
    readVaultObject(userId, "openai"),
  ]);

  const credentials: ResolvedCredentials = {};
  if (daytona?.value) credentials.daytonaApiKey = daytona.value;
  if (openai?.value) credentials.openaiApiKey = openai.value;
  return credentials;
}

/** Masked, display-safe status of a user's stored credentials. */
export async function getUserCredentialStatus(
  userId: string,
): Promise<UserCredentialStatus> {
  const [daytona, openai] = await Promise.all([
    readVaultObject(userId, "daytona"),
    readVaultObject(userId, "openai"),
  ]);

  const toStatus = (object: VaultObjectLike | null): CredentialStatus =>
    object?.value
      ? {
          set: true,
          hint: maskHint(object.value),
          updatedAt: object.metadata?.updatedAt,
        }
      : { set: false };

  return { daytona: toStatus(daytona), openai: toStatus(openai) };
}

export { FIELD_BY_KIND };
