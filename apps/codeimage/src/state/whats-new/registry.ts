// Pure content with zero imports, so the Settings archive and the tests can
// render from this file alone.

/**
 * Places in the editor where a feature lives. Adding one means the component
 * that owns the place must register how to reveal it.
 */
export type Where = 'command-menu' | 'settings-experiments';

export interface Highlight {
  /**
   * The persisted identity of the user's seen state. Never renamed or reused
   * once shipped.
   */
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** `null` means no control inside the app: no dot and no "Show me". */
  readonly where: Where | null;
  readonly experimental?: true;
  readonly learnMore?: `https://${string}`;
}

export interface Release {
  /** Not an app version. A highlight in the bundle means the feature shipped. */
  readonly id: string;
  readonly title: string;
  /** `YYYY-MM-DD`, read as UTC midnight. Newness expires from this date. */
  readonly date: `${number}-${number}-${number}`;
  /** Major releases announce with the Showcase sheet instead of the Nudge. */
  readonly major: boolean;
  /** Editorial order: the Nudge steps and the dot priority follow it. */
  readonly highlights: readonly Highlight[];
}

/**
 * Newest first. Entries are never deleted, because this is the archive.
 * A feature PR adds its own highlight here, next to the control it ships.
 */
export const RELEASES = [
  {
    id: '2026-11',
    title: 'CodeImage 2026',
    date: '2026-11-14',
    major: false,
    highlights: [
      {
        id: 'command-menu',
        title: 'Command menu',
        body: 'Find a control or run an action with Cmd/Ctrl+K.',
        where: 'command-menu',
      },
      {
        id: 'layouts',
        title: 'Editor layouts',
        body: 'Choose Inspector, Dock or Studio in Settings, Experiments.',
        where: 'settings-experiments',
        experimental: true,
      },
      {
        id: 'theme-cards',
        title: 'Theme card styles',
        body: 'Choose Window, Orb or Aa list for the theme picker in Settings, Experiments.',
        where: 'settings-experiments',
        experimental: true,
      },
    ],
  },
] as const satisfies readonly Release[];

type ShippedRelease = (typeof RELEASES)[number];
type ShippedHighlight = ShippedRelease['highlights'][number];

export type ReleaseId = ShippedRelease['id'];
export type HighlightId = ShippedHighlight['id'];
/** Only these can carry a dot or a "Show me". */
export type LocatedHighlightId = Extract<
  ShippedHighlight,
  {readonly where: Where}
>['id'];
