import chalk from 'chalk';
import {prompt} from 'enquirer';
import * as fs from 'fs';
import path, {join} from 'node:path';
import {execSync} from 'node:child_process';
import {makeEnvFile} from './env-utils';

const log = console.log;
const appEnvLocalDir = join(__dirname, '..', 'apps', 'codeimage', '.env.local');
const apiEnvDir = join(__dirname, '..', 'apps', 'api', '.env');
const apiEnvTestDir = join(__dirname, '..', 'apps', 'api', '.env.test');

async function run() {
  log(chalk.cyan('Make variables for @codeimage/app'));
  const canCreateAppEnv = await askIfWantOverride(appEnvLocalDir);
  if (canCreateAppEnv) {
    buildAppEnvLocal();
  }
  log(chalk.cyan('Make variables for @codeimage/api'));
  const canCreateApiEnv = await askIfWantOverride(apiEnvDir);
  if (canCreateApiEnv) {
    await buildApiEnv();
  }

  const canCreateApiTestEnv = await askIfWantOverride(apiEnvTestDir);
  if (canCreateApiTestEnv) {
    await buildApiTestEnv();
  }

  log(chalk.bgGreen('All variables created successfully.'));

  await askForPrismaMigrations();
}

function buildAppEnvLocal() {
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

  fs.writeFileSync(appEnvLocalDir, makeEnvFile(env), {
    encoding: 'utf8',
  });

  const message =
    'Variables created successfully in /apps/codeimage/.env.local';

  log(chalk.bgCyan(message));
  log(chalk.green(JSON.stringify(env, undefined, 2)));
}

async function buildApiEnv() {
  const defaultDatabase =
    'postgres://postgres:postgres@localhost:5432/codeimage?schema=public';

  const env = {
    DATABASE_URL: '',
    CLIENT_ID_AUTH0: '',
    CLIENT_SECRET_AUTH0: '',
    DOMAIN_AUTH0: '',
    AUTH0_CLIENT_CLAIMS: '',
    AUDIENCE_AUTH0: '',
    GRANT_TYPE_AUTH0: 'client_credentials',
    MOCK_AUTH: true,
  };

  const {dbUrl} = await prompt<{dbUrl: string}>({
    type: 'input',
    initial: defaultDatabase,
    required: true,
    name: 'dbUrl',
    message: 'Please provide a db url connection (postgres)',
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

  const {mockAuth} = await prompt<{mockAuth: boolean}>({
    type: 'confirm',
    initial: true,
    name: 'mockAuth',
    message: 'Do you want to mock Auth0? (recommended)',
  });

  env.MOCK_AUTH = mockAuth ?? true;

  if (!mockAuth) {
    log(
      chalk.yellow(
        'Auth0 will not be mocked. Follow the /docs/auth0.md guide to configure the authentication flow',
      ),
    );
  }

  fs.writeFileSync(apiEnvDir, makeEnvFile(env), {
    encoding: 'utf8',
  });

  const message = 'Variables created successfully in /apps/api/.env';
  log(chalk.bgCyan(message));
  log(chalk.green(JSON.stringify(env, undefined, 2)));
}

async function buildApiTestEnv() {
  const defaultDatabase = 'postgresql://prisma:prisma@localhost:5433/tests';

  const env = {
    DATABASE_URL: '',
    CLIENT_ID_AUTH0: '<client-id-auth>',
    CLIENT_SECRET_AUTH0: '<client-secret-auth>',
    DOMAIN_AUTH0: 'https://example.it',
    AUTH0_CLIENT_CLAIMS: '',
    AUDIENCE_AUTH0: '<audience>',
    GRANT_TYPE_AUTH0: 'client_credentials',
    MOCK_AUTH: false,
  };

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

  fs.writeFileSync(apiEnvDir, makeEnvFile(env), {
    encoding: 'utf8',
  });

  const message = 'Variables created successfully in /apps/api/.env.test';
  log(chalk.bgCyan(message));
  log(chalk.green(JSON.stringify(env, undefined, 2)));
}

async function askForPrismaMigrations() {
  const {runMigrations} = await prompt<{runMigrations: boolean}>({
    type: 'confirm',
    name: 'runMigrations',
    message: 'Do you want to run prisma migrations? (recommended)',
    initial: true,
  });

  if (runMigrations) {
    execSync('pnpm --filter=@codeimage/api prisma:migrate:deploy', {
      stdio: 'inherit',
    });
    execSync('pnpm --filter=@codeimage/api prisma:migrate:deploy-test', {
      stdio: 'inherit',
    });
  }
}

async function askIfWantOverride(filePath: string): Promise<boolean> {
  if (fs.existsSync(filePath)) {
    const fileName = path.basename(filePath);
    const result = await prompt<{override: boolean}>({
      name: 'override',
      type: 'confirm',
      message: `Do you want to override existing ${fileName}? Your configuration will be reset.`,
    });

    return result.override;
  }
  return true;
}

run();
