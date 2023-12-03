import {execSync} from 'node:child_process';

export async function setupIntegrationTest() {
  execSync(
    `pnpm run prisma:migrate:reset-test --force && pnpm run prisma:migrate:deploy-test`,
    {stdio: 'inherit'},
  );

  const {client} = await import('./helpers/seed.js');
  await client.$connect();
}
