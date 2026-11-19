import type {JSX} from '@solidjs/web';
import {Dynamic, Portal as WebPortal} from '@solidjs/web';
import clsx from 'clsx';
import type {ParentProps} from 'solid-js';
import {
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  omit,
  Show,
  untrack,
  useContext,
} from 'solid-js';
import {activateDialog} from './focus';
import * as styles from './Dialog.css';

export interface DialogRootProps extends ParentProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  exitDuration?: number;
}

interface DialogState {
  readonly open: boolean;
  readonly modal: boolean;
  readonly present: boolean;
  titleId: string;
  close: () => void;
}

const Context = createContext<DialogState>();

export function Root(props: DialogRootProps) {
  const [present, setPresent] = createSignal(untrack(() => props.open));

  createEffect(
    () => [props.open, props.exitDuration] as const,
    ([open, exitDuration]) => {
      if (open) {
        setPresent(true);
        return;
      }
      if (!untrack(present)) return;
      const delay = matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : (exitDuration ?? styles.duration);
      if (delay === 0) {
        setPresent(false);
        return;
      }
      const timeout = setTimeout(() => setPresent(false), delay);
      return () => clearTimeout(timeout);
    },
    {defer: true},
  );

  const context: DialogState = {
    get open() {
      return props.open;
    },
    get modal() {
      return props.modal !== false;
    },
    get present() {
      return props.exitDuration === 0 ? props.open : present();
    },
    titleId: createUniqueId(),
    close: () => props.onOpenChange?.(false),
  };
  return <Context value={context}>{props.children}</Context>;
}

export function Portal(props: ParentProps<{mount?: Element}>) {
  const context = useContext(Context);
  return (
    <Show when={context.present}>
      <WebPortal mount={props.mount}>{props.children}</WebPortal>
    </Show>
  );
}

type DivProps = JSX.HTMLAttributes<HTMLDivElement>;

export function Overlay(props: DivProps) {
  const context = useContext(Context);
  return (
    <div
      {...props}
      class={clsx(styles.interactive, props.class)}
      aria-hidden="true"
      data-dialog-backdrop
      data-expanded={context.open ? '' : undefined}
      data-closed={context.open ? undefined : ''}
    />
  );
}

interface ContentProps extends Omit<DivProps, 'onKeyDown'> {
  onKeyDown?: (event: KeyboardEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onFocusOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
}

export function Content(props: ContentProps) {
  const context = useContext(Context);
  const [panel, setPanel] = createSignal<HTMLDivElement>();
  const attrs = omit(
    props,
    'children',
    'class',
    'ref',
    'onKeyDown',
    'onOpenAutoFocus',
    'onCloseAutoFocus',
    'onEscapeKeyDown',
    'onPointerDownOutside',
    'onFocusOutside',
    'onInteractOutside',
  );

  createEffect(
    () => [context.open, panel(), context.modal] as const,
    ([open, element, modal]) => {
      if (!open || !element) return;
      return activateDialog({
        panel: element,
        modal,
        close: context.close,
        onKeyDown: event => props.onKeyDown?.(event),
        onOpenAutoFocus: event => props.onOpenAutoFocus?.(event),
        onCloseAutoFocus: event => props.onCloseAutoFocus?.(event),
        onEscapeKeyDown: event => props.onEscapeKeyDown?.(event),
        onPointerDownOutside: event => props.onPointerDownOutside?.(event),
        onFocusOutside: event => props.onFocusOutside?.(event),
        onInteractOutside: event => props.onInteractOutside?.(event),
      });
    },
  );

  return (
    <div
      role="dialog"
      aria-labelledby={props['aria-label'] ? undefined : context.titleId}
      tabindex={-1}
      {...attrs}
      ref={element => {
        setPanel(element);
        if (typeof props.ref === 'function') props.ref(element);
      }}
      class={clsx(styles.interactive, props.class)}
      aria-modal={context.modal ? 'true' : undefined}
      aria-hidden={context.open ? undefined : 'true'}
      data-expanded={context.open ? '' : undefined}
      data-closed={context.open ? undefined : ''}
      inert={!context.open}
    >
      {props.children}
    </div>
  );
}

export function Title(
  props: ParentProps<{
    class?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }>,
) {
  const context = useContext(Context);
  return (
    <Dynamic
      component={props.as ?? 'h2'}
      class={props.class}
      id={context.titleId}
    >
      {props.children}
    </Dynamic>
  );
}

interface CloseButtonProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  size?: keyof typeof styles.close;
  ghost?: boolean;
  onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
}

export function CloseButton(props: CloseButtonProps) {
  const context = useContext(Context);
  const attrs = omit(
    props,
    'size',
    'ghost',
    'class',
    'type',
    'onClick',
    'children',
  );
  return (
    <button
      {...attrs}
      class={clsx(
        styles.close[props.size ?? 'sm'],
        props.ghost && styles.ghost,
        props.class,
      )}
      type={props.type ?? 'button'}
      onClick={event => {
        props.onClick?.(event);
        if (!event.defaultPrevented) context.close();
      }}
    >
      {props.children}
    </button>
  );
}

export const Dialog = Object.assign(Root, {
  Root,
  Portal,
  Overlay,
  Content,
  Title,
  CloseButton,
});
