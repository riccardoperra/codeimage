import {mountReadOnlyNotice} from 'virtual:codeimage-solid2-islands';
import {createEffect, onCleanup, onMount} from 'solid-js';
import type {ReadOnlyNoticeProps} from './read-only-notice-props';
import {noticeIsland} from './snippet.css';

export default function ReadOnlyNoticeIsland(props: ReadOnlyNoticeProps) {
  let target: HTMLDivElement | undefined;
  const snapshot = (): ReadOnlyNoticeProps => ({
    title: props.title,
    cloneLabel: props.cloneLabel,
    bannerClass: props.bannerClass,
    titleClass: props.titleClass,
    buttonClass: props.buttonClass,
    onClone: props.onClone,
  });

  onMount(() => {
    if (!target) return;
    const connection = mountReadOnlyNotice(target, snapshot());
    createEffect(() => connection.update(snapshot()));
    onCleanup(connection.dispose);
  });

  return (
    <div
      class={noticeIsland}
      ref={element => {
        target = element;
      }}
      data-solid2-read-only-notice
    />
  );
}
