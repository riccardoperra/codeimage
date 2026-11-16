import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton, Tooltip} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import {
  type Box,
  boxOf,
  morphBar,
  reshapeSurface,
} from '../../../components/Animation/BarMorph';
import {HeaderField} from '../../../components/Animation/HeaderField';
import {
  BarTransport,
  transportInBar,
} from '../../../components/Animation/TransportBar';
import {
  byPointer,
  reduced,
  timelineFor,
  toggledByPointer,
} from '../../../components/Animation/timeline/motion';
import type {AppLocaleEntries} from '../../../i18n';
import {AskAiButton, localAi, PromptBar} from '../local-ai/LocalAi';
import {CopyIcon, SparklesIcon} from '../shell/icons';
import type {Stage} from '../stage';
import * as styles from './canvas-toolbar.css';

type Mode = 'actions' | 'transport';

export function CanvasToolbar(props: {stage: Stage}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [formatAction, {notify: format}] = createAsyncAction(() =>
    props.stage.format(),
  );
  const exporter = () => props.stage.exporter;
  const {animation} = getEditorStore();
  const wanted = (): Mode =>
    animation.open() && transportInBar(props.stage.compact())
      ? 'transport'
      : 'actions';
  const [mode, setMode] = createSignal(wanted());
  let bar!: HTMLDivElement;
  let surface!: HTMLSpanElement;
  let anchor!: HTMLDivElement;
  const groups: Record<Mode, {left?: HTMLDivElement; right?: HTMLDivElement}> =
    {actions: {}, transport: {}};
  const sides = (of: Mode) =>
    [groups[of].left, groups[of].right].filter(group => !!group);
  const width = (group?: HTMLElement) =>
    group?.getBoundingClientRect().width ?? 0;
  const lean = (of: Mode) => width(groups[of].left) - width(groups[of].right);
  let shown: {mode: Mode; box: Box} | undefined;
  const place = () => {
    bar.style.translate =
      mode() === 'transport'
        ? `${(lean('actions') - lean('transport')) / 2}px 0`
        : '';
    const was = shown;
    const box = boxOf(bar.getBoundingClientRect());
    const at = anchor.getBoundingClientRect();
    shown = {
      mode: mode(),
      box: {
        left: box.left - at.left,
        right: box.right - at.left,
        top: box.top - at.top,
        bottom: box.bottom - at.top,
      },
    };
    return was;
  };
  createEffect(on(mode, () => place()));
  onMount(() => {
    const observer = new ResizeObserver(() => {
      const was = place();
      const now = shown!;
      const span = (box: Box) => box.right - box.left;
      if (!was || was.mode !== now.mode || !byPointer() || reduced()) return;
      if (Math.abs(span(was.box) - span(now.box)) < 1) return;
      const at = anchor.getBoundingClientRect();
      reshapeSurface({
        bar,
        surface,
        old: {
          left: at.left + was.box.left,
          right: at.left + was.box.right,
          top: at.top + was.box.top,
          bottom: at.top + was.box.bottom,
        },
        duration:
          span(now.box) > span(was.box)
            ? timelineFor.barIn
            : timelineFor.barClose,
      });
    });
    for (const group of [...sides('actions'), ...sides('transport')])
      observer.observe(group);
    onCleanup(() => observer.disconnect());
  });
  createEffect(
    on(
      wanted,
      next => {
        if (next === mode() || !groups.transport.left) return setMode(next);
        const opening = next === 'transport';
        const from = sides(opening ? 'actions' : 'transport');
        const to = sides(next);
        const hadFocus = from.some(group =>
          group.contains(document.activeElement),
        );
        morphBar({
          bar,
          surface,
          anchor,
          from,
          to,
          opening,
          animate: toggledByPointer(),
          change: () => setMode(next),
          done: () => {
            if (hadFocus)
              anchor
                .querySelector<HTMLElement>('[data-animate-toggle]')
                ?.focus();
          },
        });
      },
      {defer: true},
    ),
  );
  const escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || mode() !== 'transport') return;
    event.stopPropagation();
    event.preventDefault();
    animation.actions.setOpen(false);
  };

  return (
    <div class={styles.anchor}>
      <div
        ref={bar}
        class={styles.toolbar}
        role="group"
        aria-label={
          mode() === 'transport' ? t('animation.panel') : t('editor.actions')
        }
        data-bar-mode={mode()}
        data-covered={localAi.isOpen() ? '' : undefined}
        onKeyDown={escape}
      >
        <span ref={surface} class={styles.surface} data-bar-surface />
        <div
          ref={element => (groups.actions.left = element)}
          class={styles.content}
          data-side="left"
          data-active={mode() === 'actions' ? '' : undefined}
          inert={mode() !== 'actions'}
        >
          <Button
            size={'sm'}
            theme={'secondary'}
            variant={'ghost'}
            loading={formatAction.loading}
            leftIcon={<SparklesIcon size={18} />}
            disabled={!props.stage.canFormat()}
            onClick={() => format()}
          >
            {t('editor.formatCode')}
          </Button>
          <Button
            size={'sm'}
            theme={'secondary'}
            variant={'ghost'}
            leftIcon={<CopyIcon size={18} />}
            disabled={!exporter().canCopy() || exporter().busy()}
            onClick={() => exporter().copy()}
          >
            {t('editor.copyImage')}
          </Button>
        </div>
        <Show when={transportInBar(props.stage.compact())}>
          <div
            ref={element => (groups.transport.left = element)}
            class={styles.content}
            data-side="left"
            data-active={mode() === 'transport' ? '' : undefined}
            inert={mode() !== 'transport'}
            data-bar-transport
          >
            <BarTransport />
            <Tooltip content={t('editor.copyImage')} placement="top">
              <IconButton
                size="sm"
                theme="secondary"
                variant="ghost"
                aria-label={t('editor.copyImage')}
                disabled={!exporter().canCopy() || exporter().busy()}
                onClick={() => exporter().copy()}
                data-bar-copy
              >
                <CopyIcon size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </Show>
        <div ref={anchor} class={styles.pivot} data-bar-anchor>
          <props.stage.AnimateToggle />
        </div>
        <div
          ref={element => (groups.actions.right = element)}
          class={styles.content}
          data-side="right"
          data-active={mode() === 'actions' ? '' : undefined}
          inert={mode() !== 'actions'}
        >
          <AskAiButton />
        </div>
        <Show when={transportInBar(props.stage.compact())}>
          <div
            ref={element => (groups.transport.right = element)}
            class={styles.content}
            data-side="right"
            data-active={mode() === 'transport' ? '' : undefined}
            inert={mode() !== 'transport'}
            data-bar-transport
          >
            <HeaderField />
          </div>
        </Show>
      </div>
      <Show when={localAi.isOpen()}>
        <PromptBar />
      </Show>
    </div>
  );
}
