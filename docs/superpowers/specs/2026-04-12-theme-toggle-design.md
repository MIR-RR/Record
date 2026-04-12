# Record Space Theme Toggle Design

## Goal

Add a polished theme switcher to the existing dashboard so users can move between light and dark modes without disrupting the current layout or writing workflow.

## Approved Direction

- default theme: light
- alternate theme: dark
- toggle placement: top right, next to the logout button
- visual language: sun and moon icons
- persistence: remember the user's last choice across refreshes

The light theme should feel like a clean, professional tool desk: warm neutrals, strong readability, and restrained contrast. It should preserve the current product identity rather than making the app feel like a different product.

## Scope

Included:

- global theme state and persistence
- default light-mode tokens
- explicit dark-mode token override
- dashboard header theme switch control
- theme application to auth and dashboard surfaces
- build and targeted logic verification

Out of scope:

- system-theme auto-following
- per-page theme controls
- user-profile-synced theme storage

## Technical Approach

Recommended approach: token-driven theming using a root `data-theme` attribute.

Why:

- keeps visual changes centralized in CSS variables
- avoids scattering theme conditionals through all components
- makes the new light mode and existing dark mode symmetrical
- allows persistence logic to stay small and testable

## Behavior Design

### Theme state

- the application stores theme preference under a stable localStorage key
- invalid or missing stored values fall back to `light`
- the current theme is mirrored to `document.documentElement.dataset.theme`

### Header control

- render a compact segmented toggle beside logout
- show sun and moon icons as separate theme targets
- highlight the active theme without increasing header visual weight
- keep labels accessible via `aria-label`

### Visual treatment

Light mode should use:

- paper-tinted background instead of pure white
- darker text for reading confidence
- softer accent application on borders and active states
- subtle grid texture adapted for bright backgrounds

Dark mode should keep the current structure and palette, with only token extraction needed to coexist with the light theme.

## File Plan

- `index.html`
  - apply the saved theme before React boots to reduce theme flash
- `src/lib/theme.js`
  - hold theme constants and small pure helpers
- `src/App.jsx`
  - manage theme state and persistence
- `src/components/DashboardShell.jsx`
  - render the header theme switch
- `src/styles/app.css`
  - define light and dark token sets and switch styling
- `test/theme.test.js`
  - verify default theme, fallback behavior, and toggling logic

## Verification Plan

1. run the focused node test for theme helpers
2. run the production build
3. confirm the dashboard header contains the new toggle control and the app still compiles cleanly
