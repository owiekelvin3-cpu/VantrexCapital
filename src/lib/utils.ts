import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { formatMoney } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats using the signed-in user's preferred currency when no code is passed. */
export function formatCurrency(amount: number, currency?: string) {
  return formatMoney(amount, currency);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number, digits = 1) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}
