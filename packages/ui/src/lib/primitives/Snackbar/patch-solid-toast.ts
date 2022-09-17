import clsx from 'clsx';
import {createUniqueId} from 'solid-js';
import {Message, toast, ToastHandler, ToastOptions} from 'solid-toast';
import * as styles from './Snackbar.css';

interface AugmentedOptions extends ToastOptions {
  theme?: string;
}

export type AugmentedToastHandler = (
  message: Message,
  options?: AugmentedOptions,
) => string;

export function createPatch(_toast: typeof toast, key: keyof typeof toast) {
  const old = _toast[key] as ToastHandler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (toast as any)[key] = (message: Message, options?: AugmentedOptions) => {
    if (options?.theme) {
      const theme = options.theme;
      const id = createUniqueId();
      options.id = id;
      options.className = clsx(options.className, options.id);
      queueMicrotask(() => {
        document
          .querySelector(`.${id}`)
          ?.setAttribute('data-codeimage-theme', theme);
      });
    }
    if (options?.className) {
      options.className = clsx(options.className, styles.snackbar);
    }

    return old(message, options);
  };

  return toast[key] as AugmentedToastHandler;
}
