import { BRAND } from "@/constants/brand";

/** Strip legacy Velion/Valion branding from notification copy. */
export function brandNotificationText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/VELION\s*MARKETS/gi, BRAND.name)
    .replace(/\bVELION\b/gi, BRAND.shortName)
    .replace(/\bVelion\b/g, BRAND.shortName)
    .replace(/\bvalion\b/gi, BRAND.shortName)
    .replace(/\bHarborline\b/gi, BRAND.shortName);
}
