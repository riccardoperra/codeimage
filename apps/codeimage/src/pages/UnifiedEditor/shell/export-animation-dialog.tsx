import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  Button,
  DialogPanelContent,
  DialogPanelFooter,
  Select,
  RadioList,
  RadioListItem,
} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import {Progress} from '@kobalte/core/progress';
import {type Accessor, createEffect, createSignal, Show} from 'solid-js';
import download from 'downloadjs';
import {useExportAnimation} from '../../../hooks/use-export-animation';
import {type VideoFps} from '../../../core/video/encode';
import type {AppLocaleEntries} from '../../../i18n';
import {animationSnapshot} from './export-animation';
import * as styles from './export.css';

export function createAnimationExporter() {
  const {animation} = getEditorStore();
  const job = useExportAnimation();
  const snapshot = animationSnapshot();
  const [open, setOpen] = createSignal(false);
  const [fps, setFps] = createSignal<VideoFps>(30);
  const [size, setSize] = createSignal<'current' | '1080p'>('current');
  const [summary, setSummary] =
    createSignal<Awaited<ReturnType<typeof snapshot.describe>>>();
  let generation = 0;
  const busy = () => ['preparing', 'encoding'].includes(job.state().kind);
  const refresh = async () => {
    const current = ++generation;
    setSummary(undefined);
    const frameRate = fps();
    const output = size() === '1080p' ? {width: 1920, height: 1080} : undefined;
    await job.check(async () => {
      const value = await snapshot.describe(frameRate, output);
      if (current === generation) setSummary(value);
      return value.config;
    });
  };
  createEffect(() => {
    const value = job.state();
    if (value.kind === 'done')
      download(value.blob, 'codeimage-animation.mp4', 'video/mp4');
  });
  const show = () => {
    setOpen(true);
    setFps(animation.settings().fps);
    void refresh();
  };
  const close = () => {
    ++generation;
    job.cancel();
    setSummary(undefined);
    setOpen(false);
  };
  const changeFps = (value: VideoFps | null) => {
    if (!value) return;
    setFps(value);
    animation.actions.setFps(value);
    void refresh();
  };
  const changeSize = (value: 'current' | '1080p' | null) => {
    if (!value) return;
    setSize(value);
    void refresh();
  };
  const start = () => {
    // Read again after the secrets review, including any redaction it made.
    const frameRate = fps();
    const output = size() === '1080p' ? {width: 1920, height: 1080} : undefined;
    void job.start(() => snapshot.capture(frameRate, output));
  };
  return {
    job,
    open,
    show,
    close,
    fps,
    size,
    changeFps,
    changeSize,
    summary,
    retry: refresh,
    busy,
    start,
    available: () => (animation.stateToPersist()?.steps.length ?? 0) >= 2,
  };
}
export type AnimationExporter = ReturnType<typeof createAnimationExporter>;

