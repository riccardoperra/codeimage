import {createSignal, onCleanup} from 'solid-js';
import {errorMessage, type Mp4Support} from '../core/video/encode';
import {
  ANIMATION_FORMATS,
  checkAnimationSupport,
  type AnimationConfig,
  type AnimationFormat,
} from '../core/video/formats';
import type {
  AnimationEvent,
  AnimationFailure,
  AnimationExport,
  AnimationRequest,
} from '../core/video/protocol';

export type AnimationJob =
  | {kind: 'idle'}
  | {kind: 'checking'}
  | {kind: 'ready'; support: Mp4Support}
  | {kind: 'preparing'}
  | {kind: 'encoding'; done: number; total: number}
  | {
      kind: 'done';
      format: AnimationFormat;
      blob: Blob;
      size: number;
      durationMs: number;
    }
  | {
      kind: 'failed';
      reason: AnimationFailure;
      cause: string;
    }
  | {kind: 'cancelled'};

export interface AnimationWorker {
  postMessage(message: AnimationRequest): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<AnimationEvent>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  addEventListener(type: 'messageerror', listener: () => void): void;
  removeEventListener(type: 'messageerror', listener: () => void): void;
}

// One controller owns both the state and the worker's lifetime. A generation
// invalidates async font preparation and events from a terminated worker.
export function createAnimationExport(
  changed: (state: AnimationJob) => void,
  makeWorker: () => AnimationWorker,
  check: (
    config: AnimationConfig,
  ) => Promise<Mp4Support> = checkAnimationSupport,
) {
  let state: AnimationJob = {kind: 'idle'};
  let worker: AnimationWorker | undefined;
  let generation = 0;
  let format: AnimationFormat = 'mp4';
  let disconnectMessageError: (() => void) | undefined;
  const set = (value: AnimationJob) => {
    state = value;
    changed(value);
  };
  const release = () => {
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      disconnectMessageError?.();
      disconnectMessageError = undefined;
      worker.terminate();
    }
    worker = undefined;
  };
  const fail = (cause: string, reason: AnimationFailure = 'export') => {
    ++generation;
    release();
    set({kind: 'failed', reason, cause});
  };
  const connect = () => {
    release();
    const current = generation;
    const next = makeWorker();
    worker = next;
    next.onmessage = ({data}) => {
      if (current !== generation) return;
      switch (data.kind) {
        case 'warmed':
          return;
        case 'progress':
          if (state.kind === 'preparing' || state.kind === 'encoding')
            set({kind: 'encoding', done: data.done, total: data.total});
          return;
        case 'done': {
          if (state.kind !== 'encoding' && state.kind !== 'preparing') return;
          const blob = new Blob([data.buffer], {
            type: ANIMATION_FORMATS[format].mime,
          });
          release();
          set({
            kind: 'done',
            format,
            blob,
            size: blob.size,
            durationMs: data.durationMs,
          });
          return;
        }
        case 'failed':
          fail(data.cause, data.reason);
          return;
        case 'cancelled':
          release();
          set({kind: 'cancelled'});
          return;
      }
    };
    next.onerror = event => {
      if (current !== generation) return;
      event.preventDefault();
      fail(
        event.message?.trim() || 'Animation worker could not load',
        'workerLoad',
      );
    };
    const messageError = () => {
      if (current === generation)
        fail('Invalid animation worker message', 'workerMessage');
    };
    // Chrome dispatches this event without exposing an onmessageerror property.
    next.addEventListener('messageerror', messageError);
    disconnectMessageError = () =>
      next.removeEventListener('messageerror', messageError);
    return next;
  };
  return {
    state: () => state,
    async check(input: AnimationConfig | (() => Promise<AnimationConfig>)) {
      release();
      const current = ++generation;
      set({kind: 'checking'});
      try {
        const config = typeof input === 'function' ? await input() : input;
        if (current !== generation) return;
        const support = await check(config);
        if (current !== generation) return;
        set({kind: 'ready', support});
        if (support.kind === 'supported') {
          try {
            connect().postMessage({kind: 'warm', config});
          } catch (error) {
            fail(errorMessage(error), 'workerLoad');
          }
        }
      } catch (error) {
        if (current === generation) fail(errorMessage(error));
      }
    },
    async start(prepare: () => Promise<AnimationExport>) {
      if (state.kind !== 'ready' || state.support.kind !== 'supported') return;
      const current = generation;
      set({kind: 'preparing'});
      try {
        const job = await prepare();
        if (current !== generation) return;
        format = job.config.kind;
        worker?.postMessage({kind: 'export', job});
      } catch (error) {
        if (current === generation) fail(errorMessage(error));
      }
    },
    cancel() {
      ++generation;
      worker?.postMessage({kind: 'cancel'});
      release();
      set({kind: 'cancelled'});
    },
  };
}

export function useExportAnimation() {
  const [state, setState] = createSignal<AnimationJob>({kind: 'idle'});
  const controller = createAnimationExport(
    setState,
    () =>
      new Worker(new URL('../workers/animation.worker.ts', import.meta.url), {
        type: 'module',
      }),
  );
  onCleanup(controller.cancel);
  return {...controller, state};
}
