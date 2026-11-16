/** What formatting a tab by its editor id needs from the editor stores. */
export interface FormatTabDeps {
  readonly editors: () => readonly {readonly id: string}[];
  readonly isActive: (id: string) => boolean;
  readonly select: (id: string) => void;
  /** The Format code action on the active tab: true once it formatted. */
  readonly format: () => Promise<unknown>;
}

/**
 * Formats the tab with this editor id, selecting it first, as Format code
 * does. False when the tab is gone or the code did not format.
 */
export async function formatTab(
  deps: FormatTabDeps,
  id: string,
): Promise<boolean> {
  if (!deps.editors().some(editor => editor.id === id)) return false;
  if (!deps.isActive(id)) deps.select(id);
  return (await deps.format()) === true;
}
