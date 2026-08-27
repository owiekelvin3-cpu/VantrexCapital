import type { ReactNode } from "react";

/** KYC is optional — transactional UI is never blocked. */
export function KycRequiredGate({ children }: { children: ReactNode; className?: string; compact?: boolean }) {
  return <>{children}</>;
}
