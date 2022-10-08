import chalk from 'chalk';
import {isAbsolute, resolve} from 'path';
import ms from 'pretty-ms';
import {OutputOptions, rollup, RollupOptions} from 'rollup';
import rollupConfig from '../rollup.config';

const log = chalk;
const outputOptions = rollupConfig.output as OutputOptions[];

build();

function relativeId(id: string): string {
  if (!isAbsolute(id)) return id;
  return resolve(id);
}

async function build() {
  let bundle;
  const start = Date.now();
  let buildFailed = false;
  try {
    // create a bundle
    const files = outputOptions.map(t => relativeId(t.file! || t.dir!));
    let inputFiles: string | undefined;
    if (typeof rollupConfig.input === 'string') {
      inputFiles = rollupConfig.input;
    } else if (rollupConfig.input instanceof Array) {
      inputFiles = rollupConfig.input.join(', ');
    } else if (
      typeof rollupConfig.input === 'object' &&
      rollupConfig.input !== null
    ) {
      inputFiles = Object.values(rollupConfig.input).join(', ');
    }
    console.log(
      log.cyan(`\n${log.bold(inputFiles!)} → ${log.bold(files.join(', '))}...`),
    );
    bundle = await rollup(rollupConfig);
    await Promise.all((outputOptions as RollupOptions[]).map(bundle.write));
    console.log(
      log.green(
        `created ${log.bold(files.join(', '))} in ${chalk.bold(
          ms(Date.now() - start),
        )}`,
      ),
    );
  } catch (error) {
    buildFailed = true;
    console.error(error);
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
  process.exit(buildFailed ? 1 : 0);
}
