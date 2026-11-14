import assert from 'node:assert/strict';
import Fastify from 'fastify';
import app, {options} from '../dist/app.mjs';

const server = Fastify({...options, logger: false});
try {
  await server.register(app, {
    config: {MOCK_AUTH: true, MOCK_AUTH_EMAIL: 'built-smoke@example.it'},
  });
  for (const url of ['/health', '/api/v1/project', '/api/v1/preset']) {
    const response = await server.inject({url});
    assert.equal(response.statusCode, 200, `${url}: ${response.body}`);
    assert.ok(response.headers['request-id']);
    console.log(`${url} -> 200 with request-id`);
  }
  const missing = await server.inject('/api/v1/preset/missing');
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.json().code, 'NotFoundPresetException');
  assert.equal(missing.json().requestId, missing.headers['request-id']);
  console.log(
    'Authenticated missing preset -> 404 NotFoundPresetException with matching request-id',
  );
} finally {
  await server.close();
}
