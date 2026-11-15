const TABBABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Focus in a text field opens a phone's keyboard over the editor.
const TEXT_FIELD =
  'input:not([type=checkbox], [type=radio], [type=range], [type=button], [type=submit], [type=reset], [type=color], [type=file])';

/**
 * The nearest visible control before or after `from` in tab order, for focus
 * to land on when `from` leaves. Never a text field.
 */
export function tabbableBeside(
  from: Element,
  side: 'before' | 'after',
  skip?: Element,
): HTMLElement | undefined {
  const position =
    side === 'before'
      ? Node.DOCUMENT_POSITION_PRECEDING
      : Node.DOCUMENT_POSITION_FOLLOWING;
  const candidates = [
    ...document.querySelectorAll<HTMLElement>(TABBABLE),
  ].filter(
    element =>
      !from.contains(element) &&
      !skip?.contains(element) &&
      from.compareDocumentPosition(element) & position &&
      element.tabIndex >= 0 &&
      !element.isContentEditable &&
      !element.matches(TEXT_FIELD) &&
      !element.closest('[inert], [aria-hidden="true"]') &&
      element.checkVisibility({visibilityProperty: true}),
  );
  return side === 'before' ? candidates.at(-1) : candidates[0];
}
