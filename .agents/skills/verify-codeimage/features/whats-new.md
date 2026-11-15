# What’s new

Discover new releases and jump to the feature controls.

## Sub-features

Nudge/showcase, feature dots/coachmarks, Settings archive and Show me destinations.

## How to get to it (user POV)

Fresh eligible visitors receive an announcement; all unified users can open Settings → What’s new.

## Driving it with Playwright

Audit opens `[data-settings-section="whats-new"]`, asserts `[data-setting^="news-"]` archive rows (five today: redact, tabs, command-menu, layouts, theme-cards; only redact has no Show me), captures the archive, clicks Show me scoped to `[data-setting="news-command-menu"]` and checks `[data-command-menu]`. Capture destination as well as closed Settings. For nudge, a fresh profile with eligible release shows complementary What's new; See expands, Next advances, dismiss persists across reload.

`scripts/news.mjs` exports `dismissNews(page)`. The doctor and the baseline call it, because a fresh profile gets the announcement a moment after the editor settles and it covers the editor: the Showcase sheet for a major release, the Nudge otherwise. It closes the announcement with its own close button and waits for its exit. A `sessionStorage` flag keeps later doctor calls in the same tab from waiting for it again.

Case `whats-new-line-marks-dot` uses a fresh Inspector profile at 1440×900. It closes the announcement, waits for the Line marks dot (`[data-line-marks-news]`, a badge fixed to the viewport beside the marker of the cursor line), moves the inspector to the left in Settings → Appearance, and checks that the dot kept its offset from the marker cell and that the element under the dot is the dot itself. Moving the inspector moves the canvas without a resize or a scroll event, which is how the dot used to be left behind over other controls.

Source: `components/WhatsNew/WhatsNewHost.tsx`, `Nudge.tsx`, `Showcase.tsx`, `components/CustomEditor/plugins/lineMarks/news.tsx`, `state/whats-new/registry.ts`, `pages/UnifiedEditor/shell/sections.tsx`.

## Gotchas

Show me for layouts navigates inside Settings; it does not close Settings. Redact has no destination. Eligibility depends on release age and persisted seen/dismissed facts: news stays new for 45 days after the release date, so the 2026-11-14 release shows the nudge to fresh profiles until 2026-12-29 only. Using a feature marks it seen. Archive is deterministic; do not reset internal stores to claim normal announcement behavior. Dev ?whatsNew=nudge/showcase is a review aid only and works only in a development build.
