// Theme plumbing shared by the no-flash boot script (server) and the settings
// menu (client). No React here so it can be imported from either side.

export type ThemeChoice = "system" | "light" | "dark";
export const THEME_KEY = "cm-theme";

/** Resolve a stored choice to the concrete theme that should be applied. */
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): "light" | "dark" {
  if (choice === "system") return prefersDark ? "dark" : "light";
  return choice;
}

/** Apply a choice to <html> immediately (client only). */
export function applyTheme(choice: ThemeChoice) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = resolveTheme(choice, prefersDark);
  const el = document.documentElement;
  el.dataset.theme = theme;
  el.style.colorScheme = theme;
}

// --- a tiny external store so React reads the choice without a mount effect ---

const listeners = new Set<() => void>();

/** Read the stored theme choice (defaults to "system"). */
export function getThemeChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(THEME_KEY) as ThemeChoice | null) ?? "system";
}

/** Persist a choice, apply it to the DOM, and notify subscribers. */
export function setThemeChoice(choice: ThemeChoice) {
  localStorage.setItem(THEME_KEY, choice);
  applyTheme(choice);
  listeners.forEach((l) => l());
}

export function subscribeThemeChoice(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * Runs before first paint to set data-theme from localStorage / system pref,
 * avoiding a light-mode flash. Stringified verbatim into a blocking <script>.
 */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem("${THEME_KEY}")||"system";var d=c==="dark"||(c==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
