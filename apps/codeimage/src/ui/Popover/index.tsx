import type {Placement} from '@floating-ui/dom';
import type {ComponentProps, JSX, ValidComponent} from '@solidjs/web';
import {Dynamic, Portal as WebPortal} from '@solidjs/web';
import {activateDialog} from '@ui/Dialog/focus';
import clsx from 'clsx';
import type {Accessor, ParentProps} from 'solid-js';
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
import {placePopover} from './placement';
import * as styles from './Popover.css';

interface RootProps extends ParentProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  modal?: boolean;
  gutter?: number;
  overflowPadding?: number;
  anchor?: HTMLElement;
  getAnchorRect?: (trigger?: HTMLElement) => DOMRect | undefined;
  exitDuration?: number;
  popupRole?: 'dialog' | 'menu';
  triggerOnArrow?: boolean;
}

interface State {
  props: RootProps;
  trigger: Accessor<HTMLButtonElement | undefined>;
  setTrigger: (element: HTMLButtonElement) => void;
  present: Accessor<boolean>;
  contentId: string;
  titleId: string;
  descriptionId: string;
  close: () => void;
}

const Context = createContext<State>();

function Root(props: RootProps) {
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>();
  const [present, setPresent] = createSignal(untrack(() => props.open));

  createEffect(
    () => [props.open, props.exitDuration ?? 0] as const,
    ([open, delay]) => {
      if (open) {
        setPresent(true);
        return;
      }
      if (!untrack(present)) return;
      if (!delay) {
        setPresent(false);
        return;
      }
      const timer = setTimeout(() => setPresent(false), delay);
      return () => clearTimeout(timer);
    },
    {defer: true},
  );

  const id = createUniqueId();
  const state: State = {
    props,
    trigger,
    setTrigger,
    present,
    contentId: `popover-${id}`,
    titleId: `popover-title-${id}`,
    descriptionId: `popover-description-${id}`,
    close: () => props.onOpenChange?.(false),
  };
  return <Context value={state}>{props.children}</Context>;
}

type TriggerProps<T extends ValidComponent> = Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  'ref' | 'onClick' | 'onKeyDown'
> &
  Omit<ComponentProps<T>, 'ref' | 'onClick' | 'onKeyDown'> & {
    as?: T;
    ref?: (element: HTMLButtonElement) => void;
    onClick?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
  };

function Trigger<T extends ValidComponent = 'button'>(props: TriggerProps<T>) {
  const state = useContext(Context);
  const component = (): ValidComponent => props.as ?? 'button';
  const attrs = omit(props, 'as', 'ref', 'onClick', 'onKeyDown', 'children');
  return (
    <Dynamic
      component={component()}
      type="button"
      {...attrs}
      ref={(element: HTMLButtonElement) => {
        state.setTrigger(element);
        props.ref?.(element);
      }}
      aria-haspopup={state.props.popupRole ?? 'dialog'}
      aria-expanded={state.props.open ? 'true' : 'false'}
      aria-controls={state.props.open ? state.contentId : undefined}
      data-expanded={state.props.open ? '' : undefined}
      data-closed={state.props.open ? undefined : ''}
      onKeyDown={(event: KeyboardEvent) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (
          event.currentTarget instanceof HTMLElement &&
          !(event.currentTarget instanceof HTMLButtonElement) &&
          event.currentTarget.getAttribute('role') === 'button' &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          state.props.onOpenChange?.(!state.props.open);
        } else if (
          state.props.triggerOnArrow &&
          ['ArrowDown', 'ArrowUp'].includes(event.key)
        ) {
          event.preventDefault();
          state.props.onOpenChange?.(true);
        }
      }}
      onClick={(event: MouseEvent) => {
        props.onClick?.(event);
        if (!event.defaultPrevented)
          state.props.onOpenChange?.(!state.props.open);
      }}
    >
      {props.children}
    </Dynamic>
  );
}

function Portal(props: ParentProps<{mount?: Element}>) {
  const state = useContext(Context);
  const mount = () =>
    props.mount ??
    (state.props.anchor ?? state.trigger())?.closest(
      '[role="dialog"],[role="alertdialog"]',
    ) ??
    undefined;
  return (
    <Show when={state.present()}>
      <WebPortal mount={mount()}>{props.children}</WebPortal>
    </Show>
  );
}

interface ContentProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'onKeyDown'
> {
  onKeyDown?: (event: KeyboardEvent) => void;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: Event) => void;
  onFocusOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
}

function Content(props: ContentProps) {
  const state = useContext(Context);
  const [panel, setPanel] = createSignal<HTMLDivElement>();
  const attrs = omit(
    props,
    'children',
    'ref',
    'class',
    'onKeyDown',
    'onOpenAutoFocus',
    'onCloseAutoFocus',
    'onEscapeKeyDown',
    'onPointerDownOutside',
    'onFocusOutside',
    'onInteractOutside',
  );

  createEffect(
    () =>
      [
        state.props.open,
        state.props.anchor ?? state.trigger(),
        panel(),
        state.props.placement ?? 'bottom',
        state.props.gutter ?? 0,
        state.props.overflowPadding ?? 8,
        state.props.getAnchorRect,
        state.props.modal === true,
      ] as const,
    ([
      open,
      trigger,
      element,
      placement,
      gutter,
      overflowPadding,
      getAnchorRect,
      modal,
    ]) => {
      if (!open || !trigger || !element) return;
      let deactivate: (() => void) | undefined;
      const stop = placePopover(
        trigger,
        element,
        {placement, gutter, overflowPadding, getAnchorRect},
        () => {
          deactivate ??= activateDialog({
            panel: element,
            modal,
            close: state.close,
            includes: node => trigger.contains(node),
            dismissModalOutside: true,
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
      return () => {
        stop();
        deactivate?.();
      };
    },
  );

  return (
    <div
      role="dialog"
      tabindex={-1}
      id={state.contentId}
      data-popper-positioner
      aria-labelledby={props['aria-label'] ? undefined : state.titleId}
      aria-describedby={state.descriptionId}
      aria-hidden={state.props.open ? undefined : 'true'}
      data-expanded={state.props.open ? '' : undefined}
      data-closed={state.props.open ? undefined : ''}
      {...attrs}
      class={clsx(styles.content, props.class)}
      inert={!state.props.open}
      ref={element => {
        setPanel(element);
        if (typeof props.ref === 'function') props.ref(element);
      }}
    >
      {props.children}
    </div>
  );
}

function Title(
  props: ParentProps<{
    class?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }>,
) {
  const state = useContext(Context);
  return (
    <Dynamic
      component={props.as ?? 'h2'}
      id={state.titleId}
      class={props.class}
    >
      {props.children}
    </Dynamic>
  );
}

function Description(props: ParentProps<{class?: string}>) {
  const state = useContext(Context);
  return (
    <p id={state.descriptionId} class={props.class}>
      {props.children}
    </p>
  );
}

export const Popover = Object.assign(Root, {
  Root,
  Trigger,
  Portal,
  Content,
  Title,
  Description,
});
