import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {useFrameCodeStyle} from '../../../components/Frame/PreviewFrame';
import {Button, Select, TextField} from '@codeui/kit';
import {DialogPanelContent, DialogPanelFooter} from '@ui/Dialog';
import {Dialog} from '@ui/Dialog/parts';
import {RadioGroup} from '@ui/RadioGroup/RadioGroup';
import {
  type Accessor,
  flush,
  createSignal,
  Show,
  createTrackedEffect,
} from 'solid-js';
import download from 'downloadjs';
import {useExportAnimation} from '../../../hooks/use-export-animation';
import {
  mp4Config,
  checkMp4Support,
  type Mp4Support,
} from '../../../core/video/encode';
import {
  ANIMATION_FORMATS,
  GIF_SUGGEST_MP4_BYTES,
  preferredAnimationFormat,
  nearestAnimationFps,
  type AnimationFps,
  type AnimationFormat,
} from '../../../core/video/formats';
import type {AppLocaleEntries} from '../../../i18n';
import {FormatItem} from './export-animation-format-item';
import {animationSnapshot} from './export-animation';
import {animationMatte} from '../../../components/Animation/AnimationCanvas';
import * as styles from './export.css';
export function createAnimationExporter() {
  const {animation} = getEditorStore();
  const job = useExportAnimation();
  const frame = getFrameState();
  const style = useFrameCodeStyle();
  const snapshot = animationSnapshot();
  const [open, setOpen] = createSignal(false);
  const [fps, setFps] = createSignal<AnimationFps>(30);
  let selectedFps: Partial<Record<AnimationFormat, AnimationFps>> = {};
  const [format, setFormat] = createSignal<AnimationFormat>('mp4');
  const [mp4Support, setMp4Support] = createSignal<Mp4Support>();
  const [scale, setScale] = createSignal<1 | 2 | 3>(2);
  const [matte, setMatte] = createSignal<string>();
  const defaultBackground = () => animationMatte(style.theme()!);
  const solidBackground = () => matte() ?? defaultBackground();
  const validMatte = () =>
    /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(solidBackground());
  const needsMatte = () => !frame.store.visible || frame.store.opacity === 0;
  const [size, setSize] = createSignal<'current' | '1080p'>('current');
  const [summary, setSummary] =
    createSignal<Awaited<ReturnType<typeof snapshot.describe>>>();
  let generation = 0;
  const busy = () => ['preparing', 'encoding'].includes(job.state().kind);
  const refresh = async () => {
    const current = ++generation;
    setSummary(undefined);
    const frameRate = fps();
    const outputFormat = format();
    const output = size() === '1080p' ? {width: 1920, height: 1080} : undefined;
    const outputScale = scale();
    await job.check(async () => {
      let value = await snapshot.describe(
        frameRate,
        output,
        outputScale,
        outputFormat,
      );
      const support = await checkMp4Support(
        mp4Config(value.config, frameRate === 25 ? 30 : frameRate),
      );
      if (current !== generation) return value.config;
      setMp4Support(support);
      const selected = preferredAnimationFormat(outputFormat, support);
      if (selected !== outputFormat) {
        setFormat(selected);
        const rate = nearestAnimationFps(selected, frameRate);
        setFps(rate);
        value = await snapshot.describe(rate, output, outputScale, selected);
      }
      if (current === generation) setSummary(value);
      return value.config;
    });
  };
  createTrackedEffect(() => {
    const value = job.state();
    if (value.kind === 'done')
      download(
        value.blob,
        `codeimage-animation.${ANIMATION_FORMATS[value.format].extension}`,
        value.blob.type,
      );
  });
  const show = () => {
    setOpen(true);
    setFormat('mp4');
    const rate = animation.settings().fps;
    selectedFps = {mp4: rate};
    setFps(rate);
    void refresh();
  };
  const close = () => {
    ++generation;
    job.cancel();
    setSummary(undefined);
    setOpen(false);
  };
  const changeFps = (value: AnimationFps | null) => {
    if (!value || value === fps()) return;
    selectedFps[format()] = value;
    setFps(value);
    if (value !== 25) {
      animation.actions.setFps(value);
      for (const format of ['mp4', 'gif'] as const) {
        if (ANIMATION_FORMATS[format].fpsOptions.some(rate => rate === value))
          selectedFps[format] = value;
      }
    }
    void refresh();
  };
  const changeFormat = (value: string) => {
    if (value !== 'mp4' && value !== 'gif') return;
    const rate = selectedFps[value] ?? nearestAnimationFps(value, fps());
    flush(() => {
      setFormat(value);
      setFps(rate);
    });
    void refresh();
  };
  const changeSize = (value: 'current' | '1080p' | null) => {
    if (!value || value === size()) return;
    setSize(value);
    void refresh();
  };
  const changeScale = (value: 1 | 2 | 3 | null) => {
    if (!value || value === scale()) return;
    setScale(value);
    void refresh();
  };
  const start = () => {
    if (needsMatte() && !validMatte()) return;
    // Read again after the secrets review, including any redaction it made.
    const frameRate = fps();
    const outputFormat = format();
    const output = size() === '1080p' ? {width: 1920, height: 1080} : undefined;
    const outputScale = scale();
    const background = needsMatte() ? solidBackground() : defaultBackground();
    void job.start(() =>
      snapshot.capture(
        frameRate,
        output,
        outputScale,
        background,
        outputFormat,
      ),
    );
  };
  return {
    job,
    open,
    show,
    close,
    fps,
    format,
    changeFormat,
    mp4Support,
    size,
    scale,
    changeScale,
    matte: solidBackground,
    changeMatte: setMatte,
    needsMatte,
    validMatte,
    scalable: () => size() === 'current' && !frame.exportTarget(),
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

export function AnimationExportContent(props: {
  exporter: AnimationExporter;
  onStart: () => void;
  onImage?: () => void;
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
    const value = exporter().mp4Support();
    if (value?.kind !== 'unsupported') return undefined;
    return t(
      `animation.export.${value.reason === 'missing' ? 'missing' : 'unsupported'}`,
    );
  };
  const failure = () => {
    const value = state();
    return value.kind === 'failed'
      ? t(`animation.export.errors.${value.reason}`)
      : undefined;
  };
  const canStart = () =>
    state().kind === 'ready' &&
    (exporter().format() !== 'mp4' || !unsupported()) &&
    !exporter().busy() &&
    (!exporter().needsMatte() || exporter().validMatte());
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
  const fpsLabel = (fps: AnimationFps) =>
    t('animation.export.fpsValue', {fps: number(fps)});
  const fpsValue = (value: Accessor<AnimationFps>) => fpsLabel(value());
  const sizeValue = (value: Accessor<'current' | '1080p'>) =>
    sizeLabel(value());
  const retry = () => void exporter().retry();
  const scaleLabel = (value: 1 | 2 | 3) => `${number(value)}×`;
  const scaleValue = (value: Accessor<1 | 2 | 3>) => scaleLabel(value());
  const close = () => exporter().close();
  const format = () => ANIMATION_FORMATS[exporter().format()];
  const filename = () =>
    `codeimage-animation.${ANIMATION_FORMATS[done()?.format ?? exporter().format()].extension}`;
  const save = () => {
    const value = done();
    if (value) download(value.blob, filename(), value.blob.type);
  };
  const file = () => {
    const value = done();
    return value
      ? new File([value.blob], filename(), {type: value.blob.type})
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
    <div data-animation-export>
      <p class={styles.hint}>
        {t('animation.export.description', {format: format().label})}
      </p>
      <DialogPanelContent>
        <div class={styles.videoFields}>
          <div class={styles.videoRow}>
            <span>{t('animation.export.format')}</span>
            <RadioGroup
              class={styles.videoFormats}
              value={exporter().format()}
              onChange={value => {
                if (value === 'mp4' || value === 'gif')
                  exporter().changeFormat(value);
              }}
              aria-label={t('animation.export.format')}
              disabled={exporter().busy()}
            >
              <FormatItem format="mp4" disabled={!!unsupported()} />
              <FormatItem format="gif" />
            </RadioGroup>
          </div>
          <div class={styles.videoRow}>
            <span>{t('animation.export.fps')}</span>
            <Select<AnimationFps>
              size="sm"
              aria-label={t('animation.export.fps')}
              options={format().fpsOptions}
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
          <Show when={exporter().scalable()}>
            <div class={styles.videoRow}>
              <span>{t('animation.export.scale')}</span>
              <Select<1 | 2 | 3>
                size="sm"
                aria-label={t('animation.export.scale')}
                options={[1, 2, 3]}
                value={exporter().scale()}
                onChange={exporter().changeScale}
                itemLabel={scaleLabel}
                optionTextValue={scaleLabel}
                valueComponent={scaleValue}
                disabled={exporter().busy()}
                disallowEmptySelection
              />
            </div>
          </Show>
          <Show when={exporter().needsMatte()}>
            <TextField
              size="sm"
              label={t('animation.export.background')}
              description={t('animation.export.backgroundHint')}
              classes={{input: styles.videoColor}}
              validationState={exporter().validMatte() ? 'valid' : 'invalid'}
              errorMessage={
                exporter().validMatte()
                  ? undefined
                  : t('animation.export.colorInvalid')
              }
              value={exporter().matte()}
              onChange={exporter().changeMatte}
              disabled={exporter().busy()}
            />
          </Show>
          <Show when={exporter().format() === 'gif' && exporter().fps() === 60}>
            <p class={styles.hint} data-gif-fps-note>
              {t('animation.export.gifFpsNote')}
            </p>
          </Show>
          <Show when={summary()}>
            {value => (
              <div class={styles.hint}>
                <div>{summaryLabel()}</div>
                <div
                  data-animation-size-estimate
                  data-estimated-bytes={value().estimatedBytes}
                  data-frame-budget={value().frameBudget}
                >
                  {t('animation.export.estimate', {
                    size: megabytes(value().estimatedBytes),
                  })}
                </div>
                <Show
                  when={
                    exporter().format() === 'gif' &&
                    value().estimatedBytes >= GIF_SUGGEST_MP4_BYTES
                  }
                >
                  <p data-gif-suggestion>{t('animation.export.suggestMp4')}</p>
                </Show>
              </div>
            )}
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
            when={state().kind === 'preparing' || state().kind === 'encoding'}
          >
            <div role="status" class={styles.videoFields}>
              <div
                role="progressbar"
                aria-label={t('animation.export.progress')}
                aria-valuemin={0}
                aria-valuemax={progress().total}
                aria-valuenow={progress().done}
              >
                <div class={styles.videoProgress}>
                  <div
                    class={styles.videoProgressFill}
                    style={{
                      width: `${(progress().done / Math.max(1, progress().total)) * 100}%`,
                    }}
                  />
                </div>
              </div>
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
          <Button size="sm" variant="secondary" onClick={close}>
            {exporter().busy()
              ? t('animation.export.cancel')
              : t('common.close')}
          </Button>
          <Show when={failure()}>
            <Button size="sm" variant="primary" onClick={retry}>
              {t('animation.export.retry')}
            </Button>
          </Show>
          <Show
            when={!failure() && done()}
            fallback={
              <Button
                size="sm"
                variant="primary"
                hidden={!!failure()}
                disabled={!canStart()}
                onClick={props.onStart}
              >
                {t('animation.export.start', {format: format().label})}
              </Button>
            }
          >
            <Show when={canShare()}>
              <Button size="sm" variant="secondary" onClick={share}>
                {t('animation.export.share', {format: format().label})}
              </Button>
            </Show>
            <Button size="sm" variant="primary" onClick={save}>
              {t('animation.export.download', {format: format().label})}
            </Button>
          </Show>
        </div>
      </DialogPanelFooter>
      <Show when={props.onImage}>
        <Button
          variant="secondary"
          size="sm"
          onClick={props.onImage}
          disabled={exporter().busy()}
        >
          {t('animation.export.asImage')}
        </Button>
      </Show>
    </div>
  );
}

export function AnimationExportDialog(props: {
  exporter: AnimationExporter;
  onStart: () => void;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const keepOpen = (event: Event) => event.preventDefault();
  const closeChanged = (open: boolean) => {
    if (!open) props.exporter.close();
  };
  return (
    <Dialog
      open={props.exporter.open()}
      onOpenChange={closeChanged}
      modal={false}
    >
      <Dialog.Portal>
        <Show when={!props.exporter.busy()}>
          <div class={styles.videoBackdrop} />
        </Show>
        <div
          class={styles.videoDialog}
          data-video-running={props.exporter.busy() ? '' : undefined}
        >
          <Dialog.Content
            class={styles.confirmationPanel}
            onInteractOutside={keepOpen}
          >
            <Dialog.Title>{t('animation.export.title')}</Dialog.Title>
            <AnimationExportContent {...props} />
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog>
  );
}
