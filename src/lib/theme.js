export const THEMES = {
  light: "light",
  dark: "dark",
};

export const DEFAULT_THEME = THEMES.light;
export const THEME_STORAGE_KEY = "record-space-theme";

export function resolveThemePreference(value) {
  if (value === THEMES.light || value === THEMES.dark) {
    return value;
  }

  return DEFAULT_THEME;
}

export function toggleTheme(currentTheme) {
  return resolveThemePreference(currentTheme) === THEMES.dark ? THEMES.light : THEMES.dark;
}

export function readStoredTheme(storage = globalThis?.localStorage) {
  try {
    return resolveThemePreference(storage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function persistTheme(theme, storage = globalThis?.localStorage) {
  const resolvedTheme = resolveThemePreference(theme);

  try {
    storage?.setItem(THEME_STORAGE_KEY, resolvedTheme);
  } catch {
    return resolvedTheme;
  }

  return resolvedTheme;
}

export function applyTheme(theme, root = globalThis?.document?.documentElement) {
  const resolvedTheme = resolveThemePreference(theme);

  if (root) {
    root.dataset.theme = resolvedTheme;
  }

  return resolvedTheme;
}
