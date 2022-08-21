import typescript from '@rollup/plugin-typescript';
import {rmSync} from 'fs';
import {posix} from 'path';
import {defineConfig} from 'rollup';
import * as pkg from './package.json';

const {normalize} = posix;

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

rmSync('dist', {
  force: true,
  recursive: true,
});

const paths = {
  'vite-plugin': 'src/vite-plugin/index.ts',
};

/** @type {import('rollup').RollupOptions} */
const options = {
  input: {
    index: 'src/index.ts',
    ...paths,
  },
  external,
  plugins: [
    typescript({
      declaration: true,
      declarationMap: false,
      outDir: `dist`,
      declarationDir: 'dist/types',
    }),
  ],
  output: [
    {
      dir: 'dist',
      format: 'esm',
      preserveModules: true,
      sourcemap: true,
      entryFileNames: source => {
        const path = normalize(source.facadeModuleId).replaceAll('\\', '/');
        return source.isEntry &&
          Object.keys(paths).some(theme => path.includes(theme))
          ? 'index.mjs'
          : `${source.name}.mjs`;
      },
    },
    {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true,
      entryFileNames: source => {
        const path = normalize(source.facadeModuleId).replaceAll('\\', '/');
        return source.isEntry &&
          Object.keys(paths).some(theme => path.includes(theme))
          ? 'index.cjs'
          : `${source.name}.cjs`;
      },
    },
  ],
};

export default defineConfig(options);
