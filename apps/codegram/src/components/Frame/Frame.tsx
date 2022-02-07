import {batch, Component, createMemo, onCleanup, onMount} from 'solid-js';
import {createStore} from 'solid-js/store';
import {bindAll, UnbindFn} from 'bind-event-listener';
import {noop} from '../../core/constants/noop';
import * as styles from './Frame.css';
import {assignInlineVars} from '@vanilla-extract/dynamic';

export const Frame: Component<{
  background: string | null;
  padding: number;
}> = props => {
  let el!: HTMLDivElement;
  let ownerDocumentEventCleaner: UnbindFn | null = null;

  const [state, setState] = createStore<{
    width: number | null;
    minWidth: number | null;
    resizing: boolean;
    startOffsetX: number | null;
    x: number | null;
  }>({
    width: null,
    minWidth: null,
    startOffsetX: null,
    resizing: false,
    x: null,
  });

  const pxWidth = createMemo(() => `${state.width ?? 0}px`);

  const onMouseUp = (): void => (state.resizing ? resizeEnd() : noop());

  const onMouseDown = ({clientX}: MouseEvent): void => resizeStart(clientX);

  const onMouseMove = ({clientX}: MouseEvent): void =>
    state.resizing ? resizeMove(clientX) : noop();

  const onMouseLeave = (): void => (state.resizing ? resizeEnd() : noop());

  const resizeStart = (x: number): void =>
    batch(() =>
      setState({
        resizing: true,
        startOffsetX: x - (state.x ?? state.width ?? 0),
      }),
    );

  const resizeMove = (x: number): void => {
    const computedWidth = x - (state.startOffsetX ?? 0) - (state.x ?? 0);
    if (computedWidth >= (state.minWidth ?? 0)) {
      setState({
        width: computedWidth,
      });
    }
  };

  const resizeEnd = (): void =>
    setState({
      resizing: false,
      startOffsetX: null,
    });

  onMount(() => {
    setState({
      width: el.clientWidth,
      minWidth: Number(
        window.getComputedStyle(el, '0px').minWidth.split('px')[0],
      ),
    });

    ownerDocumentEventCleaner = bindAll(el.ownerDocument, [
      {type: 'mousemove', listener: onMouseMove, options: {passive: true}},
      {type: 'mouseup', listener: onMouseUp},
      {type: 'mouseleave', listener: onMouseLeave},
    ]);
  });

  onCleanup(() => {
    ownerDocumentEventCleaner?.();
  });

  return (
    <div
      class={styles.container}
      style={assignInlineVars({
        [styles.frameVars.width]: pxWidth(),
        [styles.frameVars.backgroundColor]: props.background ?? 'transparent',
        [styles.frameVars.padding]: `${props.padding}px`,
      })}
      ref={el}
    >
      <div class={styles.dragControls}>
        <div class={styles.dragControlLeft} onMouseDown={onMouseDown} />
        <div class={styles.dragControlRight} onMouseDown={onMouseDown} />
      </div>
      {props.children}
    </div>
  );
};
