import {isFirefox} from '@solid-primitives/platform';
import {Accessor, createSignal, onMount} from 'solid-js';

export function useWebshare(): [
  supported: Accessor<boolean>,
  canShare: (data: ShareData) => boolean,
  share: (data: ShareData) => Promise<void> | null,
] {
  const [supported, setSupported] = createSignal(true);
  onMount(() => {
    setSupported(true);
  });

  const canShare = (data: ShareData): boolean => {
    if (!supported() || !navigator['share']) {
      return false;
    }
    if (navigator['canShare']) {
      return navigator.canShare(data);
    }
    if (isFirefox) {
      return !data.files;
    }
    return true;
  };

  const share = (data: ShareData) => {
    const shareable = canShare(data);
    if (!shareable) return null;
    return navigator.share(data);
  };

  return [supported, canShare, share];
}
