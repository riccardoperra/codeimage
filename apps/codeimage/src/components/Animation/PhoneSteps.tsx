import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
} from '@codeui/kit';
import {Dialog, Content as DialogContent} from '@kobalte/core/dialog';
import {easingOf} from '@core/animation/easing';
import {createEffect, createMemo, createSignal, For, on, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {CloseIcon} from '../Icons/CloseIcon';
import {DurationInput} from './SegmentDetails';
import {EasingField} from './EasingField';
import {EasingCurve} from './EasingCurve';
import {formatDuration} from './format';
import * as styles from './PhoneSteps.css';

function StepRow(props: {id: string; open: (id: string) => void}) {
  const {animation, editor} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const index = () =>
    animation.settings().steps.findIndex(step => step.id === props.id);
  const step = () => animation.settings().steps[index()];
  const name = () =>
    editor.state.editors.find(tab => tab.id === step()?.editorId)?.tab
      .tabName || t('animation.untitledTab');
  const transition = () => transitionOf(animation.settings(), step());
  const label = () =>
    `${t('animation.stepName', {n: String(index() + 1), tab: name()})}. ${
      index() > 0
        ? `${t('animation.transitionShort')}: ${formatDuration(transition().ms, locale())}`
        : t('animation.noTransition')
    }. ${t('animation.holdShort')}: ${formatDuration(step()?.holdMs ?? 0, locale())}`;
  const open = () => props.open(props.id);
  return (
    <li>
      <button
        type="button"
        class={styles.row}
        data-animation-step-row
        aria-haspopup="dialog"
        aria-label={label()}
        data-step-id={props.id}
        data-selected={
          animation.selection()?.stepId === props.id ? '' : undefined
        }
        data-current={
          animation.playback().state !== 'editing' &&
          animation.currentStep() === index()
            ? ''
            : undefined
        }
        onClick={open}
      >
        <span class={styles.index} aria-hidden="true">
          {index() + 1}
        </span>
        <span class={styles.name} aria-hidden="true">
          {name()}
        </span>
        <span class={styles.metric} aria-hidden="true">
          <Show when={index() > 0} fallback="—">
            <EasingCurve easing={easingOf(transition().easing)} glyph />
            {formatDuration(transition().ms, locale())}
          </Show>
        </span>
        <span class={styles.metric} aria-hidden="true">
          {formatDuration(step()?.holdMs ?? 0, locale())}
        </span>
      </button>
    </li>
  );
}
function AddStep(props: {id: string; name: string}) {
  const {animation} = getEditorStore();
  const add = () => animation.actions.addStep(props.id);
  return <DropdownMenuItem onSelect={add}>{props.name}</DropdownMenuItem>;
}
function StepFields(props: {
  id: string;
  close: () => void;
  escape: (event: KeyboardEvent) => void;
}) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const index = () =>
    animation.settings().steps.findIndex(step => step.id === props.id);
  const step = () => animation.settings().steps[index()];
  const name = () =>
    editor.state.editors.find(tab => tab.id === step()?.editorId)?.tab
      .tabName || t('animation.untitledTab');
  const transition = () => transitionOf(animation.settings(), step());
  const hold = (ms: number) => animation.actions.setHoldMs(props.id, ms);
  const timing = (ms: number) =>
    animation.actions.setTransition(props.id, {ms});
  const apply = () => animation.actions.applyToAll(props.id);
  let earlierButton!: HTMLButtonElement;
  let laterButton!: HTMLButtonElement;
  const earlier = () => {
    const focused = document.activeElement === earlierButton;
    animation.actions.moveStep(props.id, -1);
    if (focused && index() === 0) laterButton.focus();
  };
  const later = () => {
    const focused = document.activeElement === laterButton;
    animation.actions.moveStep(props.id, 1);
    if (focused && index() === animation.settings().steps.length - 1)
      earlierButton.focus();
  };
  const duplicate = () => {
    props.close();
    animation.actions.duplicateAsNext(props.id);
  };
  const remove = () => {
    props.close();
    animation.actions.removeStep(props.id);
  };
  return (
    <>
      <div class={styles.heading}>
        <Dialog.Title>
          {t('animation.stepName', {n: String(index() + 1), tab: name()})}
        </Dialog.Title>
        <IconButton
          size="sm"
          theme="secondary"
          aria-label={t('animation.closeStep')}
          onClick={props.close}
        >
          <CloseIcon />
        </IconButton>
      </div>
      <DurationInput
        id="animationHold"
        label={t('animation.hold')}
        field="hold"
        compact
        value={step()?.holdMs ?? 0}
        limits={DURATION_LIMITS.holdMs}
        commit={hold}
        onEscape={props.escape}
      />
      <Show when={index() > 0}>
        <DurationInput
          id="animationTransition"
          label={t('animation.transition')}
          field="transition"
          compact
          value={transition().ms}
          limits={DURATION_LIMITS.transitionMs}
          commit={timing}
          onEscape={props.escape}
        />
        <div class={styles.actions}>
          <EasingField stepId={props.id} modal />
          <Button size="sm" theme="secondary" onClick={apply}>
            {t('animation.applyAll')}
          </Button>
        </div>
      </Show>
      <div class={styles.actions}>
        <Button
          ref={earlierButton}
          size="sm"
          theme="secondary"
          disabled={index() === 0}
          onClick={earlier}
        >
          {t('animation.moveEarlier')}
        </Button>
        <Button
          ref={laterButton}
          size="sm"
          theme="secondary"
          disabled={index() === animation.settings().steps.length - 1}
          onClick={later}
        >
          {t('animation.moveLater')}
        </Button>
      </div>
      <div class={styles.actions}>
        <Button
          size="sm"
          theme="secondary"
          disabled={!editor.computed.canAddEditor()}
          aria-describedby={
            !editor.computed.canAddEditor()
              ? 'animation-duplicate-limit'
              : undefined
          }
          onClick={duplicate}
        >
          {t('animation.duplicate')}
        </Button>
        <Button
          size="sm"
          theme="secondary"
          disabled={animation.settings().steps.length === 1}
          onClick={remove}
        >
          {t('animation.remove')}
        </Button>
      </div>
      <Show when={!editor.computed.canAddEditor()}>
        <p id="animation-duplicate-limit" class={styles.hint}>
          {t('animation.duplicateLimit')}
        </p>
      </Show>
    </>
  );
}
export function PhoneSteps() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [open, setOpen] = createSignal(false);
  const selectedId = () => animation.selection()?.stepId;
  const ids = createMemo(() => animation.settings().steps.map(step => step.id));
  const sheetId = () => open() && ids().find(id => id === selectedId());
  let list!: HTMLOListElement;
  createEffect(
    on(selectedId, id => {
      const row = [
        ...list.querySelectorAll<HTMLButtonElement>(
          '[data-animation-step-row]',
        ),
      ].find(row => row.dataset.stepId === id);
      row?.scrollIntoView({block: 'nearest'});
    }),
  );
  let anchorId: string | undefined;
  let escapedInput: EventTarget | null = null;
  const show = (id: string) => {
    anchorId = id;
    escapedInput = null;
    animation.actions.select({stepId: id, kind: 'hold'});
    setOpen(true);
  };
  const close = () => setOpen(false);
  const changeOpen = (value: boolean) => setOpen(value);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    const rows = [
      ...list.querySelectorAll<HTMLButtonElement>('[data-animation-step-row]'),
    ];
    (rows.find(row => row.dataset.stepId === anchorId) ?? rows[0])?.focus();
  };
  const escape = (event: KeyboardEvent) => {
    if (
      event.target instanceof HTMLInputElement &&
      /animation(Hold|Transition)-input/.test(event.target.id) &&
      escapedInput !== event.target
    ) {
      escapedInput = event.target;
      event.preventDefault();
      return;
    }
    close();
  };
  const edited = () => {
    escapedInput = null;
  };
  return (
    <>
      <div class={styles.columns} aria-hidden="true">
        <span />
        <span>{t('animation.tab')}</span>
        <span>{t('animation.transitionShort')}</span>
        <span>{t('animation.holdShort')}</span>
      </div>
      <ol
        ref={list}
        class={styles.list}
        aria-label={t('animation.steps')}
        data-animation-step-list
      >
        <For each={ids()}>{id => <StepRow id={id} open={show} />}</For>
        <li>
          <DropdownMenu placement="top-end">
            <DropdownMenuTrigger
              as={Button}
              size="sm"
              theme="secondary"
              variant="ghost"
              class={styles.add}
              data-animation-add-step
            >
              + {t('animation.addStepRow')}
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent data-animation-steps-menu>
                <For each={editor.state.editors}>
                  {tab => (
                    <AddStep
                      id={tab.id}
                      name={tab.tab.tabName || t('animation.untitledTab')}
                    />
                  )}
                </For>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </li>
      </ol>
      <Dialog open={!!sheetId()} onOpenChange={changeOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.overlay} />
          <DialogContent
            class={styles.sheet}
            data-animation-step-sheet
            onCloseAutoFocus={restoreFocus}
            onEscapeKeyDown={escape}
            onInput={edited}
          >
            <Show when={sheetId()} keyed>
              {id => <StepFields id={id} close={close} escape={escape} />}
            </Show>
          </DialogContent>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
