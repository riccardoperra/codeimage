# What’s new

Discover new releases and jump to the feature controls.

## Sub-features

Nudge/showcase, feature dots/coachmarks, Settings archive and Show me destinations.

## How to get to it (user POV)

Fresh eligible visitors receive an announcement; all unified users can open Settings → What’s new.

## Driving it with Playwright

Audit opens `[data-settings-section="whats-new"]`, asserts `[data-setting^="news-"]` archive rows (five today: redact, tabs, command-menu, layouts, theme-cards; only redact has no Show me), captures the archive, clicks Show me scoped to `[data-setting="news-command-menu"]` and checks `[data-command-menu]`. Capture destination as well as closed Settings. For nudge, a fresh profile with eligible release shows complementary What's new; See expands, Next advances, dismiss persists across reload.

Source: `components/WhatsNew/WhatsNewHost.tsx`, `Nudge.tsx`, `state/whats-new/registry.ts`, `pages/UnifiedEditor/shell/sections.tsx`.

## Gotchas

Show me for layouts navigates inside Settings; it does not close Settings. Redact has no destination. Eligibility depends on release age and persisted seen/dismissed facts: news stays new for 45 days after the release date, so the 2026-11-14 release shows the nudge to fresh profiles until 2026-12-29 only. Using a feature marks it seen. Archive is deterministic; do not reset internal stores to claim normal announcement behavior. Dev ?whatsNew=nudge/showcase is a review aid only and works only in a development build. Classic has announcements but no archive.
