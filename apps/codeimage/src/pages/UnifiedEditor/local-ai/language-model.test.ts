import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {LanguageModelApi} from './language-model';
import {createLanguageModel, POLL_MS} from './language-model';

type Availability = Awaited<ReturnType<LanguageModelApi['availability']>>;

function fakeApi(initial: Availability) {
  let availability = initial;
  let progress: ((loaded: number) => void) | undefined;
  let finish!: (ok: boolean) => void;
  const create = vi.fn<LanguageModelApi['create']>(
    options =>
      new Promise((resolve, reject) => {
        options.monitor?.({
          addEventListener: (_type, listener) => {
            progress = loaded =>
              listener(Object.assign(new Event('downloadprogress'), {loaded}));
          },
        });
        finish = ok =>
          ok
            ? resolve({
                promptStreaming: () => new ReadableStream(),
                append: async () => {},
                clone: () => Promise.reject(new Error('not cloned here')),
                destroy() {},
              })
            : reject(new Error('Not enough disk space'));
      }),
  );
  const api: LanguageModelApi = {
    availability: async () => availability,
    create,
  };
  return {
    api,
    create,
    setAvailability: (next: Availability) => (availability = next),
    progress: (loaded: number) => progress?.(loaded),
    finish: (ok: boolean) => finish(ok),
  };
}

describe('createLanguageModel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is unsupported without the Prompt API', async () => {
    const model = createLanguageModel(undefined);
    await vi.runAllTimersAsync();
    expect(model.state()).toEqual({kind: 'unsupported'});
  });

  it('downloads with indeterminate progress until Chrome reports some', async () => {
    const fake = fakeApi('downloadable');
    const model = createLanguageModel(fake.api);
    await vi.advanceTimersByTimeAsync(0);
    expect(model.state()).toEqual({kind: 'downloadable'});

    const done = model.download();
    void model.download();
    await vi.advanceTimersByTimeAsync(0);
    expect(model.state()).toEqual({kind: 'downloading', loaded: undefined});
    fake.progress(0);
    expect(model.state()).toEqual({kind: 'downloading', loaded: undefined});
    fake.progress(0.5);
    expect(model.state()).toEqual({kind: 'downloading', loaded: 0.5});
    expect(fake.create).toHaveBeenCalledTimes(1);

    // A poll that still says downloadable does not end our download.
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(model.state()).toEqual({kind: 'downloading', loaded: 0.5});

    fake.setAvailability('available');
    fake.finish(true);
    await done;
    expect(model.state()).toEqual({kind: 'available'});
  });

  it('keeps a failed download with its message, and a retry starts over', async () => {
    const fake = fakeApi('downloadable');
    const model = createLanguageModel(fake.api);
    await vi.advanceTimersByTimeAsync(0);

    const first = model.download();
    await vi.advanceTimersByTimeAsync(0);
    fake.finish(false);
    await first;
    expect(model.state()).toEqual({
      kind: 'failed',
      error: 'Not enough disk space',
    });
    await model.refresh();
    expect(model.state().kind).toBe('failed');

    void model.download();
    await vi.advanceTimersByTimeAsync(0);
    expect(model.state()).toEqual({kind: 'downloading', loaded: undefined});
    expect(fake.create).toHaveBeenCalledTimes(2);
  });

  it('never creates a session when Chrome says the model cannot run', async () => {
    const fake = fakeApi('downloadable');
    const model = createLanguageModel(fake.api);
    await vi.advanceTimersByTimeAsync(0);

    fake.setAvailability('unavailable');
    await model.download();
    expect(model.state()).toEqual({kind: 'unavailable'});
    expect(fake.create).not.toHaveBeenCalled();
  });

  it('restarts a download Chrome reports but does not move', async () => {
    const fake = fakeApi('downloading');
    const model = createLanguageModel(fake.api);
    await vi.advanceTimersByTimeAsync(0);
    expect(model.state()).toEqual({kind: 'downloading', loaded: undefined});
    expect(model.requesting()).toBe(false);

    const done = model.download();
    await vi.advanceTimersByTimeAsync(0);
    expect(fake.create).toHaveBeenCalledTimes(1);
    expect(model.requesting()).toBe(true);
    fake.progress(0.25);
    expect(model.state()).toEqual({kind: 'downloading', loaded: 0.25});
    fake.finish(true);
    await done;
    expect(model.state()).toEqual({kind: 'available'});
    expect(model.requesting()).toBe(false);
  });

  it('reaches available by polling a download Chrome started on its own', async () => {
    const fake = fakeApi('downloading');
    const model = createLanguageModel(fake.api);
    await vi.advanceTimersByTimeAsync(0);
    expect(model.state()).toEqual({kind: 'downloading', loaded: undefined});

    fake.setAvailability('available');
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(model.state()).toEqual({kind: 'available'});
    expect(vi.getTimerCount()).toBe(0);
  });
});
