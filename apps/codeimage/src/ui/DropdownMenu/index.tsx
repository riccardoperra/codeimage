import * as styles from '@codeui/kit/dropdown-styles';
import {Dynamic, type JSX} from '@solidjs/web';
import {Popover} from '@ui/Popover';
import clsx from 'clsx';
import {createContext, createSignal, omit, untrack, useContext} from 'solid-js';

const Close = createContext<() => void>();

type DropdownMenuProps = Omit<Parameters<typeof Popover>[0], 'open'> & {
  open?: boolean;
};

export function DropdownMenu(props: DropdownMenuProps) {
  const [selfOpen, setSelfOpen] = createSignal(false);
  const setOpen = (open: boolean) => {
    if (props.open === undefined) setSelfOpen(open);
    props.onOpenChange?.(open);
  };
  return (
    <Close value={() => setOpen(false)}>
      <Popover
        {...props}
        open={props.open ?? selfOpen()}
        onOpenChange={setOpen}
        popupRole="menu"
        triggerOnArrow
        gutter={props.gutter ?? 6}
      />
    </Close>
  );
}

export const DropdownMenuPortal = Popover.Portal;
export const DropdownMenuTrigger = Popover.Trigger;

type ContentProps = Parameters<typeof Popover.Content>[0];

function menuItems(menu: HTMLElement | undefined) {
  return Array.from(
    menu?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    ) ?? [],
  );
}

export function DropdownMenuContent(props: ContentProps) {
  let menu: HTMLDivElement | undefined;
  let lastTyped = 0;
  let typed = '';
  return (
    <Popover.Content
      {...props}
      ref={element => {
        menu = element;
        if (typeof props.ref === 'function') props.ref(element);
      }}
      data-cui="dropdown-menu-content"
      role="menu"
      class={clsx(styles.content, props.class)}
      onOpenAutoFocus={event => {
        props.onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;
        const [first] = menuItems(menu);
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }}
      onKeyDown={event => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const items = menuItems(menu);
        if (!items.length) return;
        const current = items.findIndex(
          item => item === document.activeElement,
        );
        const keys: Record<string, number> = {
          ArrowDown: (current + 1) % items.length,
          ArrowUp:
            (current < 0 ? items.length - 1 : current + items.length - 1) %
            items.length,
          Home: 0,
          End: items.length - 1,
        };
        if (event.key in keys) {
          event.preventDefault();
          items[keys[event.key]]?.focus();
        } else if (
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const now = performance.now();
          typed =
            (now - lastTyped > 500 ? '' : typed) +
            event.key.toLocaleLowerCase();
          lastTyped = now;
          const match = [
            ...items.slice(current + 1),
            ...items.slice(0, current + 1),
          ].find(item =>
            item.textContent.trim().toLocaleLowerCase().startsWith(typed),
          );
          match?.focus();
        }
      }}
    />
  );
}

interface ItemProps extends Omit<
  JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
  'onClick' | 'onSelect'
> {
  as?: 'button' | 'a';
  disabled?: boolean;
  onSelect?: () => void;
  onClick?: (event: MouseEvent) => unknown;
  rightSlot?: JSX.Element;
}

export function DropdownMenuItem(props: ItemProps) {
  const close = useContext(Close);
  const attrs = omit(
    props,
    'as',
    'disabled',
    'class',
    'onClick',
    'onSelect',
    'rightSlot',
    'children',
  );
  return (
    <Dynamic
      component={props.as ?? 'button'}
      type={props.as === 'a' ? undefined : 'button'}
      disabled={props.as === 'a' ? undefined : props.disabled}
      aria-disabled={props.disabled ? 'true' : undefined}
      {...attrs}
      role="menuitem"
      tabindex={-1}
      data-cui="dropdown-menu-item"
      data-disabled={props.disabled ? '' : undefined}
      class={clsx(styles.item, props.class)}
      onPointerMove={(event: PointerEvent) => {
        if (!props.disabled && event.pointerType !== 'touch')
          (event.currentTarget as HTMLElement).focus({preventScroll: true});
      }}
      onClick={(event: MouseEvent) => {
        if (props.disabled) {
          event.preventDefault();
          return;
        }
        const onClick = untrack(() => props.onClick);
        const onSelect = untrack(() => props.onSelect);
        close();
        queueMicrotask(() => {
          onClick?.(event);
          onSelect?.();
        });
      }}
    >
      {props.children}
      {props.rightSlot && <div class={styles.rightSlot}>{props.rightSlot}</div>}
    </Dynamic>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" class={styles.separator} />;
}
