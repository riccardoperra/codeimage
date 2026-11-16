import assert from 'node:assert/strict';
import {test} from 'vitest';
import {nextPlayback, playheadMs, type Playback} from './animation';

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

test('bounded transition playback pauses exactly at its end', () => {
  const playing: Playback = {state: 'playing', originMs: 100, untilMs: 1001};
  assert.equal(playheadMs(playing, 9999, DURATION), 1001);
  assert.deepEqual(
    nextPlayback(playing, {type: 'pause', now: 9999}, DURATION),
    {state: 'paused', atMs: 1001},
  );
});
