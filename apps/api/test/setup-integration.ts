import {PrismaClient} from '@prisma/client';
import * as dotEnv from 'dotenv';
import {execSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

let instance: PrismaClient;

export async function setup() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  dotEnv.config({path: `${__dirname}/../.env.test`}).parsed;

  execSync(
    `pnpm run prisma:migrate:reset-test --force && pnpm run prisma:migrate:deploy-test`,
    {stdio: 'inherit'},
  );

  const {client} = await import('./helpers/seed.js');

  instance = client;

  await client.$connect();
}

export async function teardown() {
  await instance.$disconnect();
}
