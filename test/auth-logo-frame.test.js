import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("auth card wraps the logo in a dedicated frame container", () => {
  const source = readFileSync(new URL("../src/components/AuthCard.jsx", import.meta.url), "utf8");

  assert.match(source, /className="auth-page__logo-frame"/);
  assert.match(source, /className="auth-page__logo-frame-inner"/);
});

test("auth styles define the canvas-like logo frame layers", () => {
  const styles = readFileSync(new URL("../src/styles/app.css", import.meta.url), "utf8");

  assert.match(styles, /\.auth-page__logo-frame\s*\{/);
  assert.match(styles, /\.auth-page__logo-frame::before\s*\{/);
  assert.match(styles, /\.auth-page__logo-frame::after\s*\{/);
  assert.match(styles, /\.auth-page__logo-frame-inner\s*\{/);
});
