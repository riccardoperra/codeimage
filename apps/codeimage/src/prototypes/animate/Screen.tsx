import {getEditorStore} from '@codeimage/store/editor';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
  NumberField,
  TextField,
} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {ParentProps} from 'solid-js';
import {
  batch,
  createEffect,
  createSignal,
  For,
  Match,
  on,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import {PauseIcon, PlayIcon} from '../../components/Animation/icons';
import {Header} from '../editor-controls/shell/Header';
import {page as pageClass} from '../editor-controls/shell/header.css';
import type {Stage} from '../editor-controls/stage';
import type {CurveFeedback} from './EasingField';
import {EasingField} from './EasingField';
import type {HeaderMode} from './Preview';
import {Preview} from './Preview';
import * as styles from './screen.css';
import type {AnimateStore, ProtoStep, Selection} from './store';
import {formatMs, LIMITS} from './store';
import type {TimelineLayout} from './Timeline';
import {Timeline} from './Timeline';

export type EditMode = 'pill' | 'auto' | 'explicit';

/** Every axis the prototypes explore. A route varies one and keeps the rest. */
export interface AnimateConfig {
  timeline: TimelineLayout;
  editMode: EditMode;
  curve: CurveFeedback;
  header: HeaderMode;
  /** Sets every transition, and the default, to this duration on mount. */
  defaultTransitionMs?: number;
}

export const BASE_CONFIG: AnimateConfig = {
  timeline: 'strip',
  editMode: 'pill',
  curve: 'static',
  header: 'all',
};

function DurationInput(props: {
  label: string;
  selection: Selection;
  value: number;
  store: AnimateStore;
}) {
  const limits = () => LIMITS[props.selection.kind];
  const onChange = (value: number | null | undefined) => {
    if (
      typeof value === 'number' &&
      value >= limits().min &&
      value <= limits().max
    )
      props.store.actions.setDuration(props.selection, value);
  };
  return (
    <label class={styles.field}>
      {props.label}
      <NumberField
        slotClasses={{root: styles.numberField}}
        size="sm"
        aria-label={`${props.label} in milliseconds`}
        min={limits().min}
        max={limits().max}
        step={100}
        value={props.value}
        onChange={onChange}
      />
      ms
    </label>
  );
}

function HoldInspector(props: {store: AnimateStore; step: ProtoStep}) {
  const index = () => props.store.steps().findIndex(s => s.id === props.step.id);
  const count = () => props.store.steps().length;
  const {actions} = props.store;
  return (
    <>
      <span class={styles.inspectorTitle}>
        Step {index() + 1} · {props.store.tabName(props.step.editorId)}
      </span>
      <DurationInput
        label="Hold"
        selection={{stepId: props.step.id, kind: 'hold'}}
        value={props.step.holdMs}
        store={props.store}
      />
      <Button
        size="sm"
        theme="secondary"
        onClick={() => actions.duplicateAsNext(props.step.id)}
      >
        Duplicate as next step
      </Button>
      <Button
        size="sm"
        theme="secondary"
        variant="ghost"
        disabled={index() === 0}
        onClick={() => actions.moveStep(props.step.id, -1)}
      >
        Move earlier
      </Button>
      <Button
        size="sm"
        theme="secondary"
        variant="ghost"
        disabled={index() === count() - 1}
        onClick={() => actions.moveStep(props.step.id, 1)}
      >
        Move later
      </Button>
      <Button
        size="sm"
        theme="secondary"
        variant="ghost"
        disabled={count() <= 2}
        onClick={() => actions.removeStep(props.step.id)}
      >
        Remove
      </Button>
    </>
  );
}

function TransitionInspector(props: {
  store: AnimateStore;
  step: ProtoStep;
  curve: CurveFeedback;
}) {
  const index = () => props.store.steps().findIndex(s => s.id === props.step.id);
  return (
    <>
      <span class={styles.inspectorTitle}>
        Transition {index() + 1} → {index() + 2}
      </span>
      <DurationInput
        label="Duration"
        selection={{stepId: props.step.id, kind: 'transition'}}
        value={props.step.transitionMs}
        store={props.store}
      />
      <span class={styles.field}>
        Easing
        <EasingField
          store={props.store}
          step={props.step}
          feedback={props.curve}
        />
      </span>
      <Button
        size="sm"
        theme="secondary"
        onClick={() => props.store.actions.applyToAll(props.step.id)}
      >
        Apply to all
      </Button>
    </>
  );
}

export function AnimateScreen(props: {
  config: AnimateConfig;
  stage: Stage;
  store: AnimateStore;
  autoplay: boolean;
}) {
  const store = props.store;
  const {editor} = getEditorStore();
  const [mode, setMode] = createSignal<'preview' | 'edit'>('edit');
  const [title, setTitle] = createSignal('user.ts');
  const playing = () => store.playback().state === 'playing';
  const editMode = () => props.config.editMode;

  const pausedInHold = () =>
    store.playback().state === 'paused' &&
    store.segmentAt(store.playhead())?.kind === 'hold';

  const shown = () => {
    switch (editMode()) {
      case 'explicit':
        return mode() === 'preview';
      case 'auto':
        return store.playback().state !== 'editing' && !pausedInHold();
      default:
        return store.playback().state !== 'editing';
    }
  };

  const focusEditor = (text?: string) =>
    requestAnimationFrame(() => {
      const view = editor.activeEditorView();
      if (!view) return;
      view.focus();
      if (text && !view.state.readOnly)
        view.dispatch(view.state.replaceSelection(text));
    });

  const exit = (text?: string) => {
    if (editMode() === 'explicit') {
      if (text !== undefined) return;
      setMode('edit');
    }
    store.actions.editStep(store.currentStep());
    focusEditor(text);
  };

  // Automatic mode: paused inside a hold, the editor shows that step's tab.
  // Typing there keeps the playhead where it is.
  createEffect(() => {
    store.setTypingExits(editMode() !== 'auto');
    if (editMode() === 'auto' && pausedInHold()) {
      const step = store.steps()[store.currentStep()];
      if (step) editor.actions.setActiveEditorId(step.editorId);
    }
  });

  // Selecting a hold while editing shows its tab, ready to edit.
  createEffect(
    on(store.selection, selected => {
      if (!selected || selected.kind !== 'hold' || shown()) return;
      const step = store.steps().find(s => s.id === selected.stepId);
      if (step) editor.actions.setActiveEditorId(step.editorId);
    }),
  );

  const onPlay = () => {
    batch(() => {
      if (editMode() === 'explicit') setMode('preview');
      store.actions.toggle();
    });
  };

  const [pendingPlay, setPendingPlay] = createSignal(false);
  onMount(() => {
    if (props.config.defaultTransitionMs)
      store.actions.setDefaultTransition(props.config.defaultTransitionMs);
    if (props.autoplay) {
      if (editMode() === 'explicit') setMode('preview');
      // Scrubbing shows the stage in every mode, so the plan gets made.
      store.actions.scrub(0);
      setPendingPlay(true);
    }
  });
  const onPlanned = () => {
    if (!pendingPlay()) return;
    setPendingPlay(false);
    store.actions.playFromStart();
  };

  const Wrap = (wrap: ParentProps) => (
    <Preview
      store={store}
      header={props.config.header}
      title={title}
      shown={shown}
      onExit={exit}
      onPlanned={onPlanned}
    >
      {wrap.children}
    </Preview>
  );

  const selectionKey = (kind: Selection['kind']) => {
    const selected = store.selection();
    return selected?.kind === kind && store.selectedStep()
      ? selected.stepId
      : undefined;
  };

  const unusedTabs = () =>
    store.tabs().map(tab => ({
      tab,
      uses: store.steps().filter(s => s.editorId === tab.id).length,
    }));

  return (
    <div class={pageClass}>
      <Header stage={props.stage} />
      <div class={styles.workspace}>
        <main class={styles.canvas} aria-label="Image preview">
          <props.stage.Canvas wrap={Wrap} />
          <Show when={editMode() === 'pill' && shown()}>
            <button class={styles.previewPill} onClick={() => exit()}>
              <span class={styles.liveDot} />
              Preview · click or type to edit step {store.currentStep() + 1}
            </button>
          </Show>
          <Show when={editMode() === 'auto' && store.playback().state !== 'editing'}>
            <span
              class={styles.status}
              data-editing={!shown() ? '' : undefined}
            >
              {shown()
                ? playing()
                  ? 'Playing'
                  : 'Transition · pause on a hold to edit'
                : `Editing step ${store.currentStep() + 1} · ${store.tabName(store.steps()[store.currentStep()]?.editorId ?? '')}`}
            </span>
          </Show>
        </main>

        <section class={styles.panel} aria-label="Animate">
          <div class={styles.row}>
            <IconButton
              size="sm"
              theme="primary"
              aria-label={playing() ? 'Pause' : 'Play'}
              onClick={onPlay}
            >
              {playing() ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <span class={styles.time}>
              {formatMs(store.playhead())} / {formatMs(store.durationMs())}
            </span>
            <span class={styles.stepBadge}>
              Step {store.currentStep() + 1} of {store.steps().length}
            </span>
            <Show when={editMode() === 'explicit'}>
              <SegmentedField
                size="xs"
                value={mode()}
                onChange={value => {
                  if (value === 'edit') exit();
                  else setMode('preview');
                }}
                items={[
                  {label: 'Preview', value: 'preview' as const},
                  {label: 'Edit', value: 'edit' as const},
                ]}
              />
            </Show>
            <Show when={props.config.header === 'none'}>
              <TextField
                slotClasses={{root: styles.titleField}}
                size="sm"
                aria-label="Window title"
                placeholder="Window title (optional)"
                value={title()}
                onChange={setTitle}
              />
            </Show>
            <span class={styles.spacer} />
            <DropdownMenu gutter={6} placement="top-end">
              <DropdownMenuTrigger as={Button} size="sm" theme="secondary">
                Add to animation
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <For each={unusedTabs()}>
                    {item => (
                      <DropdownMenuItem
                        onSelect={() => store.actions.addStep(item.tab.id)}
                      >
                        {item.tab.tab.tabName ?? 'Untitled'}
                        {item.uses ? ` · used ${item.uses}×` : ' · not in animation'}
                      </DropdownMenuItem>
                    )}
                  </For>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>

          <Timeline store={store} layout={props.config.timeline} />

          <div class={styles.inspector}>
            <Switch
              fallback={
                <span class={styles.hint}>
                  Select a hold or a transition. Drag its right edge to resize
                  (100 ms steps, <kbd class={styles.kbd}>Alt</kbd> for 10 ms),
                  or use <kbd class={styles.kbd}>←</kbd>
                  <kbd class={styles.kbd}>→</kbd>.
                </span>
              }
            >
              {/* Keyed on the selection, so typing a duration keeps focus. */}
              <Match when={selectionKey('hold')} keyed>
                {_ => (
                  <Show when={store.selectedStep()}>
                    {step => <HoldInspector store={store} step={step()} />}
                  </Show>
                )}
              </Match>
              <Match when={selectionKey('transition')} keyed>
                {_ => (
                  <Show when={store.selectedStep()}>
                    {step => (
                      <TransitionInspector
                        store={store}
                        step={step()}
                        curve={props.config.curve}
                      />
                    )}
                  </Show>
                )}
              </Match>
            </Switch>
          </div>
        </section>
      </div>
    </div>
  );
}
