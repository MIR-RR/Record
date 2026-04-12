import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("auth card renders the login logo directly without a decorative frame", () => {
  const source = readFileSync(new URL("../src/components/AuthCard.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /className="auth-page__logo-frame"/);
  assert.doesNotMatch(source, /className="auth-page__logo-frame-inner"/);
  assert.match(source, /className="auth-page__logo"/);
});

test("auth logo keeps the simple standalone sizing styles", () => {
  const styles = readFileSync(new URL("../src/styles/app.css", import.meta.url), "utf8");

  assert.doesNotMatch(styles, /\.auth-page__logo-frame\s*\{/);
  assert.doesNotMatch(styles, /\.auth-page__logo-frame-inner\s*\{/);
  assert.match(styles, /\.auth-page__logo\s*\{/);
  assert.match(styles, /margin-bottom:\s*20px;/);
});
