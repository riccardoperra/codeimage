# Saved projects

Sign in and reopen code saved by autosave.

## Sub-features

Mock GitHub login, New, autosave, project URL, dashboard reopening; card Menu offers rename/clone/delete.

## How to get to it (user POV)

Click Sign in with GitHub. Authenticated `/` is Dashboard; `/dashboard` redirects there. New opens `/<id>` in the classic editor.

## Driving it with Playwright

Audit clicks real login button using the existing Auth0 mock, waits for New, registers POST /api/v1/project before clicking it, records ID, edits code and awaits PUT with 200. Reload and assert exact content. Return via /dashboard and reopen `a[href="/<id>"]`; assert content again. Retain mutation/get bodies and screenshots when investigating persistence.

Source: `pages/Dashboard/components/CreateNewProjectButton/CreateNewProjectButton.tsx`, `ProjectItem/ProjectItem.tsx`, `state/editor/createEditorSync.ts`, `mocks/persist.ts`.

## Gotchas

Doctor after login must expect Dashboard, not an editor. Autosave has a roughly 3s debounce. No real OAuth/Postgres claim: Auth0 and project services use existing development mocks. Closing context removes guest test database. Rename/clone/delete require separate journeys.
