import {offset} from '@floating-ui/core';
import {flip} from '@floating-ui/dom';
import {createButton} from '@solid-aria/button';
import {
  AriaMenuProps,
  AriaMenuTriggerProps,
  createMenuTrigger,
  MenuTriggerAria,
} from '@solid-aria/menu';
import {ElementType} from '@solid-aria/types';
import {
  Accessor,
  createComponent,
  createContext,
  createSignal,
  FlowProps,
  JSX,
  mergeProps,
  Show,
  useContext,
} from 'solid-js';
import {omitProps} from 'solid-use';
import {useFloating} from '../../hooks';
import {UseFloatingReturn} from '../../hooks/useFloating';
import {CustomComponentProps, styled} from '../../utils';
import {MenuPopup} from './MenuPopup';

type DropdownMenuProps = FlowProps<
  AriaMenuTriggerProps & AriaMenuProps & {menuButton?: JSX.Element}
>;

interface DropdownMenuContext {
  btnRef: Accessor<HTMLElement | undefined>;
  setBtnRef: (ref: Element | undefined) => void;
  triggerAria: MenuTriggerAria;
  floating: UseFloatingReturn;
}

const DropdownContext = createContext<DropdownMenuContext>();

export function MenuButton<T extends ElementType>(
  props: CustomComponentProps<T, Omit<DropdownMenuProps, 'menuButton'>>,
) {
  const context = useContext(DropdownContext) as DropdownMenuContext;
  const {buttonProps} = createButton(
    context.triggerAria.menuTriggerProps,
    context.btnRef,
  );

  return createComponent(
    props.as,
    mergeProps(omitProps(props, ['ref', 'as']), buttonProps, {
      ref: (ref: Element) => {
        context.setBtnRef(ref);
        context.floating.setReference(ref);
      },
    }),
  );
}

export function DropdownMenuV2(props: DropdownMenuProps) {
  const [btnRef, setBtnRef] = createSignal<HTMLElement>();
  const triggerAria = createMenuTrigger({}, btnRef);

  const floating = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(10), flip()],
  });

  return (
    <DropdownContext.Provider
      value={{
        btnRef,
        setBtnRef,
        triggerAria,
        floating,
      }}
    >
      <styled.div style={{position: 'relative', display: 'inline-block'}}>
        {props.menuButton}
        <Show when={triggerAria.state.isOpen()}>
          <MenuPopup
            {...props}
            {...triggerAria.menuProps}
            floating={floating}
            autofocus={triggerAria.state.focusStrategy()}
            onClose={() => triggerAria.state.close()}
          />
        </Show>
      </styled.div>
    </DropdownContext.Provider>
  );
}
