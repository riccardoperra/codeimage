import chalk from 'chalk';
import {prompt} from 'enquirer';
import * as fs from 'fs';
import {execSync} from 'node:child_process';
import path, {join} from 'node:path';
import {makeEnvFile} from './env-utils';

const log = console.log;
const appEnvLocalDir = join(__dirname, '..', 'apps', 'codeimage', '.env.local');
const apiEnvDir = join(__dirname, '..', 'apps', 'api', '.env');
const apiEnvTestDir = join(__dirname, '..', 'apps', 'api', '.env.test');

const runOnCodeSandbox = process.env.RUN_ON_CODESANDBOX;

async function run() {
  try {
    await buildAppEnvLocal();
    await buildApiEnv();
    await buildApiTestEnv();
    log(chalk.bgGreen('All variables created successfully.'));
    await askForPrismaMigrations();
  } catch (e) {
    process.exit(0);
  }
}

async function buildAppEnvLocal() {
  log(chalk.cyan('Make variables for @codeimage/app'));

  const {exists, override} = await askIfWantOverride(appEnvLocalDir);
  if (exists && !override) {
    return;
  }

  const env = {
    // Mocks
    VITE_ENABLE_MSW: true,
    VITE_MOCK_AUTH: true,
    // Api
    VITE_API_BASE_URL: '',
    // Auth0,
    VITE_PUBLIC_AUTH0_DOMAIN: '',
    VITE_PUBLIC_AUTH0_CLIENT_ID: '',
    VITE_PUBLIC_MY_CALLBACK_URL: '',
    VITE_PUBLIC_AUTH0_AUDIENCE: '',
  };

  writeEnv(env, appEnvLocalDir);

  if (exists && override) {
    await askForBackup(appEnvLocalDir);
  }
}

async function buildApiEnv() {
  log(chalk.cyan('Make variables for @codeimage/api'));
  const {exists, override} = await askIfWantOverride(apiEnvDir);
  if (exists && !override) {
    return;
  }

  const defaultDatabase =
    'postgres://postgres:postgres@localhost:5432/codeimage?schema=public';

  const env = {
    DATABASE_URL: defaultDatabase,
    CLIENT_ID_AUTH0: 'clientId',
    CLIENT_SECRET_AUTH0: 'clientSecret',
    DOMAIN_AUTH0: 'dev',
    AUTH0_CLIENT_CLAIMS: 'https://example.com/',
    AUDIENCE_AUTH0: 'https://example.com/',
    GRANT_TYPE_AUTH0: 'client_credentials',
    MOCK_AUTH: true,
    MOCK_AUTH_EMAIL: 'dev@example.it',
    ALLOWED_ORIGINS: '*',
  };

  if (!runOnCodeSandbox) {
    const {dbUrl} = await prompt<{dbUrl: string}>({
      type: 'input',
      initial: defaultDatabase,
      required: true,
      name: 'dbUrl',
      message: 'Please provide a db url connection (postgres)',
    });

    if (dbUrl === defaultDatabase) {
      log(
        chalk.yellow(
          'You are using the default url connection. Make sure to run the docker-compose.dev.yml or to have an existing postgres container.',
        ),
      );
    } else {
      log(
        chalk.yellow(
          'You are using a custom db url connection. Make sure your db is running and reachable',
        ),
      );
    }

    const {mockAuth} = await prompt<{mockAuth: boolean}>({
      type: 'confirm',
      initial: true,
      name: 'mockAuth',
      message: 'Do you want to mock Auth0? (recommended)',
    });

    if (!mockAuth) {
      log(
        chalk.yellow(
          'Auth0 will not be mocked. Follow the /docs/auth0.md guide to configure the authentication flow',
        ),
      );
    }

    env.MOCK_AUTH = mockAuth ?? true;
    env.DATABASE_URL = dbUrl ?? defaultDatabase;
  }

  writeEnv(env, apiEnvDir);

  if (exists && override) {
    await askForBackup(apiEnvDir);
  }
}

