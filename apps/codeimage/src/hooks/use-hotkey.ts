import {onCleanup} from 'solid-js';
import type {KeyBindingMap, KeyBindingOptions} from 'tinykeys';
import {tinykeys} from 'tinykeys';
import {noop} from '../core/constants/noop';
import {useModality} from '../core/hooks/isMobile';

export function useHotkey(
  target: Window | HTMLElement,
  keyBindingMap: KeyBindingMap,
  options?: KeyBindingOptions,
): () => void {
  const modality = useModality();

  if (modality === 'mobile') return noop;

  const unsubscribe = tinykeys(target, keyBindingMap, options);
  onCleanup(() => unsubscribe());

  return unsubscribe;
}
