#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { validateEnv, generateExample } = require('../src/index');

function loadDotEnvIntoProcess(envPath) {
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, 'utf8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadSchema(configPath) {
  const resolved = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolved)) {
    console.error(`✖ Could not find config file at ${resolved}`);
    console.error('  Create one (e.g. env-doctor.config.js) that exports your schema:');
    console.error('  module.exports = { PORT: { type: "port" } };');
    process.exit(1);
  }
  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(resolved);
}

function printHelp() {
  console.log(`env-doctor - validate your environment variables

Usage:
  env-doctor check [--config <path>] [--env <path>]
  env-doctor generate-example [--config <path>] [--out <path>]
  env-doctor --help

Commands:
  check              Validate process.env / a .env file against your schema
  generate-example   Write a .env.example file from your schema

Options:
  --config <path>    Path to schema config file (default: env-doctor.config.js)
  --env <path>       Path to .env file to load before checking (default: .env)
  --out <path>       Output path for generate-example (default: .env.example)
`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const command = args._[0];

  if (!command || args.help) {
    printHelp();
    process.exit(command ? 0 : 1);
  }

  const configPath = args.config || 'env-doctor.config.js';

  if (command === 'check') {
    const envPath = path.resolve(process.cwd(), args.env || '.env');
    loadDotEnvIntoProcess(envPath);
    const schema = loadSchema(configPath);
    try {
      validateEnv(schema);
      console.log('✔ All environment variables are valid.');
      process.exit(0);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  } else if (command === 'generate-example') {
    const schema = loadSchema(configPath);
    const outPath = path.resolve(process.cwd(), args.out || '.env.example');
    generateExample(schema, { outputPath: outPath });
    console.log(`✔ Wrote ${outPath}`);
  } else {
    console.error(`Unknown command "${command}"`);
    printHelp();
    process.exit(1);
  }
}

main();
