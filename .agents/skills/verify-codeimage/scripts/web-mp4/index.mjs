import {editProject} from './edit.mjs';
import {downloadProject} from './download.mjs';
import {compareExports} from './compare.mjs';
import assert from 'node:assert/strict';
export async function verifyWebMp4({page, base, out}) {
  const scenario = process.env.A6_CASE ?? 'unequal';
  assert.ok(['unequal', 'hidden', 'signature'].includes(scenario));
  const requestedFps = Number(process.env.A6_FPS ?? 30);
  const errors = [];
  const onError = error => errors.push(String(error));
  page.on('pageerror', onError);
  try {
    const codes = await editProject({page, base, scenario});
    const project = await downloadProject({
      page,
      out,
      scenario,
      requestedFps,
      codes,
    });
    return await compareExports({
      page,
      out,
      project,
      scenario,
      requestedFps,
      errors,
    });
  } finally {
    page.off('pageerror', onError);
  }
}
