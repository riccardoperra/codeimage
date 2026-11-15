import {describe, expect, it, vi} from 'vitest';
import {
  createAnimationExport,
  type AnimationJob,
  type AnimationWorker,
} from './use-export-animation';
import {mp4Config} from '../core/video/encode';
import type {AnimationEvent, AnimationExport} from '../core/video/protocol';

const config = mp4Config({width: 640, height: 480}, 30);
const job: AnimationExport = {
  config,
  scenes: [{html: '<div/>', css: '', durationMs: 1000}],
  resources: {css: [], fonts: [], fontFamilies: []},
  css: '',
  pixelRatio: 1,
  contentSize: {width: 640, height: 480},
};
function fixture(supported = true) {
  const target = new EventTarget();
  const worker: AnimationWorker = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  const changed = vi.fn<(state: AnimationJob) => void>();
  const makeWorker = vi.fn(() => worker);
  const controller = createAnimationExport(changed, makeWorker, async () =>
    supported ? {kind: 'supported'} : {kind: 'unsupported', reason: 'config'},
  );
  const event = (data: AnimationEvent) =>
    worker.onmessage?.({data} as MessageEvent<AnimationEvent>);
  const messageError = () => target.dispatchEvent(new Event('messageerror'));
  return {controller, worker, changed, makeWorker, event, messageError};
}
describe('animation job and worker protocol', () => {
  it('warms, prepares, receives progress and completes with an MP4 blob', async () => {
    const f = fixture();
    await f.controller.check(config);
    expect(f.worker.postMessage).toHaveBeenCalledWith({kind: 'warm', config});
    await f.controller.start(async () => job);
    expect(f.worker.postMessage).toHaveBeenCalledWith({kind: 'export', job});
    f.event({kind: 'progress', done: 12, total: 30});
    expect(f.controller.state()).toEqual({
      kind: 'encoding',
      done: 12,
      total: 30,
    });
    f.event({
      kind: 'done',
      buffer: new ArrayBuffer(12),
      durationMs: 1000,
      frames: 30,
      renderMs: 20,
      elapsedMs: 30,
    });
    expect(f.controller.state()).toMatchObject({
      kind: 'done',
      size: 12,
      durationMs: 1000,
      blob: expect.any(Blob),
    });
    expect(f.worker.terminate).toHaveBeenCalledOnce();
  });
  it('runs GIF in the same job and returns image/gif without WebCodecs', async () => {
    const f = fixture();
    const gifJob: AnimationExport = {
      ...job,
      config: {kind: 'gif', width: 640, height: 480, fps: 50},
    };
    await f.controller.check(gifJob.config);
    await f.controller.start(async () => gifJob);
    f.event({
      kind: 'done',
      buffer: new ArrayBuffer(10),
      frames: 50,
      durationMs: 1000,
      renderMs: 20,
      elapsedMs: 30,
    });
    const result = f.controller.state();
    expect(result.kind === 'done' && result.blob.type).toBe('image/gif');
    expect(f.worker.postMessage).toHaveBeenCalledWith({
      kind: 'export',
      job: gifJob,
    });
  });
  it('terminates on cancel and ignores late completion (no download)', async () => {
    const f = fixture();
    await f.controller.check(config);
    await f.controller.start(async () => job);
    f.controller.cancel();
    expect(f.worker.postMessage).toHaveBeenLastCalledWith({kind: 'cancel'});
    expect(f.worker.terminate).toHaveBeenCalledOnce();
    f.event({
      kind: 'done',
      buffer: new ArrayBuffer(1),
      durationMs: 1,
      frames: 1,
      renderMs: 1,
      elapsedMs: 1,
    });
    expect(f.controller.state()).toEqual({kind: 'cancelled'});
  });
  it('does not start a job cancelled during async preparation', async () => {
    const f = fixture();
    await f.controller.check(config);
    let resolve!: (job: AnimationExport) => void;
    const pending = f.controller.start(
      () =>
        new Promise(r => {
          resolve = r;
        }),
    );
    f.controller.cancel();
    resolve(job);
    await pending;
    expect(f.worker.postMessage).not.toHaveBeenCalledWith({
      kind: 'export',
      job,
    });
  });
  it('passes worker failure causes to the UI and releases the worker', async () => {
    const f = fixture();
    await f.controller.check(config);
    f.event({
      kind: 'failed',
      reason: 'renderer',
      cause: 'Cannot load WASM: 404',
    });
    expect(f.changed).toHaveBeenLastCalledWith({
      kind: 'failed',
      reason: 'renderer',
      cause: 'Cannot load WASM: 404',
    });
    expect(f.worker.terminate).toHaveBeenCalledOnce();
  });
  it('reports uncaught worker errors and message decoding failures', async () => {
    const f = fixture();
    await f.controller.check(config);
    f.worker.onerror?.(
      Object.assign(new Event('error'), {
        message: 'Worker crashed',
      }) as ErrorEvent,
    );
    expect(f.controller.state()).toEqual({
      kind: 'failed',
      reason: 'workerLoad',
      cause: 'Worker crashed',
    });
    await f.controller.check(config);
    f.messageError();
    expect(f.controller.state()).toMatchObject({kind: 'failed'});
  });
  it('reports a message-less worker load failure and can retry', async () => {
    const f = fixture();
    await f.controller.check(config);
    f.worker.onerror?.(new Event('error') as ErrorEvent);
    expect(f.controller.state()).toEqual({
      kind: 'failed',
      reason: 'workerLoad',
      cause: 'Animation worker could not load',
    });
    await f.controller.check(config);
    expect(f.controller.state()).toEqual({
      kind: 'ready',
      support: {kind: 'supported'},
    });
  });
  it('reports a synchronous worker construction failure', async () => {
    const controller = createAnimationExport(
      vi.fn(),
      () => {
        throw new Error('Worker blocked');
      },
      async () => ({kind: 'supported'}),
    );
    await controller.check(config);
    expect(controller.state()).toEqual({
      kind: 'failed',
      reason: 'workerLoad',
      cause: 'Worker blocked',
    });
  });
  it('does not post a prepared job after a worker fails', async () => {
    const f = fixture();
    await f.controller.check(config);
    let finish!: (job: AnimationExport) => void;
    const preparing = f.controller.start(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    f.worker.onerror?.(new Event('error') as ErrorEvent);
    finish(job);
    await preparing;
    expect(f.controller.state()).toMatchObject({
      kind: 'failed',
      reason: 'workerLoad',
    });
    expect(f.worker.postMessage).not.toHaveBeenCalledWith({
      kind: 'export',
      job,
    });
  });
  it('detaches message decoding failures when cancelled', async () => {
    const f = fixture();
    await f.controller.check(config);
    f.controller.cancel();
    f.messageError();
    expect(f.controller.state()).toEqual({kind: 'cancelled'});
  });
  it('disables export with the support reason without creating a worker', async () => {
    const f = fixture(false);
    await f.controller.check(config);
    expect(f.controller.state()).toEqual({
      kind: 'ready',
      support: {kind: 'unsupported', reason: 'config'},
    });
    await f.controller.start(async () => job);
    expect(f.makeWorker).not.toHaveBeenCalled();
  });
  it('does not revive a cancelled support check', async () => {
    const f = fixture();
    let resolve!: (config: typeof job.config) => void;
    const pending = f.controller.check(
      () =>
        new Promise(r => {
          resolve = r;
        }),
    );
    f.controller.cancel();
    resolve(config);
    await pending;
    expect(f.controller.state()).toEqual({kind: 'cancelled'});
  });
});
