import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {cp, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const require = createRequire(import.meta.url);
const port = Number(process.argv[2] ?? 4459);
const out = resolve(process.argv[3] ?? `/tmp/codeimage-cold-${Date.now()}`);
const starts = Number(process.argv[4] ?? 20);
assert.notEqual(port, 4321);
await mkdir(out, {recursive: true});
const publicDir = await mkdtemp('/tmp/codeimage-cold-public-');
const resultsPath = resolve(out, 'results.json');
const results = existsSync(resultsPath)
  ? JSON.parse(await readFile(resultsPath, 'utf8'))
  : [];
try {
  await cp(resolve(root, 'apps/codeimage/public'), publicDir, {
    recursive: true,
  });
  await cp(
    require.resolve('msw/mockServiceWorker.js', {
      paths: [resolve(root, 'apps/codeimage')],
    }),
    resolve(publicDir, 'mockServiceWorker.js'),
  );
  for (let run = results.length; run < starts; run++) {
    for (const cache of [
      'node_modules/.vite',
      'apps/codeimage/node_modules/.vite',
    ])
      await rm(resolve(root, cache), {recursive: true, force: true});
    let log = '';
    const server = spawn(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        'import {createServer} from "vite"; const server = await createServer({publicDir:process.env.VERIFY_PUBLIC,server:{host:"127.0.0.1",port:Number(process.env.VERIFY_PORT),strictPort:true}}); await server.listen(); console.log("COLD_READY"); process.on("SIGTERM",async()=>{await server.close();process.exit(0)});',
      ],
      {
        cwd: resolve(root, 'apps/codeimage'),
        env: {
          ...process.env,
          VERIFY_PUBLIC: publicDir,
          VERIFY_PORT: String(port),
          VITE_ENABLE_MSW: 'true',
          VITE_MOCK_AUTH: 'true',
          VITE_API_BASE_URL: '',
          VITE_PRESET_LIMIT: '10',
          VITE_PRESET_LIMIT_GUEST: '5',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    server.stdout.on('data', chunk => {
      log += chunk;
    });
    server.stderr.on('data', chunk => {
      log += chunk;
    });
    const exited = new Promise(resolve => server.once('exit', resolve));
    try {
      for (let attempt = 0; !log.includes('COLD_READY'); attempt++) {
        assert(
          server.exitCode === null && attempt < 120,
          `Vite startup failed: ${log}`,
        );
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      const evidence = resolve(out, String(run + 1));
      console.log(
        `Cold start ${run + 1}/${starts}, six fresh contexts, delayed=${run % 2}`,
      );
      const review = spawn(
        process.execPath,
        [
          fileURLToPath(new URL('./verify-review.mjs', import.meta.url)),
          `http://127.0.0.1:${port}`,
          evidence,
        ],
        {
          cwd: root,
          env: {
            ...process.env,
            REVIEW_STARTUP_ONLY: '1',
            REVIEW_STARTUP_CONCURRENT: '1',
            REVIEW_STARTUP_DELAY: String(run % 2),
          },
          stdio: 'inherit',
        },
      );
      const code = await new Promise(resolve => review.once('exit', resolve));
      assert.equal(code, 0, `Cold start ${run + 1} failed`);
      results.push({
        run: run + 1,
        delayed: Boolean(run % 2),
        checks: JSON.parse(
          await readFile(resolve(evidence, 'checks.json'), 'utf8'),
        ),
      });
      await writeFile(
        resolve(out, 'results.json'),
        JSON.stringify(results, null, 2),
      );
    } finally {
      server.kill('SIGTERM');
      const timeout = setTimeout(() => server.kill('SIGKILL'), 5000);
      await exited;
      clearTimeout(timeout);
      await writeFile(resolve(out, `server-${run + 1}.log`), log);
    }
  }
} finally {
  await rm(publicDir, {recursive: true, force: true});
}
