'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateExample } = require('../src/index');

test('generates a readable .env.example string from a schema', () => {
  const output = generateExample({
    PORT: { type: 'port', default: 3000, description: 'Port the server listens on' },
    DATABASE_URL: { type: 'url', description: 'Postgres connection string' },
    NODE_ENV: { type: 'string', enum: ['development', 'production'] },
  });

  assert.match(output, /# Port the server listens on/);
  assert.match(output, /PORT=3000/);
  assert.match(output, /DATABASE_URL=/);
  assert.match(output, /one of: development \| production/);
});

test('writes the file to disk when outputPath is given', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-doctor-'));
  const outPath = path.join(tmpDir, '.env.example');

  generateExample({ API_KEY: { type: 'string' } }, { outputPath: outPath });

  assert.ok(fs.existsSync(outPath));
  const contents = fs.readFileSync(outPath, 'utf8');
  assert.match(contents, /API_KEY=/);
});
