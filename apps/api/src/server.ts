import closeWithGrace from 'close-with-grace';
import * as dotenv from 'dotenv';
import Fastify from 'fastify';
import {options} from './app.js';

dotenv.config();

const app = Fastify(options);
app.register(import('./app.js'));

const closeListeners = closeWithGrace({delay: 500}, async ({err}) => {
  if (err) app.log.error(err);
  await app.close();
});

app.addHook('onClose', async () => {
  closeListeners.uninstall();
});

app.listen(
  {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT ?? '3000') || 3000,
  },
  err => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
  },
);
