'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEnv, EnvValidationError } = require('../src/index');

test('returns casted values when everything is valid', () => {
  const result = validateEnv(
    {
      PORT: { type: 'port' },
      NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'] },
      ENABLE_CACHE: { type: 'boolean' },
    },
    {
      source: { PORT: '3000', NODE_ENV: 'production', ENABLE_CACHE: 'true' },
    }
  );

  assert.deepEqual(result, { PORT: 3000, NODE_ENV: 'production', ENABLE_CACHE: true });
});

test('applies defaults when a variable is missing', () => {
  const result = validateEnv(
    { LOG_LEVEL: { type: 'string', default: 'info' } },
    { source: {} }
  );
  assert.equal(result.LOG_LEVEL, 'info');
});

test('allows optional variables to be left out entirely', () => {
  const result = validateEnv(
    { OPTIONAL_FLAG: { type: 'string', required: false } },
    { source: {} }
  );
  assert.equal(result.OPTIONAL_FLAG, undefined);
});

test('throws EnvValidationError aggregating ALL problems at once', () => {
  let caught;
  try {
    validateEnv(
      {
        PORT: { type: 'port' },
        API_KEY: { type: 'string', minLength: 10 },
        NODE_ENV: { type: 'string', enum: ['development', 'production'] },
      },
      { source: { PORT: 'not-a-port', API_KEY: 'short', NODE_ENV: 'staging' } }
    );
  } catch (err) {
    caught = err;
  }

  assert.ok(caught instanceof EnvValidationError);
  assert.equal(caught.issues.length, 3);
  assert.deepEqual(
    caught.issues.map((i) => i.key).sort(),
    ['API_KEY', 'NODE_ENV', 'PORT']
  );
});

test('reports a missing required variable', () => {
  let caught;
  try {
    validateEnv({ DATABASE_URL: { type: 'url' } }, { source: {} });
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof EnvValidationError);
  assert.match(caught.issues[0].message, /required but missing/);
});

test('validates url and email types', () => {
  assert.throws(() =>
    validateEnv({ SITE_URL: { type: 'url' } }, { source: { SITE_URL: 'not a url' } })
  );
  assert.doesNotThrow(() =>
    validateEnv({ SITE_URL: { type: 'url' } }, { source: { SITE_URL: 'https://example.com' } })
  );

  assert.throws(() =>
    validateEnv({ ADMIN_EMAIL: { type: 'email' } }, { source: { ADMIN_EMAIL: 'nope' } })
  );
  assert.doesNotThrow(() =>
    validateEnv({ ADMIN_EMAIL: { type: 'email' } }, { source: { ADMIN_EMAIL: 'a@b.com' } })
  );
});

test('validates json type and parses it', () => {
  const result = validateEnv(
    { FEATURE_FLAGS: { type: 'json' } },
    { source: { FEATURE_FLAGS: '{"beta":true}' } }
  );
  assert.deepEqual(result.FEATURE_FLAGS, { beta: true });
});

test('supports custom validate functions', () => {
  const schema = {
    PASSWORD: {
      type: 'string',
      validate: (v) => (/\d/.test(v) ? true : 'must contain at least one digit'),
    },
  };
  assert.throws(() => validateEnv(schema, { source: { PASSWORD: 'abcdef' } }));
  assert.doesNotThrow(() => validateEnv(schema, { source: { PASSWORD: 'abc123' } }));
});

test('enforces min/max for numbers', () => {
  const schema = { RETRY_COUNT: { type: 'number', min: 1, max: 5 } };
  assert.throws(() => validateEnv(schema, { source: { RETRY_COUNT: '0' } }));
  assert.throws(() => validateEnv(schema, { source: { RETRY_COUNT: '10' } }));
  assert.doesNotThrow(() => validateEnv(schema, { source: { RETRY_COUNT: '3' } }));
});
