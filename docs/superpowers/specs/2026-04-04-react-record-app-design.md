# React Record App Design

## Goal

Rebuild the current static Supabase demo into a lightweight React single-page application that feels like a normal product for end users, not a prototype.

The product is a light record-taking app for external users. The two most important jobs are:

- quickly creating a new record
- browsing recent records

## Scope

This redesign replaces the current plain HTML/CSS/JS frontend with a React + Vite app.

Included in scope:

- email login
- email registration
- logout
- create record
- list current user's records
- loading, success, error, and empty states
- responsive layout for desktop and mobile

Explicitly out of scope for this pass:

- search
- filtering
- edit/delete
- multi-page routing
- admin features
- analytics or dashboard metrics

## Product Direction

The interface should feel like a lightweight product, not an internal dashboard and not a personal toy.

Desired qualities:

- simple and welcoming
- credible enough for external users
- focused on writing and reviewing records
- lightweight, fast, and easy to understand

The logged-in experience should prioritize action first, then review:

- users should see a clear place to add a new record immediately
- users should also be able to browse recent records without hunting for them

## Technical Approach

Recommended approach: React + Vite + native CSS.

Why this approach:

- simple setup with fast local development
- a normal modern frontend structure
- no unnecessary UI framework overhead
- easy to keep the visual system custom and intentional

No heavyweight state library is needed. Local component state plus a small amount of lifted state in `App` is sufficient.

## Application Structure

The application will remain a single-page app with two major UI states.

### Logged-out state

Purpose:

- explain the product briefly
- allow users to log in or register in the same area

Structure:

- brand or product introduction panel
- auth card with login/register mode switch
- inline form feedback

### Logged-in state

Purpose:

- let the user add a record immediately
- show recent records in a clear, readable layout

Structure:

- top bar with app identity, user info, and logout
- main content split into two areas on desktop
- stacked layout on mobile
- left/main section for record creation
- right/secondary section for recent records

## Component Design

### `App`

Responsibilities:

- initialize session state
- switch between logged-out and logged-in experiences
- coordinate auth and record refreshes

State:

- `session`
- `user`
- `authLoading`

### `AuthCard`

Responsibilities:

- render login/register UI
- manage local email/password inputs
- submit login or registration actions
- display auth messages

Behavior:

- mode toggle between login and register
- disable submit while request is pending
- show translated, user-friendly feedback

### `DashboardShell`

Responsibilities:

- render the logged-in app frame
- display user identity
- expose logout action
- compose writer and list panels

### `RecordComposer`

Responsibilities:

- capture record input
- submit new record
- show success/error/loading feedback

### `RecordList`

Responsibilities:

- render recent records
- render empty state
- render loading/error state

### `lib/supabase.js`

Responsibilities:

- own Supabase client creation
- centralize SDK initialization
- provide one import location for the client

## Data Flow

1. App starts.
2. Supabase session is checked.
3. If no session exists, show logged-out UI.
4. If session exists, show logged-in UI and load records.
5. When login succeeds, session updates and records load automatically.
6. When a record is created, the list refreshes immediately after success.
7. When logout is triggered, local session is cleared and UI returns to logged-out state.

## Error Handling

The app must avoid silent failures.

Required error behaviors:

- if Supabase SDK fails to initialize, show a clear app-level error
- if login or registration fails, show inline form feedback
- if logout fails, show inline dashboard feedback
- if record loading fails, show a recoverable error state
- if record saving fails, keep the user input visible and show the error

## UX States

The rebuilt app must include these explicit states:

- auth loading
- auth error
- auth success
- records loading
- records empty
- records error
- record save pending
- record save success
- logout pending

## Visual Design Direction

The redesign should move away from "glass demo panel" styling and toward a cleaner application feel.

Visual intent:

- soft, product-style surfaces
- clear hierarchy
- restrained but distinctive typography
- enough polish to feel real, not ornamental
- mobile-friendly composition from the beginning

The logged-out screen can still have personality, but the logged-in experience should optimize for readability and task flow.

## File Plan

Expected frontend structure:

- `package.json`
- `vite.config.js`
- `src/main.jsx`
- `src/App.jsx`
- `src/lib/supabase.js`
- `src/components/AuthCard.jsx`
- `src/components/DashboardShell.jsx`
- `src/components/RecordComposer.jsx`
- `src/components/RecordList.jsx`
- `src/styles/app.css`

Legacy static files can be replaced as part of the migration because the user approved a full overwrite rather than parallel versions.

## Verification Plan

Manual verification targets:

- register flow submits correctly
- login flow submits correctly
- session persists across refresh when expected
- logout returns the app to logged-out state
- record creation works
- records list loads only for the current user
- empty state displays correctly
- layout remains usable on mobile

## Risks and Constraints

- Supabase email confirmation may block immediate login depending on project settings
- local testing depends on the frontend being served over a normal local HTTP server
- security still depends on proper Supabase RLS outside the frontend

## Decision Summary

Approved choices:

- rebuild with React
- use React + Vite + native CSS
- target a light record app for external users
- optimize equally for writing and browsing
- replace the current static frontend instead of keeping both versions
