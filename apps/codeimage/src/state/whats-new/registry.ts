// Pure metadata with zero imports. Policy and presentation share these ids.

export type Place = 'command-menu' | 'export' | 'control' | 'setting';

export type Where =
  | 'command-menu'
  | 'export'
  | `export:${string}`
  | `control:${string}`
  | `setting:${string}`;

export interface Highlight {
  /**
   * The persisted identity of the user's seen state. Never renamed or reused
   * once shipped.
   */
  readonly id: string;
  /** `null` means no location to point to: no dot and no "Show me". */
  readonly where: Where | null;
  readonly experimental?: true;
  readonly learnMore?: `https://${string}`;
}

export interface Release {
  /** Not an app version. A highlight in the bundle means the feature shipped. */
  readonly id: string;
  /** `YYYY-MM-DD`, read as UTC midnight. Newness expires from this date. */
  readonly date: `${number}-${number}-${number}`;
  /** Major releases announce with the Showcase sheet instead of the Nudge. */
  readonly major: boolean;
  /** Editorial order: the Nudge steps and the dot priority follow it. */
  readonly highlights: readonly Highlight[];
}

/**
 * Newest first. Entries are never deleted, because this is the archive.
 * A highlight in this list means its feature is in the bundle.
 */
export const RELEASES = [
  {
    id: '2026-11',
    date: '2026-11-14',
    major: false,
    highlights: [
      {
        id: 'redact',
        where: null,
      },
      {
        id: 'tabs',
        where: 'export:tabs',
      },
      {
        id: 'command-menu',
        where: 'command-menu',
      },
      {
        id: 'layouts',
        where: 'setting:layout',
        experimental: true,
      },
      {
        id: 'theme-cards',
        where: 'setting:theme-cards',
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

export type ShippedWhere = NonNullable<ShippedHighlight['where']>;
