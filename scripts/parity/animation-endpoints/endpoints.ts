import type {Prepared} from './prepare';
import {join} from 'node:path';
import {PNG} from 'pngjs';
import {writeFile} from 'node:fs/promises';
import {type Measured, settings} from './types';
import {markLineStarts, layoutJump} from './layout-checks';
import {
  diffPercent,
  codeRows,
  paintShifts,
  dimmedMarks,
  DIMMED_MARK_TOLERANCE,
  PAINT_TOLERANCE,
  sideBySide,
} from './paint-checks';
export async function checkEndpoints(
  {
    name,
    scale,
    layoutScale,
    path,
    layoutAt,
    fromHold,
    toHold,
    early,
    late,
    frameSize,
    frameAt,
    fromHoldImage,
    toHoldImage,
    origin,
    centered,
    fromLayout,
    toLayout,
    from,
    to,
    identity,
  }: Prepared,
  out: string,
) {
  const markedHold = (scene: {html: string}) =>
    layoutAt({html: markLineStarts(scene.html)}, 0);
  const layout = path
    ? (layoutJump(
        await markedHold(fromHold),
        await layoutAt(early, 0),
        path,
        layoutScale,
      ) ??
      layoutJump(
        await markedHold(toHold),
        await layoutAt(late, late.durationMs),
        path,
        layoutScale,
      ))
    : 'no code box in a hold scene';
  const frames = [
    await frameSize(early, 0),
    await frameSize(late, 0),
    await frameSize(late, late.durationMs),
  ].join(' > ');
  const start = await frameAt(early, 0);
  const halfway = await frameAt(late, 0);
  const quarters = [
    await frameAt(early, Math.round(early.durationMs / 2)),
    await frameAt(late, Math.round(late.durationMs / 2)),
  ];
  const end = await frameAt(late, late.durationMs);
  const startDiff = await diffPercent(
    centered(start, fromHoldImage),
    fromHoldImage,
    join(out, `${name}-start-diff.png`),
  );
  const endDiff = await diffPercent(
    centered(end, toHoldImage),
    toHoldImage,
    join(out, `${name}-end-diff.png`),
  );
  const paintJump = (
    frame: PNG,
    reference: PNG,
    hold: Measured,
    {code, marks}: typeof from,
  ) => {
    const {x, y} = origin(reference);
    const rows = path ? codeRows(hold, path) : [];
    const shifts = paintShifts(
      centered(frame, reference),
      reference,
      rows.map(row => ({
        x: row.x * scale - x,
        y: row.y * scale - y,
        width: row.width * scale,
        height: row.height * scale,
      })),
    );
    const loose = dimmedMarks(code, marks);
    const row = shifts.findIndex(
      (shift, row) =>
        shift > (loose.has(row) ? DIMMED_MARK_TOLERANCE : PAINT_TOLERANCE),
    );
    return row < 0
      ? null
      : `row ${row + 1} moved ${shifts[row].toFixed(3)} levels`;
  };
  const paint =
    paintJump(start, fromHoldImage, fromLayout, from) ??
    paintJump(end, toHoldImage, toLayout, to);
  let worstFrame = Math.max(startDiff, endDiff);
  if (identity) {
    for (const [scene, reference] of [
      [early, fromHoldImage],
      [late, toHoldImage],
    ] as const) {
      for (let t = 0; t <= scene.durationMs; t += 1000 / settings.fps) {
        const frame = await frameAt(scene, Math.round(t));
        worstFrame = Math.max(
          worstFrame,
          await diffPercent(centered(frame, reference), reference),
        );
      }
    }
  }
  await writeFile(
    join(out, `${name}.png`),
    PNG.sync.write(
      sideBySide([start, quarters[0], halfway, quarters[1], end], 16 * scale),
    ),
  );
  await writeFile(
    join(out, `${name}-from-hold.png`),
    PNG.sync.write(fromHoldImage),
  );
  await writeFile(
    join(out, `${name}-to-hold.png`),
    PNG.sync.write(toHoldImage),
  );
  return {layout, frames, paint, startDiff, endDiff, worstFrame};
}
