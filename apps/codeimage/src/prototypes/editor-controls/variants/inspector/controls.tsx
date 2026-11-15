import {Button} from '@codeui/kit';
import {Show, createSignal, onCleanup, onMount} from 'solid-js';
import type {JSX, ParentProps} from 'solid-js';
import {ColorPickerPopover} from '../../../../components/PropertyEditor/controls/ColorPicker/ColorPicker';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../../../components/PropertyEditor/PanelRow';
import {SidebarPopover} from '../../../../components/PropertyEditor/SidebarPopover/SidebarPopover';
import {SidebarPopoverTitle} from '../../../../components/PropertyEditor/SidebarPopover/SidebarPopoverTitle';
import {AmbientSwatch} from '../../controls/AmbientSwatch';
import {ControlRow as SharedRow} from '../../controls/ControlRow';
import * as shared from '../../controls/controls.css';
import * as styles from './inspector.css';
import type {BackgroundControl, Control} from '../../model';

/**
 * A row whose picker opens over the panel, in the production SidebarPopover
 * the app's own pickers use. The panel places it (see overlays.ts).
 */
function Overlay(
  props: ParentProps<{
    id: string;
    label: string;
    title: string;
    value: string;
    swatch?: string;
  }>,
) {
  const [open, setOpen] = createSignal(false);
  return (
    <PanelRow for={props.id} label={props.label}>
      <TwoColumnPanelRow>
        <SidebarPopover
          open={open()}
          onOpenChange={setOpen}
          input={(trigger: JSX.HTMLAttributes<HTMLButtonElement>) => (
            <Button
              {...trigger}
              id={props.id}
              class={styles.inlineTrigger}
              size="sm"
              theme="secondary"
              variant="ghost"
            >
              <Show when={props.swatch}>
                <span
                  class={styles.valueSwatch}
                  style={{background: props.swatch}}
                />
              </Show>
              <span class={styles.inlineValue}>{props.value}</span>
              <span aria-hidden="true">⌄</span>
            </Button>
          )}
        >
          <SidebarPopoverTitle onClose={() => setOpen(false)}>
            {props.title}
          </SidebarPopoverTitle>
          {props.children}
        </SidebarPopover>
      </TwoColumnPanelRow>
    </PanelRow>
  );
}

function ColorPickerContent(props: {control: BackgroundControl}) {
  let content: HTMLDivElement | undefined;
  onMount(() => {
    const enhancePresets = () => {
      content
        ?.querySelector('input')
        ?.setAttribute('aria-label', 'Color or gradient');
      for (const item of content?.querySelectorAll<HTMLElement>('div[title]') ??
        []) {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', `Background fill ${item.title}`);
        item.setAttribute(
          'aria-pressed',
          String(item.title === props.control.value()),
        );
      }
    };
    // The production color presets are mouse-only. Keep their UI and add keyboard access locally.
    const observer = new MutationObserver(enhancePresets);
    if (content)
      observer.observe(content, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    enhancePresets();
    onCleanup(() => observer.disconnect());
  });
  return (
    <div
      class={styles.colorPicker}
      ref={element => {
        content = element;
      }}
      onKeyDown={event => {
        if (
          (event.key === 'Enter' || event.key === ' ') &&
          event.target instanceof HTMLElement &&
          event.target.matches('div[title][role="button"]')
        ) {
          event.preventDefault();
          event.target.click();
        }
      }}
    >
      <AmbientSwatch control={props.control} />
      <ColorPickerPopover
        value={props.control.value()}
        onChange={props.control.set}
        colors={[...props.control.colors]}
        gradientColors={[...props.control.gradients]}
      />
    </div>
  );
}

function Background(props: {control: BackgroundControl}) {
  return (
    <Overlay
      id="inspector-background"
      label="Background"
      title="Background"
      value="Color & image"
      swatch={props.control.value()}
    >
      <ColorPickerContent control={props.control} />
    </Overlay>
  );
}

/**
 * Inspector's rows: the shared rows, except the background and its image,
 * which open over the panel.
 */
export function ControlRow(props: {control: Control}) {
  const control = props.control;
  if (control.kind === 'background' || control.id === 'frame.backgroundImage')
    return (
      <Show when={control.visible()}>
        <div
          class={shared.row}
          data-control={control.id}
          data-kind={control.kind}
        >
          <Show
            when={control.kind === 'background' && control}
            fallback={
              control.kind === 'custom' && (
                <Overlay
                  id="inspector-background-image"
                  label={control.label()}
                  title={control.label()}
                  value="Choose image"
                >
                  <control.Control />
                </Overlay>
              )
            }
          >
            {background => <Background control={background()} />}
          </Show>
        </div>
      </Show>
    );
  return (
    <SharedRow
      control={control}
      prefix="inspector"
      listClass={styles.selectPortal}
    />
  );
}
