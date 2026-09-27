'use strict';

/**
 * Run with: node examples/basic-usage.js
 * Try it both with and without setting env vars, e.g.:
 *   PORT=3000 DATABASE_URL=postgres://localhost/db node examples/basic-usage.js
 */
const { validateEnv } = require('../src/index');

try {
  const env = validateEnv({
    PORT: { type: 'port', default: 3000 },
    DATABASE_URL: { type: 'url' },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production', 'test'],
      default: 'development',
    },
    ENABLE_CACHE: { type: 'boolean', default: false },
  });

  console.log('Environment is valid:');
  console.log(env);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
