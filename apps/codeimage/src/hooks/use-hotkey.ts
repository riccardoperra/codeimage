import {onSettled} from 'solid-js';
import type {KeyBindingMap, KeyBindingOptions} from 'tinykeys';
import {tinykeys} from 'tinykeys';
import {useModality} from '@core/hooks/isMobile';

export function useHotkey(
  target: Window | HTMLElement,
  keyBindingMap: KeyBindingMap,
  options?: KeyBindingOptions,
): void {
  const modality = useModality();
  if (modality !== 'mobile')
    onSettled(() => tinykeys(target, keyBindingMap, options));
}

/**
 * Text fields, the code editor and open dialogs (the command menu, Settings,
 * the shortcut list) handle their own keys.
 */
const KEY_OWNERS = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role=dialog]',
  '[role=alertdialog]',
].join(', ');

/**
 * Whether a global shortcut should leave this key alone, because the focused
 * element owns it. Every app-wide key handler checks it, so typing in a
 * field never toggles the frame, the theme or anything else.
 */
export function isKeyOwnedByFocus(event?: Event): boolean {
  const target =
    event?.target instanceof Element ? event.target : document.activeElement;
  return !!target?.closest(KEY_OWNERS);
}
