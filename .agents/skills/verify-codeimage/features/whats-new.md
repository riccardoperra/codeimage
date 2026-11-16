# What’s new

Discover new releases and jump to the feature controls.

## Sub-features

Nudge/showcase, feature dots/coachmarks, Settings archive and Show me destinations.

## How to get to it (user POV)

Fresh eligible visitors receive an announcement; all unified users can open Settings → What’s new.

## Driving it with Playwright

Case `whats-new` opens `[data-settings-section="whats-new"]`, asserts at least one `[data-setting^="news-"]` archive row, captures the archive, clicks Show me scoped to `[data-setting="news-command-menu"]`, checks `[data-command-menu]` and waits for Settings to close. The archive has one row per highlight of the release: thirteen for 2026-11-14. Animate, CLI and Redact have no destination (`where: null` in `registry.ts`), so they have no Show me; Show me also hides while its destination is not mounted.

Case `whats-new-nudge` uses a fresh Inspector profile at 1440×900. The 2026-11-14 release is major, so a fresh profile gets the Showcase sheet first, not the Nudge. The case clicks Minimize what's new, waits for the collapsed Nudge, clicks See, checks the `Step N of M` indicator moves from 1 to 2 with Next, clicks Dismiss what's new, waits for the dismissal in IndexedDB (`keyval-store`, key `whats-new`, non-empty `dismissed`), reloads and asserts no announcement returns.

`scripts/news.mjs` exports `dismissNews(page)`. The doctor and the baseline call it, because a fresh profile gets the announcement a moment after the editor settles and it covers the editor: the Showcase sheet for a major release, the Nudge otherwise. It closes the announcement with its own close button and waits for its exit. A `sessionStorage` flag keeps later doctor calls in the same tab from waiting for it again.

Case `whats-new-line-marks-dot` uses a fresh Inspector profile at 1440×900. It closes the announcement, waits for the Line marks dot (`[data-line-marks-news]`, a badge fixed to the viewport beside the marker of the cursor line), moves the inspector to the left in Settings → Appearance, and checks that the dot kept its offset from the marker cell and that the element under the dot is the dot itself. Before the move it turns line numbers on and checks the dot is still on screen at the same offset, then turns them off again. Moving the inspector moves the canvas without a resize or a scroll event, which is how the dot used to be left behind over other controls.

Source: `components/WhatsNew/WhatsNewHost.tsx`, `Nudge.tsx`, `Showcase.tsx`, `components/CustomEditor/plugins/lineMarks/news.tsx`, `state/whats-new/registry.ts`, `pages/UnifiedEditor/shell/sections.tsx`.

## Gotchas

Show me for layouts navigates inside Settings; it does not close Settings. Redact has no destination. Eligibility depends on release age and persisted seen/dismissed facts: news stays new for 45 days after the release date, so the 2026-11-14 release greets fresh profiles (Showcase, then Nudge once minimized) until 2026-12-29 only; after that `whats-new-nudge` and the dismissal in `dismissNews` have nothing to open. Using a feature marks it seen. Archive is deterministic; do not reset internal stores to claim normal announcement behavior. Dev ?whatsNew=nudge/showcase is a review aid only and works only in a development build.
