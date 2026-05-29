"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "../../_lib/auth";
import {
  clearUserCredential,
  saveUserCredential,
  type CredentialKind,
} from "../../_lib/credentials";
import type { SettingsActionState } from "./actions-state";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Persist or clear a user's BYOK credentials in WorkOS Vault.
 *
 * The form posts an `intent`:
 *  - `save`         — store any non-empty Daytona / OpenAI keys provided.
 *  - `clear-daytona`/`clear-openai` — remove that stored key.
 */
export async function updateCredentialsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "You must be signed in to save keys." };
  }

  const intent = field(formData, "intent") || "save";

  try {
    if (intent === "clear-daytona" || intent === "clear-openai") {
      const kind: CredentialKind =
        intent === "clear-daytona" ? "daytona" : "openai";
      await clearUserCredential(user.id, kind);
      revalidatePath("/dashboard/settings");
      return {
        status: "ok",
        message: `Removed your ${kind === "daytona" ? "Daytona" : "OpenAI"} key.`,
      };
    }

    const daytona = field(formData, "daytonaApiKey");
    const openai = field(formData, "openaiApiKey");

    if (!daytona && !openai) {
      return {
        status: "error",
        message: "Enter a Daytona or OpenAI key to save.",
      };
    }

    const saved: string[] = [];
    if (daytona) {
      await saveUserCredential(user.id, "daytona", daytona);
      saved.push("Daytona");
    }
    if (openai) {
      await saveUserCredential(user.id, "openai", openai);
      saved.push("OpenAI");
    }

    revalidatePath("/dashboard/settings");
    return { status: "ok", message: `Saved your ${saved.join(" and ")} key${saved.length > 1 ? "s" : ""}.` };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not update your credentials.",
    };
  }
}

/** End the current AuthKit session. */
export async function signOutAction(): Promise<void> {
  const { signOut } = await import("@workos-inc/authkit-nextjs");
  await signOut();
}
