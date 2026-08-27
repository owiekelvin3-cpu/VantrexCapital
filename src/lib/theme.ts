export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "vantrex-theme";

export const FIN_CHART_COLORS = ["#E2FF4C", "#A7F3D0", "#FDE68A", "#FECACA", "#E5E7EB"] as const;

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", theme === "light" ? "#F4F7F6" : "#0F0F0F");

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
