import {
  Accessor,
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import {bindAll, UnbindFn} from 'bind-event-listener';
import {createStore} from 'solid-js/store';

interface CreateDraggableReturn {
  width: Accessor<number>;
  resizing: Accessor<boolean>;
  ref: Accessor<HTMLElement | undefined>;
  setRef: () => void;
  onResizeStart: (event: MouseEvent) => void;
}

interface CreateDraggableOptions {
  minWidth?: number;
  maxWidth?: number;
}

interface CreateDraggableState {
  width: number;
  startWidth: number;
  startX: number;
  x: number | null;
}

export function createHorizontalResize(
  options?: CreateDraggableOptions,
): CreateDraggableReturn {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [resizing, setResizing] = createSignal<boolean>(false);
  const [minWidth, setMinWidth] = createSignal<number>(options?.minWidth ?? 0);
  const [maxWidth, setMaxWidth] = createSignal<number>(options?.maxWidth ?? 0);

  const [state, setState] = createStore<CreateDraggableState>({
    startWidth: 0,
    width: 0,
    startX: 0,
    x: 0,
  });

  let ownerDocumentEventCleaner: UnbindFn | null = null;

  const onResizeStart = ({clientX}: MouseEvent): void => {
    if (!resizing()) {
      resizeStart(clientX);
    }
  };

  const onMouseUp = (): void => {
    if (resizing()) {
      resizeEnd();
    }
  };

  const onMouseMove = ({clientX}: MouseEvent): void => {
    if (resizing()) {
      resizeMove(clientX);
    }
  };

  const onMouseLeave = (): void => {
    if (!resizing()) {
      resizeEnd();
    }
  };

  const resizeMove = (x: number): void => {
    const {left, width} = ref()?.getBoundingClientRect() || {left: 0, width: 0};
    const middle = (left + width) / 2;
    const min = minWidth();
    const max = maxWidth();
    const isLTR = state.startX >= middle;

    const computedWidth = isLTR
      ? state.startWidth + x - state.startX
      : state.startWidth - x + state.startX;

    const updatable = isLTR
      ? !max || computedWidth <= max
      : !min || computedWidth >= min;

    if (!updatable) {
      return;
    }

    setState({width: computedWidth});
  };

  const resizeStart = (x: number): void =>
    batch(() => {
      setResizing(true);
      setState({startWidth: state.width, startX: x});
    });

  const resizeEnd = (): boolean => setResizing(false);

  const width = createMemo(() => state.width);

  createEffect(
    on(ref, ref => {
      if (!ref) {
        return;
      }

      batch(() => {
        setMinWidth(
          options?.minWidth ||
            Number(
              window.getComputedStyle(ref, '0px').minWidth.split('px')[0],
            ) ||
            0,
        );

        setMaxWidth(
          options?.maxWidth ||
            Number(
              window.getComputedStyle(ref, '0px').maxWidth.split('px')[0],
            ) ||
            0,
        );

        setState({
          width: ref.clientWidth,
        });
      });
    }),
  );

  onCleanup(() => ownerDocumentEventCleaner?.());

  createEffect(
    on(resizing, resizing => {
      if (resizing) {
        const ownerDocument = ref()?.ownerDocument;
        if (!ownerDocument) {
          return;
        }
        // TODO: bindALl could be removed
        ownerDocumentEventCleaner = bindAll(ownerDocument, [
          {type: 'mousemove', listener: onMouseMove, options: {passive: true}},
          {type: 'mouseup', listener: onMouseUp},
          {type: 'mouseleave', listener: onMouseLeave},
        ]);
      } else {
        ownerDocumentEventCleaner?.();
      }
    }),
  );

  return {
    ref,
    setRef,
    resizing,
    width,
    onResizeStart,
  };
}
