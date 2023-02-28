import fp from 'fastify-plugin';
import {readdirSync} from 'fs';
import {join} from 'path';
import * as url from 'url';

export default fp<{dir: string}>(
  async (fastify, opts) => {
    console.log(__dirname);
    const files = readdirSync(opts.dir, {withFileTypes: true});

    for (const file of files) {
      if (file.isFile()) {
        const result = await import(
          url.pathToFileURL(join(opts.dir, file.name)).href
        );
        console.log(result);
      }
    }
  },
  {name: 'eventRegistryLoad'},
);
