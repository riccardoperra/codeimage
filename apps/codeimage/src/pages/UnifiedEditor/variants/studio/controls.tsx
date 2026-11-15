/**
 * The picker switches variants on ArrowLeft, ArrowRight, digits and R from a
 * `document` listener. Solid delegates these handlers to `document` too, and
 * registers first, so only stopImmediatePropagation keeps the keys here.
 */
export function ownKeys(e: KeyboardEvent) {
  if (/^(ArrowLeft|ArrowRight|[0-9rR])$/.test(e.key)) {
    e.stopImmediatePropagation();
  }
}

const COMPOSITE =
  '[role=radiogroup], [role=tablist], [role=listbox], [aria-haspopup=listbox]';

/** Keeps arrow keys and typeahead inside segmented controls, selects and grids. */
export function ownCompositeKeys(e: KeyboardEvent) {
  if ((e.target as Element).closest?.(COMPOSITE)) ownKeys(e);
}
