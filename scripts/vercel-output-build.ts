import chalk from 'chalk';
import {cpSync, existsSync, mkdirSync, rmdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {ConfigEnv, Plugin, ResolvedConfig} from 'vite';

const ENABLE_VERCEL_BUILD = process.env.ENABLE_VERCEL_BUILD === 'true';

/**
 * Generate a .vercel/output folder with the static assets from the generated build.
 */
export function withStaticVercelPreview(): Plugin {
  let config: ResolvedConfig;
  let command: ConfigEnv['command'];

  function getVercelDir(): string {
    return resolve(join(config.root, '.vercel'));
  }

  const configuration = {
    version: 3,
    routes: [
      {
        handle: 'filesystem',
      },
      {
        check: true,
        src: '/(.*)',
        dest: '/',
      },
    ],
  };

  return {
    name: 'vercel-static-build',
    enforce: 'post',

    config: (userConfig, env) => {
      if (env.command === 'build') {
        command = env.command;
      }
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    buildStart() {
      const vercelDir = getVercelDir();
      if (existsSync(vercelDir)) {
        rmdirSync(vercelDir, {recursive: true});
      }
    },
    closeBundle() {
      console.log(); // Empty log
      if (!ENABLE_VERCEL_BUILD || command !== 'build') {
        console.log(chalk.cyan('Skipping Vercel build.'));
        return;
      }
      console.log(chalk.cyan('Building for Vercel output...'));
      const vercelDir = getVercelDir();
      const outputDir = join(vercelDir, 'output');
      mkdirSync(join(vercelDir, 'output'), {recursive: true});
      writeFileSync(
        join(outputDir, 'config.json'),
        JSON.stringify(configuration),
        {encoding: 'utf-8'},
      );

      const distFolder = resolve(join(config.root, 'dist'));
      cpSync(distFolder, join(outputDir, 'static'), {recursive: true});
      console.log(chalk.green('Vercel output generated successfully.'));
    },
  };
}
