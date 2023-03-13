import * as dotEnv from 'dotenv';
import {presetSeed, projectSeed, userSeed} from './helpers/seed';

dotEnv.config({path: `${__dirname}/../.env.test`}).parsed;

async function clean() {
  await projectSeed.clean();
  await presetSeed.clean();
  await userSeed.clean();
}

clean();
