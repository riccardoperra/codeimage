import assert from 'node:assert/strict';

export async function verifyAgentControls({call, state, page}) {
  const values = async () =>
    Object.fromEntries(
      (await state()).settings.map(({name, value}) => [name, value]),
    );
  const before = await values();
  const padding = before.frame_padding === '64' ? '32' : '64';
  const opacity = before.frame_opacity === 63 ? 46 : 63;
  const framePadding = () =>
    page
      .locator('[data-fit-scale] [data-watermark-frame]')
      .first()
      .evaluate(element => getComputedStyle(element).paddingLeft);

  const result = await call('set_controls', {
    frame_padding: padding,
    frame_opacity: opacity,
    editor_line_numbers: !before.editor_line_numbers,
    unknown_setting: true,
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.applied, {
    frame_padding: padding,
    frame_opacity: opacity,
    editor_line_numbers: !before.editor_line_numbers,
  });
  assert.deepEqual(Object.keys(result.errors), ['unknown_setting']);
  const after = await values();
  for (const [name, value] of Object.entries(result.applied))
    assert.equal(after[name], value);
  assert.equal(after.frame_radius, before.frame_radius);
  assert.equal(await framePadding(), `${padding}px`);

  const outOfRange = await call('set_controls', {frame_opacity: 150});
  assert.equal(outOfRange.ok, false);
  assert.deepEqual(outOfRange.applied, {});
  assert.match(outOfRange.errors.frame_opacity, /from 0 to 100/);
  assert.equal((await values()).frame_opacity, opacity);

  const hidden = await call('set_controls', {
    frame_visible: false,
    frame_opacity: 90,
  });
  assert.equal(hidden.ok, false);
  assert.deepEqual(hidden.applied, {frame_visible: false});
  assert.match(hidden.errors.frame_opacity, /hidden/);
  assert.equal((await values()).frame_visible, false);

  const restored = {frame_visible: true, frame_opacity: opacity};
  assert.deepEqual(await call('set_controls', restored), {
    ok: true,
    applied: restored,
  });
  const visible = await values();
  assert.equal(visible.frame_visible, true);
  assert.equal(visible.frame_opacity, opacity);
  return padding;
}
