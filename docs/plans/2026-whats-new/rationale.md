# What's new: registry, seen state, and surface choice

## Problem

The in-app "What's new" has to announce features without blocking the editor, point at the control where each feature lives, and keep an archive. The former `VersionStore` did three jobs: it tracked seen app versions, opened the Changelog dialog on mount, and counted feature views for `FeatureBadge`. Its dialog opened only when an MDX file existed for the running app version. The app was 1.10.0 and the newest file was 1.9.0, so returning users received nothing. The new design uses three surfaces (Nudge or Showcase, in-place dots, a Settings archive), so "seen" can no longer be one flag per version.

## Usage (caller's view)

```tsx
// Editor shell: the host knows when it is safe, the core knows what is pending.
const whatsNew = getWhatsNew();
// The watcher runs only while a release waits, and is disposed once it shows.
const announcement = whatsNew.announce(() => watchQuiet(isQuiet));

<Show when={announcement()}>
  {a => (a().surface === 'nudge' ? <Nudge release={a().release} /> : <Showcase release={a().release} />)}
</Show>

// A control keeps its pointer until the coachmark opens or the feature is used.
<NewDot highlight="command-menu" />

// The owner of a place registers how to open it, and reports use.
whatsNew.bindLocation('command-menu', commandMenu.open);
onChange={value => { preferences.setLayout(value); whatsNew.seen('layouts'); }}

// Settings archive renders the registry and asks only for the "New" tag.
// Show me appears only while the owner of the place is mounted.
<For each={RELEASES}>{release => … whatsNew.isNew(h.id) … whatsNew.canShowMe(h.id) && whatsNew.showMe(h.id, 'library')}</For>
```

## Shape

- **`registry.ts`** is content with zero imports. Releases newest first, each with ordered highlights. `HighlightId`, `ReleaseId` and `LocatedHighlightId` are derived from the data, so a dot on a highlight with no location is a compile error (type-system-discipline).
- **`decide.ts`** is the whole policy as one pure function, `decide(releases, facts, now)`. It returns the single pending announcement, at most three dots in registry order, and the set of fresh highlights. It never reads the clock or the app version (boundary-discipline).
- **Facts** are two grow-only sets, `seen` highlight ids and `dismissed` release ids. Merging is a union, so marking seen is idempotent and two tabs converge without locks (separate-before-serializing-shared-state, make-operations-idempotent).
- **The store** (`apps/codeimage/src/state/whats-new/whats-new.store.ts`) is the thin shell. It owns the one IndexedDB key, the one Umami call site, and the map of location openers.
- **Seen means located.** Only opening the coachmark or using the feature marks a highlight seen. Nudge steps, archive rows and "Show me" do not, so the dot is still on the control when the user arrives.
- **The registry lists only features that are in the bundle.** Highlights for features that land later are added together in one final PR for the release, not by each feature PR.

Other folders import only `state/whats-new/index.ts`. The public interface is the registry plus nine store members. Callers never see a fact, a storage key or an event name.

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

## Implementation

The first release is `2026-11`, dated `2026-11-14`. Change its date on shipping day. It announces Hide secrets, One image per tab, Command menu, Editor layouts, and Theme card styles, in that order. Layouts and theme card styles are experiments. Five located highlights compete for three dots, so a first visit holds dots for Hide secrets, One image per tab, and Command menu, and the Experiments dots wait until one of those is seen. A bundle never announces a feature that it does not contain.

`WhatsNewHost` mounts once in the unified editor and once in the classic editor. While a release waits to be shown, and only then, it lets the editor settle for a moment and then watches the DOM for visible dialogs, menus, and expanded popup triggers, at most once a frame. The watcher stops as soon as the announcement shows, so a visit with nothing pending observes nothing. Inline listboxes, including the theme picker, do not block announcements. The announcement then remains latched until dismissal. A major release uses the scrollable Showcase sheet. This release uses the Nudge.

Only opening a coachmark or using a feature records a seen fact. Running a command counts as command-menu use. Choosing a layout or theme card style counts as use of that experiment. Turning on One image per tab counts as its use. Redact all in the export dialog, or Redact on an editor warning, counts as Hide secrets use. Opening the menu through Show me does not consume its dot. The Settings archive renders rows from the same registry, with New tags from `isNew()`. Its Show me buttons reveal a location without changing facts.

Coachmarks inside a modal mount their portal inside that dialog. A body portal would be hidden from assistive technology by the modal. Dots remain mounted as invisible anchors until their coachmark closes, so opening one can record the seen fact without destroying the popover. Because the dot leaves as the coachmark closes, the dot moves focus itself: to the control before it on close, and to the control after it on Tab.

The Hide secrets dot sits beside the export dialog's secrets warning, which exists only while the code holds a possible secret. Without one, its dot has no anchor and still holds one of the three slots, and its Show me opens an export dialog with no warning in it. We accept this, because a dot on any control that is always there would point at something other than the feature.

The classic editor has the Nudge and Showcase, with no Settings archive. The production `ExportButton` binds `export` in both editors, so classic shows Show me and dots for the two export highlights only. A binding ends when the component that made it unmounts. Its Footer and Toolbar link directly to GitHub releases. The former version gate, Changelog, MDX notes and renderer, and the old FeatureBadge are removed together. The unrelated compatibility banner remains.

The development-only query `?whatsNew=nudge` or `?whatsNew=showcase` forces a review view. `await window.resetWhatsNew()` clears the persisted record. Reload after resetting. Production builds remove these aids.

## Remaining limits

- News copy is English only.
- Facts remain per device. Tabs merge facts on focus, with transactional union writes to one IndexedDB key.
- IndexedDB writes are asynchronous. Browser checks wait for the dismissal write before reloading.
- Floating announcements cover editor controls beneath them. They can be dismissed without changing the layout.
- The Showcase is built and available for review, but this release is not major.

## Highlights for the 2.0 PR

The first release becomes "CodeImage 2.0" in one final PR, opened when the features below are on trunk. That PR renames the release, decides `major`, and adds each highlight with its dot and its illustration. The copy is a draft to check against the shipped behaviour.

| Id | Title | Draft copy | Where the control lives | Source PR |
| --- | --- | --- | --- | --- |
| `social` | Social sizes | Frame presets sized for the networks you post on, with an optional handle signature. | Frame controls | #696 |
| `alt` | Alt text | Copy a description of your snippet to paste along with the image. | Export dialog | #693 |
| `marks` | Line marks | Mark lines as added, removed, highlighted or focused. | Code controls | #698 |
| `takumi` | New renderer | A faster export engine. Experimental. | Settings, Experiments | #701 |
| `cli` | codeimage CLI | Render the same image from your terminal or CI. | No control in the app, link to the docs | #702 |
| `animate` | Code animations | Animate between code steps and export the result. | Animate panel | #707 and the PRs stacked on it |

Open for that PR:

- Whether 2.0 announces with the Showcase (`major: true`) or the Nudge.
- Which PR carries the `major` changeset for `@codeimage/app`.
- `redact` has no anchor while the code holds no possible secret, yet it takes one of the three dot slots. Decide whether it keeps a dot.
