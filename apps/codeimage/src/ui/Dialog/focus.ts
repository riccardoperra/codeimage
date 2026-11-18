interface Layer {
  panel: HTMLDivElement;
  modal: boolean;
  close: () => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onFocusOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
  includes?: (element: Element) => boolean;
  dismissModalOutside?: boolean;
}

const layers: Layer[] = [];

let unlockPage: (() => void) | undefined;

const focusable =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[contenteditable="true"],[tabindex]';

function focusTargets(panel: HTMLElement) {
  return [...panel.querySelectorAll<HTMLElement>(focusable)].filter(
    element =>
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      !element.closest('[inert], [aria-hidden="true"]') &&
      getComputedStyle(element).visibility !== 'hidden',
  );
}

function containsFocus(layer: Layer, target: Element) {
  if (layer.panel.contains(target) || layer.includes?.(target)) return true;
  const controls = layer.panel.querySelectorAll(
    '[aria-expanded="true"][aria-controls]',
  );
  return Array.from(controls).some(control =>
    control
      .getAttribute('aria-controls')
      ?.split(/\s+/)
      .some(id =>
        layer.panel.ownerDocument.getElementById(id)?.contains(target),
      ),
  );
}

function lockPage(panel: HTMLElement) {
  const body = panel.ownerDocument.body;
  const root = panel.ownerDocument.getElementById('root');
  const pointer = body.style.pointerEvents;
  const overflow = body.style.overflow;
  const alreadyInert = root?.inert;
  if (root && !root.contains(panel)) root.inert = true;
  body.style.pointerEvents = 'none';
  body.style.overflow = 'hidden';

  return () => {
    body.style.pointerEvents = pointer;
    body.style.overflow = overflow;
    if (root) root.inert = alreadyInert ?? false;
  };
}

function focusEvent(
  panel: HTMLElement,
  name: string,
  handler?: (event: Event) => void,
) {
  const event = new Event(name, {bubbles: true, cancelable: true});
  if (handler) panel.addEventListener(name, handler, {once: true});
  panel.dispatchEvent(event);
  return event.defaultPrevented;
}

function outsideEvent(original: Event) {
  const event = new CustomEvent('dialog.interactOutside', {
    cancelable: true,
    detail: {originalEvent: original},
  });
  Object.defineProperty(event, 'target', {value: original.target});
  return event;
}

function focusNext(event: KeyboardEvent, panel: HTMLElement) {
  const targets = focusTargets(panel);
  const first = targets[0] ?? panel;
  const last = targets.at(-1) ?? panel;
  const active = panel.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || active === panel)) {
    event.preventDefault();
    first.focus();
  }
}

export function activateDialog(layer: Layer) {
  const {panel} = layer;
  const doc = panel.ownerDocument;
  const opener = doc.activeElement;
  const previousPanel = layers.at(-1)?.panel;
  const wasInert = previousPanel?.inert;
  if (layer.modal && previousPanel && !previousPanel.contains(panel)) {
    previousPanel.inert = true;
  }
  layers.push(layer);

  if (layer.modal) unlockPage ??= lockPage(panel);
  const events = new AbortController();
  const panelContent = layer.modal
    ? new MutationObserver(() => {
        if (
          layers.at(-1) !== layer ||
          !panel.isConnected ||
          doc.activeElement !== doc.body
        )
          return;
        (focusTargets(panel)[0] ?? panel).focus({preventScroll: true});
      })
    : undefined;
  panelContent?.observe(panel, {childList: true, subtree: true});

  panel.addEventListener(
    'keydown',
    event => {
      if (layers.at(-1) !== layer || event.defaultPrevented) return;
      layer.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'Tab' && layer.modal) focusNext(event, panel);
      if (event.key !== 'Escape') return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[aria-haspopup="listbox"][aria-expanded="true"][aria-controls]',
        )
      )
        return;
      layer.onEscapeKeyDown?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      layer.close();
    },
    {signal: events.signal},
  );

  doc.addEventListener(
    'pointerdown',
    event => {
      const target = event.target;
      if (
        layers.at(-1) !== layer ||
        event.button !== 0 ||
        !(target instanceof Element) ||
        containsFocus(layer, target)
      )
        return;
      if (
        layer.modal &&
        !layer.dismissModalOutside &&
        !target.closest('[data-dialog-backdrop]')
      )
        return;
      const outside = outsideEvent(event);
      layer.onPointerDownOutside?.(outside);
      layer.onInteractOutside?.(outside);
      if (outside.defaultPrevented) return;
      if (layer.modal) event.preventDefault();
      layer.close();
    },
    {signal: events.signal},
  );

  if (!layer.modal) {
    doc.addEventListener(
      'focusin',
      event => {
        if (
          layers.at(-1) !== layer ||
          !(event.target instanceof Element) ||
          containsFocus(layer, event.target)
        )
          return;
        const outside = outsideEvent(event);
        layer.onFocusOutside?.(outside);
        layer.onInteractOutside?.(outside);
        if (!outside.defaultPrevented) layer.close();
      },
      {signal: events.signal},
    );
  }

  queueMicrotask(() => {
    if (events.signal.aborted || layers.at(-1) !== layer || !panel.isConnected)
      return;
    if (focusEvent(panel, 'focusScope.autoFocusOnMount', layer.onOpenAutoFocus))
      return;
    const target =
      panel.querySelector<HTMLElement>('[autofocus]') ??
      focusTargets(panel)[0] ??
      panel;
    target.focus({preventScroll: true});
  });

  return () => {
    events.abort();
    panelContent?.disconnect();
    const wasTop = layers.at(-1) === layer;
    layers.splice(layers.indexOf(layer), 1);
    if (layer.modal && previousPanel && wasInert !== undefined) {
      previousPanel.inert = wasInert;
    }
    if (!layers.some(entry => entry.modal)) {
      unlockPage?.();
      unlockPage = undefined;
    }

    if (!wasTop) return;
    const next = layers.at(-1);
    queueMicrotask(() => {
      if (layers.at(-1) !== next) return;
      if (
        focusEvent(
          panel,
          'focusScope.autoFocusOnUnmount',
          layer.onCloseAutoFocus,
        )
      )
        return;
      const active = doc.activeElement;
      if (active !== doc.body && active && !panel.contains(active)) return;
      if (
        opener instanceof HTMLElement &&
        opener.isConnected &&
        !opener.closest('[inert]')
      ) {
        opener.focus({preventScroll: true});
      } else if (next) {
        (focusTargets(next.panel)[0] ?? next.panel).focus({
          preventScroll: true,
        });
      }
    });
  };
}
