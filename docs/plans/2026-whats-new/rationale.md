# What's new: registry, seen state, and surface choice

## Problem

The in-app "What's new" has to announce features without blocking the editor, point at the control where each feature lives, and keep an archive. Today one store (`state/version/version.store.ts`) does three jobs: it tracks seen app versions, opens the Changelog dialog on mount, and counts feature views for `FeatureBadge`. The dialog opens only when an MDX file exists for the running app version. The app is 1.10.0 and the newest file is 1.9.0, so returning users get nothing. The new design uses three surfaces (Nudge or Showcase, in-place dots, a Settings archive), so "seen" can no longer be one flag per version.

## Usage (caller's view)

```tsx
// Editor shell: the host knows when it is safe, the core knows what is pending.
const whatsNew = getWhatsNew();
const announcement = whatsNew.announce(() => !isExporting() && !dialogOpen());

<Show when={announcement()}>
  {a => (a().surface === 'nudge' ? <Nudge release={a().release} /> : <Showcase release={a().release} />)}
</Show>

// A control keeps its pointer until the coachmark opens or the feature is used.
<NewDot highlight="command-menu" />

// The owner of a place registers how to open it, and reports use.
whatsNew.bindLocation('command-menu', commandMenu.open);
onChange={value => { preferences.setLayout(value); whatsNew.seen('layouts', 'use'); }}

// Settings archive renders the registry and asks only for the "New" tag.
<For each={RELEASES}>{release => … whatsNew.isNew(h.id) … whatsNew.showMe(h.id, 'library')}</For>
```

## Shape

- **`registry.ts`** is content with zero imports. Releases newest first, each with ordered highlights. `HighlightId`, `ReleaseId` and `LocatedHighlightId` are derived from the data, so a dot on a highlight with no location is a compile error (type-system-discipline).
- **`decide.ts`** is the whole policy as one pure function, `decide(releases, facts, now)`. It returns the single pending announcement, at most three dots in registry order, and the set of fresh highlights. It never reads the clock or the app version (boundary-discipline).
- **Facts** are two grow-only sets, `seen` highlight ids and `dismissed` release ids. Merging is a union, so marking seen is idempotent and two tabs converge without locks (separate-before-serializing-shared-state, make-operations-idempotent).
- **The store** (sketched in `sketch/whats-new.store.ts`) is the thin shell. It owns the one IndexedDB key, the one Umami call site, and the map of location openers.
- **Seen means located.** Only opening the coachmark or using the feature marks a highlight seen. Nudge steps, archive rows and "Show me" do not, so the dot is still on the control when the user arrives.
- **A feature PR adds its own highlight** next to the control it ships. The registry on trunk lists only features that are on trunk.

The public surface is the registry plus eight store members. Callers never see a fact, a storage key or an event name.

## Synthesis decision

Two candidates, one on Opus and one on Fable. No cross-judge ran, because no model from another family was available to the session.

- **Base: candidate 1.** One storage record with a transactional union write, and `bindLocation`, which lets the component that owns a place say how to open it. Adding a highlight is one registry entry and one prop.
- **Grafted from candidate 2.** A single `decide()` returning one `Decision`. Dismissal persisted on dismiss, not on first show. The rule that a release with nothing fresh is not announced. Structural `Release` and `Highlight` interfaces, so tests use fixture registries.
- **Rejected from candidate 2.** One IndexedDB key per fact with a `BroadcastChannel`, because it scans a keyspace shared with other stores. A per-highlight action table inside the core, because it couples the core to editor stores. Coachmark focus owned by the core, which became unnecessary once "Show me" stopped marking seen.
- **Rejected from candidate 1.** Recording the release as announced when first shown, because a reload before reading would lose the announcement.

## Tradeoffs accepted

- We accept that an ignored, undismissed Nudge returns on the next visit, in exchange for never losing an announcement to a reload. Expiry caps it at 45 days.
- We accept per-device state, in exchange for no server sync.
- We accept that "Show me" only reveals the place and does not turn the feature on, in exchange for a core with no dependency on editor stores.
- We accept that two tabs opened together both show the Nudge, in exchange for no cross-tab channel. A dismissal reaches the other tab on its next focus.

## Alternatives considered

- **Keep version-keyed `seen` and add a per-highlight table beside it.** It leaves two sources of truth for "is this new" and keeps the missing-MDX-file failure.
- **Time-staged surfaces** (Showcase for the first days, then Nudge). A user arriving on day ten gets the reduced surface for no reason of their own.
- **Remote config or a product analytics SDK for state.** The content ships with the code and Umami already answers which surface is used.

## Open questions and risks

- Is the 2026 release `major`? It ships as `false`, so it announces with the Nudge.
- Where does the host's `quiet` signal come from? No global "a dialog is open" signal exists today.
- Should registry copy follow the app locale? It is English only in this sketch.
- Should "Show me" later be able to turn a feature on, as the prototype did?
- The Settings archive depends on the new Settings dialog, which lives on `feat/ui-prototypes`.

## Next implementation step

Fill the store shell against the sketch and delete `VersionStore`, the Changelog components, the MDX notes and `FeatureBadge` in the same change.
