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
<NewDot at="command-menu" />

// The owner of a place registers how to open it, and reports use.
whatsNew.bindLocation('command-menu', commandMenu.open);
onChange={value => { preferences.setLayout(value); whatsNew.seen('layouts'); }}

// Settings archive renders the registry and asks only for the "New" tag.
// Show me appears only while a reveal owner for the place is bound.
<For each={RELEASES}>{release => … whatsNew.isNew(h.id) … h.where !== null && whatsNew.canShowMe(h.id) && whatsNew.showMe(h.id, 'library')}</For>
```

## Shape

- **`registry.ts`** is release and highlight metadata with zero imports. Releases newest first, each with ordered highlights. `HighlightId`, `ReleaseId`, `LocatedHighlightId`, and `ShippedWhere` are derived from the data. `where` is the precise place, such as `export:tabs` or `setting:layout`, and `null` means no dot or Show me. `places.ts` checks shipped places against model controls, Export items, and setting IDs derived from real row definitions.
- **`decide.ts`** is the whole policy as one pure function, `decide(releases, facts, now)`. It returns the single pending announcement, at most three dots in registry order, and the set of fresh highlights. It never reads the clock or the app version (boundary-discipline).
- **Facts** are three grow-only sets: `seen` highlight ids, `dismissed` release ids and `minimized` release ids. Merging is a union, so marking seen is idempotent and two tabs converge without locks (separate-before-serializing-shared-state, make-operations-idempotent).
- **The store** (`apps/codeimage/src/state/whats-new/whats-new.store.ts`) is the thin shell. It owns the one IndexedDB key, the one Umami call site, and the map of location openers.
- **Seen means located.** Only opening the coachmark or using the feature marks a highlight seen. Nudge steps, archive rows and "Show me" do not, so the dot is still on the control when the user arrives.
- **The registry lists only features that are in the bundle.** Prepared copy and illustrations for features that land later live under `UPCOMING`; only `RELEASES` supplies policy and rendered surfaces.

Other folders import only `state/whats-new/index.ts`. The public interface is the registry and the store methods. Callers never see a fact, a storage key or an event name.

## Synthesis decision

Two candidates, one on Opus and one on Fable. No cross-judge ran, because no model from another family was available to the session.

- **Base: candidate 1.** One storage record with a transactional union write, and `bindLocation`, which lets the component that owns a place say how to open it. Adding a highlight for an existing place is one registry entry plus its illustration and seen-on-use call. Shared owners render the dots without per-highlight props.
- **Grafted from candidate 2.** A single `decide()` returning one `Decision`. Dismissal persisted on dismiss, not on first show. The rule that a release with nothing fresh is not announced. Structural `Release` and `Highlight` interfaces, so tests use fixture registries.
- **Rejected from candidate 2.** One IndexedDB key per fact with a `BroadcastChannel`, because it scans a keyspace shared with other stores. A per-highlight action table inside the core, because it couples the core to editor stores. Coachmark focus owned by the core, which became unnecessary once "Show me" stopped marking seen.
- **Rejected from candidate 1.** Recording the release as announced when first shown, because a reload before reading would lose the announcement.

## Tradeoffs accepted

- We accept that an ignored, undismissed Nudge returns on the next visit, in exchange for never losing an announcement to a reload. Expiry caps it at 45 days. The store reads the clock again on focus, alongside its fact reload, so tags, dots, and waiting announcements expire during long visits without a timer.
- We accept per-device state, in exchange for no server sync.
- We accept that "Show me" only reveals the place and does not turn the feature on, in exchange for a core with no dependency on editor stores.
- We accept that two tabs opened together both show the Nudge, in exchange for no cross-tab channel. A dismissal reaches the other tab on its next focus and closes an already shown announcement without another write or dismissal event.

## Alternatives considered

- **Keep version-keyed `seen` and add a per-highlight table beside it.** It leaves two sources of truth for "is this new" and keeps the missing-MDX-file failure.
- **Time-staged surfaces** (Showcase for the first days, then Nudge). A user arriving on day ten gets the reduced surface for no reason of their own.
- **Remote config or a product analytics SDK for state.** The content ships with the code and Umami already answers which surface is used.

## Implementation

The first release is `2.0`, titled "CodeImage 2.0", dated `2026-11-14`, with `major: true`. Set the date to the real release day before publishing. It announces Line marks, Social sizes, Signatures, Hide secrets, Window styles, One image per tab, Copy alt text, Command menu, Takumi export engine, Editor layouts, and Theme card styles, in that order. The first six are headline cards in the Showcase. Copy alt text, Command menu and the three experiments have `accessory: true` and appear as still, compact rows under the localized “Also new” heading. The Nudge and archive keep registry order and one presentation for all entries. Takumi, layouts and theme card styles remain experiments. Takumi is optional in Settings, Experiments, with automatic fallback to the current exporter; the integration evidence does not measure performance, so the announcement makes no speed claim. The major changeset is `.changeset/codeimage-2-0.md`. The id can change because this registry has not shipped in app 1.10.0.

The first three eligible dots are marks, social, and signature. A Show me request can use an invisible anchor for a later highlight, so its coachmark remains reachable without changing the three dots or their registry order. Show me opens a coachmark without recording seen. Clicking a dot or acknowledging its coachmark records seen, as does real use. Export reveals its menu and keeps the dot on its arrow because the menu owns focus. Its dot opens a coachmark after the menu closes.

`WhatsNewHost` mounts once in the unified editor and once in the classic editor. While a release waits to be shown, and only then, it lets the editor settle for a moment and then watches the DOM for visible dialogs, menus, and expanded popup triggers, at most once a frame. The watcher stops as soon as the announcement shows, so a visit with nothing pending observes nothing. Inline listboxes, including the theme picker, do not block announcements. The announcement then remains latched until dismissal or minimization. A major release uses the scrollable Showcase sheet unless the user has minimized it; it then announces through the Nudge, including after reload or another tab’s next focus. This release uses the Showcase. Dismiss and Done move focus to the visible control before the card in tab order, before the card becomes inert or unmounts, only if focus is inside the card. Coachmarks use the same rule. It skips text fields, because focus in one, the code editor included, opens a phone's keyboard over the editor for a user who only closed a card. Escape inside the expanded Nudge dismisses it instantly with the same persisted fact; Escape elsewhere leaves it alone. Its native key listener stops the key before document-level shortcuts.

Only deliberately opening or acknowledging a coachmark, or using a feature, records a seen fact. Running a command counts as command-menu use. Switching the export engine in either editor, or choosing a layout or theme card style, counts as use of that experiment. Exporting one image per tab counts as its use in the unified editor, and turning its checkbox on counts in the classic editor. Redact secrets in the Export menu, Redact all in the classic export dialog, or Redact on an editor warning, counts as Hide secrets use. Hide secrets has no dot or Show me because its warning appears when needed, and a conditional anchor would waste one of the three dot slots. Opening the menu through Show me does not consume the One image per tab dot. The Settings archive renders rows from the same registry, with New tags from `isNew()`. Its Show me buttons reveal a location without changing facts.

Coachmarks inside a modal mount their portal inside that dialog. A body portal would be hidden from assistive technology by the modal. Dots remain mounted as invisible anchors until their coachmark closes, so opening one can record the seen fact without destroying the popover. The selected highlight stays pinned through the close animation when another highlight shares its place. The next then takes over the same trigger. When no highlight remains, focus moves to the control before the dot on close. Tab moves to the next control and Shift+Tab to the previous one.

In the unified editor, Export is one control: a button that exports at once and an arrow whose menu offers one image per tab and, while the code holds a possible secret, Redact secrets. The One image per tab dot sits on the arrow. It stays outside the menu because an open menu keeps Tab for itself and the dot could not be reached from the keyboard. Show me opens the menu. The stage owns one reactive phone breakpoint shared by the header and all layouts. Export moves between their complementary placements on resize. Solid creates the new placement before it disposes the old one, so a place is bound when its owner mounts, after that disposal. In the classic editor, the One image per tab dot sits beside its checkbox.

The classic editor has the Nudge and Showcase, with no Settings archive. The Export control binds `export` in the unified editor and the production `ExportButton` binds it in the classic editor, so classic shows Show me and dots for One image per tab and Copy alt text. `holds(at, where)` resolves both dots and reveals. `dotAt(place)` replaces per-highlight dot queries and chooses the first eligible highlight at that place. `bindLocation` binds a kind or a precise place and passes its item to the most specific reveal owner. `CommandMenu` owns its binding and Settings owns `setting`, clearing search before opening the section that contains the row. The harness binds each visible model control through the model's generic control revealer. Each layout registers how to open its panel. The shared revealer waits for a visible row to settle, scrolls it into view, and then the store requests its coachmark. Layouts know no highlight ids or What's new modules. Layouts use `CommandMenuButton` and carry no What's new imports, enforced by lint. `ControlRow` uses the generic `PanelRow.labelAccessory` sibling slot so the dot is outside the label. A second location owner is rejected in development. A binding ends when its Solid owner is disposed. Its Footer and Toolbar link directly to GitHub releases. The former version gate, Changelog, MDX notes and renderer, and the old FeatureBadge are removed together. The unrelated compatibility banner remains.

The development-only query `?whatsNew=nudge` or `?whatsNew=showcase` forces a review view. `await window.resetWhatsNew()` clears the persisted record. Reload after resetting. Production builds remove these aids.

## Remaining limits

- News copy uses the app locale in English, Italian, German and Spanish. `i18n/whatsNew.ts` owns the words, keyed by persisted release and highlight ids. Its records and the illustration record require content for every shipped and upcoming id. The registry keeps no duplicate English copy. Dates use the active locale and UTC, so a date never moves to the previous day west of UTC. The command-menu illustration translates its explanatory labels through existing editor keys. Code samples, geometric pictures and the Aa mark stay unchanged.
- Facts remain per device. Tabs merge facts on focus, with transactional union writes to one IndexedDB key.
- IndexedDB writes are asynchronous. Browser checks wait for the dismissal write before reloading.
- Floating announcements cover editor controls beneath them. They can be dismissed without changing the layout.
- The Showcase scrolls the full ten-highlight list inside a height that reserves room for its header at 390px. Release titles are read by id from the locale records because the translation resolver splits dotted ids such as `2.0`.

## Highlights shipped in 2.0

| Id              | Place                       | Real use                                                         |
| --------------- | --------------------------- | ---------------------------------------------------------------- |
| `redact`        | `null`                      | Redact in the editor or export review                            |
| `tabs`          | `export:tabs`               | Run the per-tab export, or enable its classic checkbox           |
| `social`        | `control:frame.aspectRatio` | Apply a social export target, including through the command menu |
| `signature`     | `control:signature.saved`   | Enter a nonempty handle or apply a saved signature               |
| `marks`         | `editor:line-marks`         | Change a line mark or import pasted annotations or a diff        |
| `alt`           | `export:alt`                | Successfully copy alt text                                       |
| `window-styles` | `control:window.style`      | Apply a window style, including through the command menu         |
| `command-menu`  | `command-menu`              | Run a command                                                    |
| `takumi`        | `setting:rendering-engine`  | Switch the export engine                                         |
| `layouts`       | `setting:layout`            | Choose a layout                                                  |
| `theme-cards`   | `setting:theme-cards`       | Choose a theme card style                                        |

`signature.saved` is always visible even when the signature is off. Dock draws it in More's Signature group. Inspector and Studio draw it in the shared signature dialog reached from the Frame panel. The handle is not a consistent panel anchor across layouts. The generic reveal opens that shared dialog when necessary.

Two line-marks designs were considered before implementation:

- Put a dot inside a gutter marker. It is close to the action, but the marker is a button, and nesting another button is invalid. Its scaled gutter DOM is also inside the captured editor.
- Let the interactive plugin render a separate badge beside the active line, into `document.body`. This keeps its own keyboard target and leaves code geometry unchanged. The read-only export extension never mounts it.

The second design is implemented as `editor:line-marks`. The plugin owns the binding, the position measurement, and disposal. `places.ts` accepts only that editor place. The badge moves with the active line and hides when another UI covers its anchor. The gutter occlusion probe stays at the cell centre because a scaled cell can be narrower than the former 10px inset; this also keeps markers available on a narrow phone without a news badge. Changing marks emits user transaction metadata; loading marks and undoing them do not consume the highlight.

`window.style` retains its original `headerVisible` condition: with the header off, Card, Editor and Terminal draw the same code body. The harness binds only model controls whose visibility condition holds, so the hidden row has no dot or Show me. Studio renders and reveals controls from the same exhaustive placement map; Dock already uses an exhaustive map and Inspector uses the model sections. Controls that bypass `ControlRow` still need a shared renderer before they can be highlighted. None of the 2.0 targets bypasses it.

Classic frame and window controls also record social-size, signature, and window-style use through their user change handlers. Loading a project does not record use.

## Prepared highlights and how to ship them

`UPCOMING` is a content staging list. Nothing in it is rendered or passed to `decide`, `dotAt`, the Showcase, the Nudge or the Settings archive. `HighlightId` remains the shipped identity type used for facts and telemetry; `ContentHighlightId` adds upcoming identities for complete locale and illustration records.

The Animate entry describes code steps, pauses, transitions, easing and preview. The inspected `origin/feat/animate-new-ui` plan explicitly excludes web export (A4) and MP4 (A5); `origin/feat/a2-animation-cli` exports animated images. Do not announce video export until its implementation has landed and this copy is updated. The CLI entry describes source files or standard input, themes and presets, and terminal or CI use. No stable public CLI documentation URL was found in the repository, so it has no `learnMore` link.

To ship a prepared highlight:

1. Confirm its feature and the capabilities described by its copy are on `main` and in the bundle.
2. Move its one entry from `UPCOMING` into the release’s `highlights`: **animate first of all**, **cli immediately after window-styles**. Both are headline highlights; leave `accessory` absent. The content types derive automatically from the two lists, so no locale or illustration changes are required.
3. Keep `where: null` until a shared owner can bind its real place. Add a stable documentation link when one is published. A located feature also needs seen-on-use integration and a place check.
4. Confirm unique ids, policy and content tests. Update the explicit editorial order test when moving the entry. Check the three surfaces and both themes, and set the release date to its actual publishing date.

## Minimizing the Showcase

The minus button records only a `minimized` release id and emits `whats-new-minimized` once. It leaves `seen` and `dismissed` untouched. All three fact sets merge by union; old version-1 records without `minimized` parse as an empty set. The pending decision also compares surface, so focus refresh can replace a currently open Showcase with a Nudge after another tab minimizes it.

Pointer minimization uses a 200ms ease-out exit of the dialog panel, with its origin at bottom left, scaling toward the Nudge’s width (capped at .94) while translating toward the Nudge’s bottom-left placement. It fades while moving, and the Nudge enters when the exit finishes. Escape and close can interrupt the exit and still dismiss. Keyboard minimization skips the exit and Nudge entrance entirely and focuses the Nudge’s first control. Pointer cleanup returns focus to a safe button rather than a text field. Reduced motion uses opacity only. On phones the Nudge reserves 76px plus the safe-area inset, leaving room above the bottom controls.

The drawings are flat: opaque token-based surfaces, two-pixel strokes, six-pixel window radii and independently drawn 64×44 thumbnails. `play` uses one viewport observer that disconnects after the first intersection; CSS only animates transform and opacity, while `still`, `thumb`, reduced motion and keyboard-triggered steps show the final state. The Apple design skill’s spatial consistency and restrained feedback complement the Emil design-engineering skill; the owner’s flat-art direction takes precedence over material effects.

## Round four illustration language

The owner’s prototype supersedes the earlier flat, outlined-window direction.
The media panels stay `#0f0f10` in both themes: the bars, green secret, chips and
canvas gradients retain their contrast in Showcase cards and the small Settings
archive rows. The surrounding sheet and cards follow the selected theme.

Marks, redact, social sizes, tabs, alt text and CLI port the prototype’s filled
HTML/CSS language: 8px abstract bars, full-bleed tinted marks, 10–11px labels and
orange/purple, blue and pink/orange canvas tiles. Takumi replaces the prototype’s
flask and label with bars flowing into a rendered PNG tile; it makes no speed
claim. Signatures, window styles, command menu, layouts, theme cards and Animate
extend the same shapes. UI words come from type-complete locale records.

Each illustration has a separately composed 64×44 symbol, a complete still
state and one explanation on first viewport entry. The viewport observer
immediately disconnects. Motion uses transform and opacity with shared tokens;
reduced motion uses opacity alone, and keyboard-triggered Nudge steps are instant.
