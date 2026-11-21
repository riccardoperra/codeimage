# Saved projects

Sign in and reopen code saved by autosave.

## Sub-features

Mock GitHub login, New, autosave, project URL, dashboard reopening; card Menu offers rename/clone/delete.

## How to get to it (user POV)

Click Sign in with GitHub. Authenticated `/` is Dashboard; `/dashboard` redirects there, and `/login` signs in (with the mock, straight to Dashboard). New opens `/<id>` in the unified editor using the saved layout preference. Dashboard search filters only after more than two characters. Unknown paths redirect to `/404`.

## Driving it with Playwright

Audit clicks real login button using the existing Auth0 mock, waits for New, registers POST /api/v1/project before clicking it, records ID, edits code and awaits PUT with 200. Reload and assert exact content. Return via /dashboard and reopen `a[href="/<id>"]`; assert content again. Retain mutation/get bodies and screenshots when investigating persistence.

Source: `pages/Dashboard/components/CreateNewProjectButton/CreateNewProjectButton.tsx`, `ProjectItem/ProjectItem.tsx`, `state/editor/createEditorSync.ts` (250 ms local save), `state/editor/remoteSync.ts` (3 s account save), `mocks/persist.ts`.

The `projects` journey renames through the dashboard and reloads the name. It checks that two search characters leave the card visible, three nonmatching characters hide it, an uppercase query matches the renamed card, and clearing the search restores the card. It then clones the project and verifies identical code under a new ID, deletes both disposable records and checks absence after reload. Supplemental HTTP boundary assertions check DELETE by another owner receives 404, deleted resources return 404 for get/rename/delete, and the list excludes deleted records. A second disposable context restores IndexedDB and delays MSW startup until document load to verify the saved code still opens. This fixture uses mock session authentication only for the boundary test. It closes in finally.

## Gotchas

Doctor after login must expect Dashboard. Account autosave has a roughly 3s debounce. Auth0 and project services use development mocks. Closing the context removes the guest IndexedDB database. Real backend verification has its own [requirements](../references/backend-modes.md).

## Snippet audit cases

`projects` retains dashboard CRUD, code persistence, owner isolation and delayed MSW startup. The cases below cover the unified snippet page. Each runs Inspector, Dock and Studio at 1440x900 and 390x844 in a disposable browser context. They use the helper's owned Vite instance, installed MSW worker and real mock sign-in button. Layouts come from `codeimage:editor-settings` through the shared doctor.

| Case                 | Assertions                                                                                                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `snippet-save`       | Dashboard New opens the unified route. Delayed loading shows the frame placeholder, disables Export and preserves the header and layout boxes. Padding and theme send a successful account save and survive reload.                                                                                                              |
| `snippet-previews`   | Picker hover and command previews change the rendered token colours, restore the applied colours and send no save during the autosave window. Persisted data stays unchanged.                                                                                                                                                    |
| `snippet-read-only`  | A non-owner gets one banner with Clone, immutable code and no editing controls, shortcuts or mutation commands. Inspector and Studio reclaim the panel width. Dock has one compact pill. The frame stays centred and the banner takes no layout space. Settings, PNG download, clipboard PNG and the Share URL remain available. |
| `snippet-clone`      | The read-only banner's Clone opens a new editable account snippet with the same code. Dashboard Clone remains covered by `projects`.                                                                                                                                                                                             |
| `snippet-missing`    | A missing id and a failed GET both reach the visible 404 page.                                                                                                                                                                                                                                                                   |
| `snippet-navigation` | Switching ids loads the correct code and ownership, closes old commands, overlays and Dock pickers, and preserves the separate signed-out local document across route changes.                                                                                                                                                   |

Run the replacement cases from the repository root:

```sh
VERIFY_AUDIT=1 VERIFY_CASES=snippet-save,snippet-previews,snippet-read-only,snippet-clone,snippet-missing,snippet-navigation node .agents/skills/verify-codeimage/scripts/verify.mjs
```

Implementation: `.agents/skills/verify-codeimage/scripts/snippets.mjs`, registered by `scripts/audit.mjs`. Before capturing the rendered read-only snippet, the cases wait for the canvas placeholder to detach and a loaded CodeMirror line to appear. The cases dismiss a visible What's new nudge through its button before bottom controls and read-only screenshots. Each case writes a six-row `<case>-matrix.json` and one trace per layout and size. `read-only/` holds the six requested screenshots. A failing row also saves its accessibility snapshot and screenshot.

Ownership and failed-load fixtures use the existing MSW boundary. Navigation uses an anchor fixture to exercise route updates without reloading the provider. Mock logout reloads the current snippet, so the case waits for the signed-out view before following a link to `/`. Share supplies a Web Share input fixture because headless Chromium has no OS share sheet. It checks the snippet URL passed to that API, not native platform sharing. Clipboard and image downloads use real browser APIs. No editor store or exporter internal is called.

To isolate a snippet matrix lane, set `VERIFY_SNIPPET_LAYOUT=inspector`, `dock`, or `studio`, and `VERIFY_SNIPPET_WIDTH=1440` or `390`. The default remains all six combinations. Each run writes the lanes actually exercised to `<case>-matrix.json`; a selected lane does not establish full matrix coverage. All scenario assertions remain active. These selectors allow fresh Chrome processes when a long-lived local browser exits during repeated context changes.

## Project actions from the dashboard

Run the dashboard case on Node 24 to exercise the CodeUI project menu.

```sh
VERIFY_AUDIT=1 VERIFY_CASES=project-menu \
  VERIFY_BROWSER_CHANNEL=chrome node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The case creates a disposable project in MSW. It opens the menu with ArrowDown and checks that Escape returns focus to its trigger. It opens Rename with Enter and checks the rename response. Then it clones the project, follows the new URL, and deletes the original. It checks both mutation responses and confirms that the rename dialog blocks background clicks while open.

## Read-only notice

Run the focused CodeImage audit under Node 24.

```sh
VERIFY_AUDIT=1 VERIFY_CASES=read-only-notice VERIFY_BROWSER_CHANNEL=chrome \
  node .agents/skills/verify-codeimage/scripts/verify.mjs
```

The case opens a read-only snippet, changes the locale on the existing banner, delays the clone response with MSW, and checks that the button disables until the request completes. It verifies one clone request, navigation to the editable clone, and removal of the banner. Run `snippet-read-only` and `snippet-clone` to cover layout and export behavior.
