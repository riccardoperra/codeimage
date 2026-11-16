import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {Show} from 'solid-js';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MinusSquareIcon,
  TabPlusIcon,
  TrashIcon,
} from '../icons';
import {DurationInput} from '../DurationInput';
import {
  menuAnchor,
  menuOpen,
  setMenuAnchor,
  setMenuOpen,
  timelineActions,
} from './actions';
import {LineActions} from './LineActions';
import type {TimelineModel, TimelineStep} from './model';
import * as styles from './toolbar.css';

function StepMenu(props: {step: TimelineStep; model: TimelineModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const actions = timelineActions();
  const tab = () => props.model.tabOf(props.step.editorId);
  const tabIndex = () => props.step.tab - 1;
  const change = (open: boolean) => {
    if (!open) setMenuAnchor(null);
    setMenuOpen(open);
  };
  return (
    <DropdownMenu
      open={menuOpen()}
      onOpenChange={change}
      placement="top-end"
      getAnchorRect={anchor => {
        const point = menuAnchor();
        if (point) return {x: point.x, y: point.y, width: 0, height: 0};
        return anchor?.getBoundingClientRect();
      }}
    >
      <DropdownMenuTrigger
        as={IconButton}
        size="xs"
        theme="secondary"
        variant="ghost"
        aria-label={t('animation.timeline.more')}
        data-step-menu
      >
        •••
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent data-animation-steps-menu class={styles.menu}>
          <Show when={props.step.source.kind === 'script'}>
            <div class={styles.menuLabel} aria-hidden="true">
              {t('animation.timeline.stepNumber', {n: String(props.step.sub)})}
            </div>
            <DropdownMenuItem
              data-script-remove
              class={styles.danger}
              onSelect={() => actions.removeStep(props.step)}
            >
              <MinusSquareIcon />
              {t('animation.remove')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </Show>
          <div class={styles.menuLabel} aria-hidden="true">
            {t('animation.timeline.tabNumber', {n: String(props.step.tab)})} ·{' '}
            {tab()?.name}
          </div>
          <DropdownMenuItem
            disabled={tabIndex() <= 0}
            onSelect={() =>
              actions.moveTab(props.step.editorId, tabIndex() - 1)
            }
          >
            <ArrowLeftIcon />
            {t('animation.moveEarlier')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={tabIndex() >= actions.tabCount() - 1}
            onSelect={() =>
              actions.moveTab(props.step.editorId, tabIndex() + 1)
            }
          >
            <ArrowRightIcon />
            {t('animation.moveLater')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!actions.canAddTab()}
            onSelect={actions.addTab}
          >
            <TabPlusIcon />
            {t('animation.timeline.addTabAtEnd')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!actions.canRemoveTab()}
            data-close-tab
            class={styles.danger}
            onSelect={() => actions.removeTab(props.step.editorId)}
          >
            <TrashIcon />
            {t('animation.timeline.removeTab')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export function StepToolbar(props: {model: TimelineModel; addTab?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const actions = timelineActions();
  const selection = () => animation.selection();
  const step = () => {
    const value = selection();
    return value ? props.model.stepOf(value.stepId) : undefined;
  };
  const segment = () =>
    selection()?.kind === 'transition' ? step()?.transition : step()?.hold;
  const commit = (ms: number) => {
    const value = segment();
    if (!value) return;
    if (value.kind === 'hold') animation.actions.setHoldMs(value.stepId, ms);
    else animation.actions.setTransition(value.stepId, {ms});
  };
  const allMatch = () => {
    const value = segment();
    if (!value) return true;
    const settings = animation.settings();
    const transition = transitionOf(settings, settings.steps[value.index]);
    return (
      settings.transitionMs === transition.ms &&
      settings.easing === transition.easing &&
      settings.steps.slice(1).every(step => {
        const other = transitionOf(settings, step);
        return other.ms === transition.ms && other.easing === transition.easing;
      })
    );
  };
  const title = () => {
    const value = step();
    if (!value) return '';
    if (selection()?.kind === 'hold') return value.label;
    const previous = props.model.steps()[value.index - 1];
    return `${previous?.label ?? ''} → ${value.label}`;
  };
  return (
    <div class={styles.toolbar} data-step-toolbar>
      <Show
        when={step() && segment()}
        fallback={
          <>
            <span class={styles.muted}>
              {t('animation.timeline.selectHint')}
            </span>
            <span class={styles.spacer} />
            <Button
              size="xs"
              theme="secondary"
              disabled={!actions.canAddTab()}
              onClick={actions.addTab}
              data-animation-add-tab
            >
              {t('animation.timeline.addTab')}
            </Button>
          </>
        }
      >
        <span class={styles.label} data-step-title>
          {title()}
        </span>
        <Show when={selection()?.kind === 'hold'}>
          <DurationInput
            id="animationDuration"
            field="hold"
            label={t('animation.hold')}
            value={segment()!.durationMs}
            limits={DURATION_LIMITS.holdMs}
            commit={commit}
          />
        </Show>
        <Show
          when={
            selection()?.kind === 'hold' &&
            step()!.source.kind === 'script' &&
            step()!.source
          }
          keyed
        >
          {source =>
            source.kind === 'script' && (
              <LineActions editorId={source.editorId} step={source.step} />
            )
          }
        </Show>
        <Show when={selection()?.kind === 'transition' && step()!.stepId} keyed>
          {stepId => (
            <>
              <span class={styles.muted}>
                {t('animation.timeline.transitionHint')}
              </span>
              <Button
                size="xs"
                theme="secondary"
                variant="ghost"
                aria-disabled={allMatch()}
                data-disabled={allMatch() ? '' : undefined}
                onClick={() => {
                  if (!allMatch()) animation.actions.applyToAll(stepId);
                }}
              >
                {t('animation.applyAll')}
              </Button>
            </>
          )}
        </Show>
        <span class={styles.spacer} />
        <Button
          size="xs"
          theme="secondary"
          onClick={() => actions.addStep(step()!.editorId)}
          data-add-script-step={step()!.editorId}
        >
          {t('animation.timeline.addStep')}
        </Button>
        <Show when={props.addTab}>
          <Button
            size="xs"
            theme="secondary"
            variant="ghost"
            disabled={!actions.canAddTab()}
            onClick={actions.addTab}
            data-animation-add-tab
          >
            {t('animation.timeline.addTab')}
          </Button>
        </Show>
        <StepMenu step={step()!} model={props.model} />
      </Show>
    </div>
  );
}
