import {autoPlacement, Middleware, Placement} from '@floating-ui/dom';
import {AriaButtonProps, createButton} from '@solid-aria/button';
import {createOverlayTrigger, OverlayContainer} from '@solid-aria/overlays';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {PropsWithChildren, Show} from 'solid-js';
import {useFloating} from '../../hooks';
import {backgroundColorVar} from '../../theme';
import {Popover} from '../Popover';
import {createPopoverPortal} from '../Popover/create-popover-portal';
import * as styles from './ColorPicker.css';
import {ColorPickerPopover} from './ColorPickerPopover';

export interface ColorPickerProps {
  value: string | undefined;
  onChange: (value: string) => void;
  title?: string;
  colors?: string[];
  gradients?: string[];
  popoverPlacement?: Placement;
  popoverRoot?: string;
  popoverMiddlewares?: Middleware[];
}

export function ColorPicker(props: PropsWithChildren<ColorPickerProps>) {
  let triggerRef: HTMLButtonElement | undefined;

  const {triggerProps, overlayProps, state} = createOverlayTrigger({
    type: 'dialog',
  });

  const {buttonProps} = createButton(
    {
      onPress: () => state.open(),
    } as AriaButtonProps<'button'>,
    () => triggerRef,
  );

  const portal = createPopoverPortal({id: props.popoverRoot});

  const floating = useFloating({
    strategy: 'absolute',
    placement: 'right-start',
    middleware: [
      autoPlacement({
        allowedPlacements: [
          'right-start',
          'top-start',
          'bottom-start',
          'left-start',
        ],
      }),
      ...(props?.popoverMiddlewares ?? []),
    ],
  });

  return (
    <>
      <button
        {...buttonProps}
        {...triggerProps}
        class={styles.input}
        ref={ref => {
          triggerRef = ref;
          floating.setReference(ref);
        }}
      >
        <div
          class={styles.inputColor}
          style={assignInlineVars({
            [backgroundColorVar]: props.value ?? '#000000',
          })}
        />
      </button>

      <Show when={state.isOpen()}>
        <OverlayContainer portalContainer={portal()!}>
          <Popover
            {...overlayProps}
            ref={floating.setFloating}
            title={props.title}
            style={{
              top: `${floating.y}px`,
              left: `${floating.x}px`,
              position: floating.strategy,
            }}
            isOpen={state.isOpen()}
            onClose={state.close}
          >
            <ColorPickerPopover
              value={props.value}
              onChange={props.onChange}
              colors={props.colors}
              gradientColors={props.gradients}
            />
          </Popover>
        </OverlayContainer>
      </Show>
    </>
  );
}
