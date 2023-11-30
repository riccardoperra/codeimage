import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

const generatedTypes = fs.existsSync('./generated');
if (!generatedTypes) {
    console.warn("Prisma types has not been generated. Skipping build");
    process.exit(0);
}

execSync(`pnpm run build:ts`, { stdio: 'inherit' })