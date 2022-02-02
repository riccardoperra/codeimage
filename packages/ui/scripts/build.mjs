// @ts-check

import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

import { build as buildAsync } from 'esbuild'
import glob from 'tiny-glob'

import { jsxRuntime } from 'esbuild-plugins'

// @ts-expect-error
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const root = path.resolve(__dirname, '..')

/** @type {(cmd: string) => void} */
const run = cmd => void execSync(cmd, { stdio: 'inherit', cwd: root })

export async function build() {
  try {
    const entryPoints = await glob(path.resolve(root, 'src', '**', '*.{ts,tsx}'))

    // Generate ESM output

    await buildAsync({
      format: 'esm',
      outdir: 'dist/esm',
      plugins: [jsxRuntime()],
      tsconfig: 'tsconfig.esm.json',
      entryPoints,
      absWorkingDir: root,
    })

    // Generate TS definitions
    run(`pnpm tsc -p tsconfig.dts.json`)
  } catch (e) {}
}
