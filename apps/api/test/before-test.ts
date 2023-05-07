import * as dotEnv from 'dotenv';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {presetSeed, projectSeed, userSeed} from './helpers/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotEnv.config({path: `${__dirname}/../.env.test`}).parsed;

async function clean() {
  await projectSeed.clean();
  await presetSeed.clean();
  await userSeed.clean();
}

clean();
