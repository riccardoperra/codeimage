# Saved projects

Sign in and reopen code saved by autosave.

## Sub-features

Mock GitHub login, New, autosave, project URL, dashboard reopening; card Menu offers rename/clone/delete.

## How to get to it (user POV)

Click Sign in with GitHub. Authenticated `/` is Dashboard; `/dashboard` redirects there, and `/login` signs in (with the mock, straight to Dashboard). New opens `/<id>` in the classic editor. Dashboard search filters only after more than two characters. Unknown paths redirect to `/404`.

## Driving it with Playwright

Audit clicks real login button using the existing Auth0 mock, waits for New, registers POST /api/v1/project before clicking it, records ID, edits code and awaits PUT with 200. Reload and assert exact content. Return via /dashboard and reopen `a[href="/<id>"]`; assert content again. Retain mutation/get bodies and screenshots when investigating persistence.

Source: `pages/Dashboard/components/CreateNewProjectButton/CreateNewProjectButton.tsx`, `ProjectItem/ProjectItem.tsx`, `state/editor/createEditorSync.ts`, `mocks/persist.ts`.

The projects journey now renames through the dashboard, reloads the name, clones and verifies identical code under a new ID, then deletes both disposable records and checks absence after reload. Supplemental HTTP boundary assertions check DELETE by another owner receives 404, deleted resources return 404 for get/rename/delete, and the list excludes deleted records. A second disposable context restores IndexedDB and delays MSW startup until document load to verify the saved code still opens. This fixture uses mock session authentication only for the boundary test. It closes in finally.

## Gotchas

Doctor after login must expect Dashboard, not an editor. Autosave has a roughly 3s debounce. No real OAuth/Postgres claim: Auth0 and project services use existing development mocks. Closing context removes guest test database. Search and real backend integration still need separate journeys.
