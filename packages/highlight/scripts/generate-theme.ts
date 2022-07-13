import {prompt} from 'enquirer';
import chalk from 'chalk';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'fs';
import {join} from 'path';

const log = console.log;

async function init() {
  const response = await prompt<{themeName: string}>({
    type: 'input',
    name: 'themeName',
    required: true,
    message: 'Insert the theme name (example: githubDark)',
  });

  const {themeName} = response;

  const themesPath = join(__dirname, '../src/lib/themes');
  const templatesPath = join(__dirname, 'templates');

  if (existsSync(`${themesPath}/${themeName}`)) {
    log(chalk.red(`ERROR: Theme ${themeName} already exists`));
    return;
  }

  mkdirSync(join(themesPath, themeName));

  const themeTemplate = readFileSync(
    join(templatesPath, 'theme.ts.txt'),
    'utf8',
  );

  const indexTemplate = readFileSync(
    join(templatesPath, 'index.ts.txt'),
    'utf8',
  );

  log(chalk.green(`Templates loaded successfully!`));

  const path = join(themesPath, themeName, `${themeName}.ts`);

  writeFileSync(path, themeTemplate.replaceAll('%%THEME_NAME%%', themeName));

  writeFileSync(
    join(themesPath, themeName, 'index.ts'),
    indexTemplate.replaceAll('%%THEME_NAME%%', themeName),
  );

  log(chalk.green(`Theme ${themeName} created successfully!`));
  log(chalk.cyan(`Output folder: ./src/lib/themes/${themeName}`));

  await import('../package.json').then(json => {
    const packageJson = {...json.default};
    (packageJson.exports as any)[`./${themeName}`] = {
      import: `./dist/lib/themes/${themeName}/index.js`,
      types: `./dist/lib/themes/${themeName}/index.d.ts`,
    };
    (packageJson.typesVersions as any)['*'][themeName] = [
      `./dist/lib/themes/${themeName}/index.d.ts`,
    ];

    writeFileSync(
      join(__dirname, '../package.json'),
      JSON.stringify(packageJson, null, 2),
      {encoding: 'utf8'},
    );
  });
}

init();
