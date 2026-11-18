import type {ReadOnlyNoticeProps} from './read-only-notice-props';

export function mountReadOnlyNotice(
  target: HTMLElement,
  props: ReadOnlyNoticeProps,
): {
  update(props: ReadOnlyNoticeProps): void;
  dispose(): void;
};
