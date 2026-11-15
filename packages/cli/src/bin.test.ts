import {spawn} from 'node:child_process';
import {mkdtemp, readdir, rm, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {PNG} from 'pngjs';

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'codeimage-cli-'));
});
afterEach(() => rm(dir, {recursive: true, force: true}));
function run(
  args: string[],
  options: {quiet?: boolean; packed?: boolean} = {},
) {
  return new Promise<{status: number | null; stdout: Buffer; stderr: string}>(
    (resolveResult, reject) => {
      const child = spawn(
        process.execPath,
        [
          resolve(
            `packages/cli/${options.packed ? 'publish/' : ''}dist/bin.js`,
          ),
          ...args,
        ],
        {
          env: {
            ...process.env,
            CI: '1',
            CODEIMAGE_CACHE_DIR: join(dir, 'cache'),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on('data', data => stdout.push(data));
      child.stderr.on('data', data => stderr.push(data));
      child.on('error', reject);
      child.on('close', status =>
        resolveResult({
          status,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr).toString(),
        }),
      );
      child.stdin.end('const answer = 42;\n');
    },
  );
}
describe('CLI streams', {timeout: 30_000}, () => {
  it.each([false, true])(
    'pipes a valid PNG with no terminal text, packed=%s',
    async packed => {
      const result = await run(['--offline'], {packed});
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      expect(PNG.sync.read(result.stdout).width).toBeGreaterThan(0);
      expect(result.stderr).not.toContain('\x1b');
      expect(await readdir(dir)).toEqual([]);
    },
  );
  it('keeps file output, sidecars, help and inventory off stdout', async () => {
    const path = join(dir, 'out.png');
    const image = await run(['--offline', '-o', path, '--alt', '--quiet']);
    expect(image.status, image.stderr).toBe(0);
    expect(image.stdout.length).toBe(0);
    expect(PNG.sync.read(await readFile(path)).width).toBeGreaterThan(0);
    expect(image.stderr).toContain(path);
    for (const args of [['--help'], ['fonts', 'list', '--json']]) {
      const result = await run(args);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.length).toBe(0);
      expect(result.stderr).not.toContain('\x1b');
      if (args[0] === 'fonts')
        expect(JSON.parse(result.stderr)).toEqual(
          expect.arrayContaining([
            expect.objectContaining({id: 'ui', state: 'bundled'}),
          ]),
        );
    }
  });
  it('packs only the same allowlisted Inter/JB font files', async () => {
    const fonts = (
      await readdir(resolve('packages/cli/publish/dist/fonts'))
    ).filter(file => /\.(ttf|woff2)$/.test(file));
    expect(fonts.length).toBe(9);
    expect(fonts.every(file => /^(Inter|inter-|jetbrains-)/.test(file))).toBe(
      true,
    );
  });
  it('reports offline misses and usage errors with the right exit codes', async () => {
    const offline = await run(['--offline', '--font=fira-code']);
    expect(offline.status).toBe(1);
    expect(offline.stdout.length).toBe(0);
    expect(offline.stderr).toContain('codeimage fonts install fira-code');
    for (const args of [
      ['fonts', 'install'],
      ['--font-file=/missing.ttf'],
      ['--font=bad'],
      ['fonts', 'install', 'bad'],
    ]) {
      const result = await run(args);
      expect(result.status, result.stderr).toBe(2);
      expect(result.stdout.length).toBe(0);
    }
  });
  it('renders a local font without touching the cache', async () => {
    const path = resolve(
      'apps/codeimage/public/assets/fonts/monaspace/MonaspaceNeonVarVF[wght,wdth,slnt].ttf',
    );
    const result = await run(['--offline', '--quiet', '--font-file', path]);
    expect(result.status, result.stderr).toBe(0);
    expect(PNG.sync.read(result.stdout).width).toBeGreaterThan(0);
    expect(await readdir(dir)).toEqual([]);
    expect(result.stderr).not.toContain('\x1b');
  });
});
