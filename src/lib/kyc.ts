import type { Profile } from "@/types/database";
import { supabase } from "@/lib/supabase";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export function getKycStatus(profile: Pick<Profile, "kyc_status"> | null | undefined): KycStatus {
  const status = profile?.kyc_status;
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return "none";
}

export function isKycApproved(_profile?: Pick<Profile, "kyc_status"> | null): boolean {
  // KYC is optional for all product actions.
  return true;
}

/** Extract storage object path from a stored path or legacy public URL. */
export function getKycStoragePath(documentUrl: string | null | undefined): string | null {
  if (!documentUrl) return null;
  if (!documentUrl.includes("://")) return documentUrl.replace(/^\/+/, "");
  const marker = "/kyc-documents/";
  const idx = documentUrl.indexOf(marker);
  if (idx >= 0) return decodeURIComponent(documentUrl.slice(idx + marker.length));
  return null;
}

export async function createKycDocumentSignedUrl(
  documentUrl: string | null | undefined,
  expiresIn = 120
): Promise<string | null> {
  const path = getKycStoragePath(documentUrl);
  if (!path) return documentUrl ?? null;
  const { data, error } = await supabase.storage.from("kyc-documents").createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return documentUrl ?? null;
  return data.signedUrl;
}

/** Map Supabase/RLS errors to friendly copy (KYC is optional; never surface KYC-required). */
export function formatTransactionError(error: unknown, fallback: string, _kycMessage?: string): string {
  if (!error) return fallback;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  if (/KYC verification required/i.test(message)) {
    return fallback;
  }
  return message || fallback;
}