export function AnimationExportDialog(props: {
  exporter: AnimationExporter;
  onStart: () => void;
}) {
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const exporter = () => props.exporter;
  const state = () => exporter().job.state();
  const summary = () => exporter().summary();
  const done = () => {
    const value = state();
    return value.kind === 'done' ? value : undefined;
  };
  const unsupported = () => {
    const value = state();
    if (value.kind !== 'ready' || value.support.kind !== 'unsupported')
      return undefined;
    return t(
      `animation.export.${value.support.reason === 'missing' ? 'missing' : 'unsupported'}`,
    );
  };
  const failure = () => {
    const value = state();
    return value.kind === 'failed'
      ? t(`animation.export.errors.${value.reason}`)
      : undefined;
  };
  const canStart = () =>
    state().kind === 'ready' && !unsupported() && !exporter().busy();
  const progress = () => {
    const value = state();
    return value.kind === 'encoding' ? value : {done: 0, total: 1};
  };
  const number = (value: number) =>
    new Intl.NumberFormat(locale()).format(value);
  const seconds = (ms: number) =>
    new Intl.NumberFormat(locale(), {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(ms / 1000);
  const megabytes = (bytes: number) =>
    new Intl.NumberFormat(locale(), {
      style: 'unit',
      unit: 'megabyte',
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(bytes / 1_000_000);
  const summaryLabel = () => {
    const value = summary();
    return (
      value &&
      `${number(value.config.width)} × ${number(value.config.height)} · ${seconds(value.durationMs)}`
    );
  };
  const doneLabel = () => {
    const value = done();
    return (
      value &&
      t('animation.export.done', {
        size: megabytes(value.size),
        duration: seconds(value.durationMs),
      })
    );
  };
  const sizeLabel = (size: 'current' | '1080p') =>
    size === 'current'
      ? t('animation.export.currentSize')
      : `${number(1920)} × ${number(1080)}`;
  const fpsLabel = (fps: VideoFps) =>
    t('animation.export.fpsValue', {fps: number(fps)});
  const fpsValue = (value: Accessor<VideoFps>) => fpsLabel(value());
  const sizeValue = (value: Accessor<'current' | '1080p'>) =>
    sizeLabel(value());
  const retry = () => void exporter().retry();
  const keepOpen = (event: Event) => event.preventDefault();
  const closeChanged = (open: boolean) => {
    if (!open) exporter().close();
  };
  const close = () => exporter().close();
  const save = () => {
    const value = done();
    if (value) download(value.blob, 'codeimage-animation.mp4', 'video/mp4');
  };
  const file = () => {
    const value = done();
    return value
      ? new File([value.blob], 'codeimage-animation.mp4', {type: 'video/mp4'})
      : undefined;
  };
  const canShare = () => {
    const value = file();
    return (
      !!value && !!navigator.share && !!navigator.canShare?.({files: [value]})
    );
  };
  const share = async () => {
    const value = file();
    if (!value) return;
    try {
      await navigator.share({files: [value]});
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'AbortError') save();
    }
  };
  return (
    <Dialog open={exporter().open()} onOpenChange={closeChanged} modal={false}>
      <Dialog.Portal>
        <Show when={!exporter().busy()}>
          <div class={styles.videoBackdrop} />
        </Show>
        <div
          class={styles.videoDialog}
          data-video-running={exporter().busy() ? '' : undefined}
        >
          <Dialog.Content
            class={styles.confirmationPanel}
            data-animation-export
            onInteractOutside={keepOpen}
          >
            <Dialog.Title>{t('animation.export.title')}</Dialog.Title>
            <Dialog.Description class={styles.hint}>
              {t('animation.export.description')}
            </Dialog.Description>
            <DialogPanelContent>
              <div class={styles.videoFields}>
                <div class={styles.videoRow}>
                  <span>{t('animation.export.format')}</span>
                  <RadioList
                    size="sm"
                    value="mp4"
                    aria-label={t('animation.export.format')}
                    disabled={!!unsupported()}
                  >
                    <RadioListItem value="mp4" label="MP4" />
                  </RadioList>
                </div>
                <div class={styles.videoRow}>
                  <span>{t('animation.export.fps')}</span>
                  <Select<VideoFps>
                    size="sm"
                    aria-label={t('animation.export.fps')}
                    options={[24, 30, 50, 60]}
                    value={exporter().fps()}
                    onChange={exporter().changeFps}
                    itemLabel={fpsLabel}
                    optionTextValue={fpsLabel}
                    valueComponent={fpsValue}
                    disabled={exporter().busy()}
                    disallowEmptySelection
                  />
                </div>
                <div class={styles.videoRow}>
                  <span>{t('animation.export.outputSize')}</span>
                  <Select<'current' | '1080p'>
                    size="sm"
                    aria-label={t('animation.export.outputSize')}
                    options={['current', '1080p']}
                    value={exporter().size()}
                    onChange={exporter().changeSize}
                    itemLabel={sizeLabel}
                    optionTextValue={sizeLabel}
                    valueComponent={sizeValue}
                    disabled={exporter().busy()}
                    disallowEmptySelection
                  />
                </div>
                <Show when={summary()}>
                  <div class={styles.hint}>{summaryLabel()}</div>
                </Show>
                <Show when={state().kind === 'checking'}>
                  <div role="status">{t('animation.export.checking')}</div>
                </Show>
                <Show when={unsupported()}>
                  {reason => (
                    <p role="status" class={styles.hint}>
                      {reason()}
                    </p>
                  )}
                </Show>
                <Show when={failure()}>
                  {cause => (
                    <p role="alert">
                      {t('animation.export.failed', {cause: cause()})}
                    </p>
                  )}
                </Show>
                <Show
                  when={
                    state().kind === 'preparing' || state().kind === 'encoding'
                  }
                >
                  <div role="status" class={styles.videoFields}>
                    <Progress
                      aria-label={t('animation.export.progress')}
                      maxValue={progress().total}
                      value={progress().done}
                    >
                      <Progress.Track class={styles.videoProgress}>
                        <Progress.Fill class={styles.videoProgressFill} />
                      </Progress.Track>
                    </Progress>
                    <span class={styles.hint}>
                      {t('animation.export.frames', {
                        done: number(progress().done),
                        total: number(progress().total),
                      })}
                    </span>
                  </div>
                </Show>
                <Show when={done()}>
                  <div role="status">{doneLabel()}</div>
                </Show>
              </div>
            </DialogPanelContent>
            <DialogPanelFooter>
              <div class={styles.confirmActions}>
                <Button size="sm" theme="secondary" onClick={close}>
                  {exporter().busy()
                    ? t('animation.export.cancel')
                    : t('common.close')}
                </Button>
                <Show when={failure()}>
                  <Button size="sm" theme="primary" onClick={retry}>
                    {t('animation.export.retry')}
                  </Button>
                </Show>
                <Show
                  when={!failure() && done()}
                  fallback={
                    <Button
                      size="sm"
                      theme="primary"
                      hidden={!!failure()}
                      disabled={!canStart()}
                      onClick={props.onStart}
                    >
                      {t('animation.export.start')}
                    </Button>
                  }
                >
                  <Show when={canShare()}>
                    <Button size="sm" theme="secondary" onClick={share}>
                      {t('animation.export.share')}
                    </Button>
                  </Show>
                  <Button size="sm" theme="primary" onClick={save}>
                    {t('animation.export.download')}
                  </Button>
                </Show>
              </div>
            </DialogPanelFooter>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
