import tinykeys, {KeyBindingMap, KeyBindingOptions} from 'tinykeys';
import {useModality} from '../core/hooks/isMobile';
import {noop} from '../core/constants/noop';
import {onCleanup} from 'solid-js';

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
