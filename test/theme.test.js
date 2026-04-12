import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  resolveThemePreference,
  toggleTheme,
} from "../src/lib/theme.js";

test("uses light theme by default", () => {
  assert.equal(DEFAULT_THEME, "light");
  assert.equal(resolveThemePreference(null), "light");
  assert.equal(resolveThemePreference(undefined), "light");
});

test("accepts a stored valid theme", () => {
  assert.equal(resolveThemePreference("light"), "light");
  assert.equal(resolveThemePreference("dark"), "dark");
});

test("falls back to light theme for invalid stored values", () => {
  assert.equal(resolveThemePreference("system"), "light");
  assert.equal(resolveThemePreference(""), "light");
});

test("toggles between light and dark themes", () => {
  assert.equal(toggleTheme("light"), "dark");
  assert.equal(toggleTheme("dark"), "light");
});

test("uses a stable storage key", () => {
  assert.equal(THEME_STORAGE_KEY, "record-space-theme");
});
