import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold";
}

const sizes = {
  sm: { icon: "h-7 w-7", word: "text-[15px]", gap: "gap-2" },
  md: { icon: "h-8 w-8", word: "text-[17px]", gap: "gap-2.5" },
  lg: { icon: "h-9 w-9", word: "text-[19px]", gap: "gap-3" },
};

/**
 * Peak mark — charcoal plate + white stroke in light mode,
 * lime plate + charcoal stroke in dark mode (personal broker ONYX look).
 */
export function LogoIcon({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "gold";
}) {
  if (variant === "gold") {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="6" fill={BRAND.colors.gold} />
        <path
          d="M8 22L16 8L24 22"
          stroke={BRAND.colors.charcoal}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" className="logo-mark-plate" />
      <path
        d="M8 22L16 8L24 22"
        className="logo-mark-peak"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
  size = "md",
  variant = "default",
}: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <LogoIcon className={cn(s.icon, "shrink-0", iconClassName)} variant={variant} />
      {showWordmark && (
        <span
          className={cn(
            "inline-flex items-baseline gap-[0.35em] font-display font-semibold tracking-tight",
            s.word,
            wordmarkClassName
          )}
        >
          <span className="text-foreground">
            {BRAND.shortName.charAt(0) + BRAND.shortName.slice(1).toLowerCase()}
          </span>
          <span
            className={cn(
              "font-semibold",
              variant === "gold" ? "text-gold" : "text-emerald"
            )}
          >
            {BRAND.wordmarkSuffix.charAt(0) + BRAND.wordmarkSuffix.slice(1).toLowerCase()}
          </span>
        </span>
      )}
    </span>
  );
}
