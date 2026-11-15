import assert from 'node:assert/strict';
import {test} from 'vitest';
import {
  nextPlayback,
  parseAnimationSettings,
  playheadMs,
  type Playback,
} from './animation';

const step = (editorId: string, holdMs = 800) => ({editorId, holdMs});

test('the default steps are every tab in tab order', () => {
  assert.deepEqual(parseAnimationSettings(undefined, ['a', 'b', 'c']), {
    steps: [step('a'), step('b'), step('c')],
    transitionMs: 900,
    easing: 'smooth',
    fps: 30,
  });
});

test('deleting a tab drops its step and keeps the order of the rest', () => {
  const saved = {
    steps: [step('c', 100), step('a', 200), step('b', 300)],
    transitionMs: 500,
    easing: 'linear',
    fps: 60,
  };
  assert.deepEqual(parseAnimationSettings(saved, ['a', 'b']), {
    ...saved,
    steps: [step('a', 200), step('b', 300)],
  });
});

test('a new tab is appended as the last step', () => {
  const saved = {
    steps: [step('b', 100), step('a', 200)],
    transitionMs: 500,
    easing: 'snappy',
    fps: 24,
  };
  assert.deepEqual(parseAnimationSettings(saved, ['a', 'new', 'b']).steps, [
    step('b', 100),
    step('a', 200),
    step('new'),
  ]);
});

test('durations are whole milliseconds within their limits', () => {
  const settings = parseAnimationSettings(
    {
      steps: [step('a', 120.6), step('b', -5), step('c', 99_999)],
      transitionMs: 333.4,
      easing: 'smooth',
      fps: 30,
    },
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    settings.steps.map(({holdMs}) => holdMs),
    [121, 0, 10_000],
  );
  assert.equal(settings.transitionMs, 333);
  assert.equal(
    parseAnimationSettings({transitionMs: 1}, ['a', 'b']).transitionMs,
    100,
  );
});

test('a timeline of 0 ms is clamped to one that shows a frame', () => {
  assert.deepEqual(
    parseAnimationSettings({steps: [step('a', 0)]}, ['a']).steps,
    [step('a', 800)],
  );
  assert.deepEqual(
    parseAnimationSettings({steps: [step('a', 0), step('b', 0)]}, ['a', 'b'])
      .steps,
    [step('a', 0), step('b', 0)],
  );
});

test('invalid fields take their defaults and duplicate steps collapse', () => {
  assert.deepEqual(
    parseAnimationSettings(
      {
        steps: [step('b', 10), {editorId: 'a'}, step('b', 20), 'x'],
        transitionMs: '900',
        easing: 'bounce',
        fps: 25,
      },
      ['a', 'b'],
    ),
    {
      steps: [step('b', 10), step('a')],
      transitionMs: 900,
      easing: 'smooth',
      fps: 30,
    },
  );
});

const DURATION = 2_500;
const send = (
  playback: Playback,
  ...events: Parameters<typeof nextPlayback>[1][]
) =>
  events.reduce(
    (state, event) => nextPlayback(state, event, DURATION),
    playback,
  );
const editing: Playback = {state: 'editing'};

test('playing from the editor starts at the beginning', () => {
  const playing = send(editing, {type: 'play', now: 1_000});
  assert.equal(playheadMs(playing, 1_400, DURATION), 400);
  assert.equal(playheadMs(playing, 9_000, DURATION), DURATION);
});

test('pausing keeps the playhead and playing resumes from it', () => {
  const paused = send(
    editing,
    {type: 'play', now: 0},
    {type: 'pause', now: 700},
  );
  assert.deepEqual(paused, {state: 'paused', atMs: 700});
  const resumed = send(paused, {type: 'play', now: 5_000});
  assert.equal(playheadMs(resumed, 5_100, DURATION), 800);
});

test('playing again after the end restarts', () => {
  const ended = send(
    editing,
    {type: 'play', now: 0},
    {type: 'pause', now: 4_000},
  );
  assert.deepEqual(ended, {state: 'paused', atMs: DURATION});
  const replay = send(ended, {type: 'toggle', now: 10_000});
  assert.equal(playheadMs(replay, 10_000, DURATION), 0);
});

test('scrubbing holds the playhead where it is dragged', () => {
  const scrubbing = send(
    editing,
    {type: 'play', now: 0},
    {type: 'scrub', atMs: 1_200},
  );
  assert.deepEqual(scrubbing, {state: 'scrubbing', atMs: 1_200});
  assert.equal(playheadMs(scrubbing, 99_000, DURATION), 1_200);
  assert.deepEqual(send(scrubbing, {type: 'seek', atMs: 9_000}), {
    state: 'paused',
    atMs: DURATION,
  });
});

test('typing in the editor returns every state to editing', () => {
  const states: Playback[] = [
    send(editing, {type: 'play', now: 0}),
    send(editing, {type: 'seek', atMs: 300}),
    send(editing, {type: 'scrub', atMs: 300}),
    editing,
  ];
  for (const state of states) {
    assert.deepEqual(send(state, {type: 'edit'}), editing);
  }
});
