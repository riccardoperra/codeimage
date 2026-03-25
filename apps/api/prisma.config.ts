import 'dotenv/config';
import {defineConfig, env} from 'prisma/config';

let databaseUrl: string | undefined = undefined;
try {
  databaseUrl = env('DATABASE_URL');
} catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