async function buildApiTestEnv() {
  const {exists, override} = await askIfWantOverride(apiEnvTestDir);
  if (exists && !override) {
    return;
  }

  const defaultDatabase =
    'postgresql://postgres:postgres@localhost:5433/codeimage_test';

  const env = {
    DATABASE_URL: defaultDatabase,
    CLIENT_ID_AUTH0: '<client-id-auth>',
    CLIENT_SECRET_AUTH0: '<client-secret-auth>',
    DOMAIN_AUTH0: 'https://example.com',
    AUTH0_CLIENT_CLAIMS: 'https://example.com',
    AUDIENCE_AUTH0: '<audience>',
    GRANT_TYPE_AUTH0: 'client_credentials',
    MOCK_AUTH: false,
    MOCK_AUTH_EMAIL: 'dev@example.it',
    ALLOWED_ORIGINS: '*',
  };

  if (!runOnCodeSandbox) {
    const {dbUrl} = await prompt<{dbUrl: string}>({
      type: 'input',
      initial: defaultDatabase,
      required: true,
      name: 'dbUrl',
      message: 'Please provide a test db url connection (postgres)',
    });

    if (dbUrl === defaultDatabase) {
      log(
        chalk.green(
          'You are using the default url connection. Make sure to run the docker-compose.dev.yml or to have an existing postgres container.',
        ),
      );
    } else {
      log(
        chalk.yellow(
          'You are using a custom db url connection. Make sure your db is running and reachable',
        ),
      );
    }

    env.DATABASE_URL = dbUrl ?? defaultDatabase;
  }

  writeEnv(env, apiEnvTestDir);

  if (exists && override) {
    await askForBackup(apiEnvTestDir);
  }
}

async function askForPrismaMigrations() {
  let runMigrations = true;
  if (!runOnCodeSandbox) {
    const data = await prompt<{runMigrations: boolean}>({
      type: 'confirm',
      name: 'runMigrations',
      message: 'Do you want to run prisma migrations? (recommended)',
      initial: true,
    });
    runMigrations = data.runMigrations;
  }
  if (runMigrations) {
    execSync('pnpm --filter=@codeimage/api prisma:migrate:deploy', {
      stdio: 'inherit',
    });
    execSync('pnpm --filter=@codeimage/api prisma:migrate:deploy-test', {
      stdio: 'inherit',
    });
    execSync('pnpm --filter=@codeimage/api prisma:generate', {
      stdio: 'inherit',
    });
  }
}

function writeEnv(env: Record<string, string | number | boolean>, dir: string) {
  fs.writeFileSync(dir, makeEnvFile(env), {encoding: 'utf8'});
  const message = `Variables created successfully in ${dir}`;
  log(chalk.bgCyan(message));
  log(chalk(JSON.stringify(env, undefined, 2)));
}

async function askForBackup(dir: string) {
  if (runOnCodeSandbox || !fs.existsSync(dir)) {
    return;
  }

  const {backup} = await prompt<{backup: boolean}>({
    name: 'backup',
    type: 'confirm',
    message: `Do you want to make a backup of your previous configuration?`,
  });

  if (!backup) return;

  const dirName = path.parse(dir).dir;

  fs.copyFileSync(dir, `${dirName}/${path.basename(dir)}.backup`);
}

async function askIfWantOverride(
  filePath: string,
): Promise<{override: boolean; exists: boolean}> {
  if (runOnCodeSandbox) {
    return {
      exists: false,
      override: true,
    };
  }

  if (fs.existsSync(filePath)) {
    const fileName = path.basename(filePath);
    const result = await prompt<{override: boolean}>({
      name: 'override',
      type: 'confirm',
      message: `Do you want to override existing ${fileName}? Your configuration will be reset.`,
    });

    return {
      exists: true,
      override: result.override,
    };
  }
  return {
    exists: false,
    override: true,
  };
}

run();
