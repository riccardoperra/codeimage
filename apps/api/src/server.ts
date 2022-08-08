// Read the .env file.
// Require library to exit fastify process, gracefully (if possible)
import * as closeWithGrace from 'close-with-grace';
import * as dotenv from 'dotenv';
// Require the framework
import Fastify from 'fastify';

dotenv.config();

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
app.register(import('./app'));

// delay is the number of milliseconds for the graceful close to finish
const closeListeners = closeWithGrace({delay: 500}, async function ({err}) {
  if (err) {
    app.log.error(err);
  }
  await app.close();
} as closeWithGrace.CloseWithGraceAsyncCallback);

app.addHook('onClose', async (instance, done) => {
  closeListeners.uninstall();
  done();
});

// Start listening.
app.listen({port: parseInt(process.env.PORT as string) || 3000}, (err: any) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
