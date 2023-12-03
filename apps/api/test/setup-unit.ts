import * as dotEnv from 'dotenv';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function setup() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  dotEnv.config({path: `${__dirname}/../.env.test`}).parsed;
}
