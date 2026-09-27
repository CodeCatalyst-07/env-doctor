# env-doctor

Validate your `.env` / `process.env` against a schema, get **one aggregated diagnostic report** instead of crashing on the first bad variable, and **auto-generate `.env.example`** so it can never drift from what your code actually needs.

[![npm version](https://img.shields.io/npm/v/%40codecatalyst-07%2Fenv-doctor.svg)](https://www.npmjs.com/package/%40codecatalyst-07%2Fenv-doctor)
[![license](https://img.shields.io/npm/l/%40codecatalyst-07%2Fenv-doctor.svg)](./LICENSE)

## Why

Every Node.js project depends on environment variables, and one of the most common "works on my machine" bugs is a missing, misspelled, or malformed variable that only fails at runtime — sometimes in production.

Most projects handle this by writing scattered `if (!process.env.X) throw ...` checks, or not checking at all. That gives you:

- One error at a time — fix one, restart, hit the next one, repeat.
- No single source of truth for what variables your app needs.
- A `.env.example` file that's usually stale within a month.

**env-doctor** fixes all three: define your schema once, get every problem reported together, and generate your `.env.example` straight from that same schema.

```
env-doctor found 3 problems with your environment variables:

  ✖ PORT: expected a valid port number (1-65535), got "abc"
  ✖ DATABASE_URL: is required but missing
  ✖ NODE_ENV: must be one of [development, production, test], got "stagng"
```

## Installation

```bash
npm install @codecatalyst-07/env-doctor
```

## Basic usage

```js
// config.js
const { validateEnv } = require('@codecatalyst-07/env-doctor');

const env = validateEnv({
  PORT: { type: 'port', default: 3000 },
  DATABASE_URL: { type: 'url' },
  NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'], default: 'development' },
  ADMIN_EMAIL: { type: 'email' },
  ENABLE_CACHE: { type: 'boolean', default: false },
});

// env.PORT is a real number, env.ENABLE_CACHE is a real boolean, etc.
module.exports = env;
```

If any variable is missing or invalid, `validateEnv` throws an `EnvValidationError` **once, with every problem listed**, instead of stopping at the first one. Run this at the top of your app's entrypoint so it fails fast, with a clear message, before anything else starts.

## CLI usage

env-doctor also ships a CLI so you can validate environments (e.g. in CI, or before `docker run`) without writing any code.

1. Create a config file exporting your schema:

```js
// env-doctor.config.js
module.exports = {
  PORT: { type: 'port', default: 3000, description: 'Port the server listens on' },
  DATABASE_URL: { type: 'url', description: 'Postgres connection string' },
  NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'] },
};
```

2. Check your environment:

```bash
npx env-doctor check
# ✔ All environment variables are valid.
```

3. Generate `.env.example` from the same schema (run this in a `postinstall`/CI step so it never goes stale):

```bash
npx env-doctor generate-example
# ✔ Wrote .env.example
```

CLI flags: `--config <path>` (default `env-doctor.config.js`), `--env <path>` (default `.env`), `--out <path>` (default `.env.example`).

## API

### `validateEnv(schema, options?)`

Validates `options.source` (defaults to `process.env`) against `schema` and returns a plain object with cleaned, correctly-typed values.

**Parameters**

| Name | Type | Description |
|---|---|---|
| `schema` | `Record<string, FieldSchema>` | Map of environment variable name → field rules (see below) |
| `options.source` | `object` | Object to read values from. Defaults to `process.env`. |

**Returns:** `Record<string, any>` — an object with one key per schema field, with values cast to their declared type.

**Throws:** `EnvValidationError` if one or more variables are missing/invalid. `error.issues` is an array of `{ key, message }` for every problem found.

#### Field schema options

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | `'string' \| 'number' \| 'boolean' \| 'url' \| 'email' \| 'port' \| 'json'` | `'string'` | Expected type; the raw string is parsed/validated accordingly |
| `required` | `boolean` | `true` | Whether the variable must be present (ignored if `default` is set) |
| `default` | `any` | — | Value used when the variable is missing |
| `enum` | `Array<string \| number>` | — | List of allowed values, checked after type casting |
| `min` / `max` | `number` | — | Numeric bounds (types `number`, `port`) |
| `minLength` / `maxLength` | `number` | — | String length bounds (type `string`) |
| `pattern` | `RegExp` | — | Regex the raw value must match |
| `validate` | `(value) => true \| string` | — | Custom validator; return `true` to pass or a string error message to fail |
| `description` | `string` | — | Used as a comment when generating `.env.example` |

### `generateExample(schema, options?)`

Builds a `.env.example` file's contents from a schema.

| Name | Type | Description |
|---|---|---|
| `schema` | `Record<string, FieldSchema>` | Same schema shape as `validateEnv` |
| `options.outputPath` | `string` | If given, writes the file to this path |

**Returns:** `string` — the generated file contents (always returned, even if `outputPath` is also given).

## Examples

More runnable examples are in [`examples/`](./examples):

```js
const { validateEnv } = require('@codecatalyst-07/env-doctor');

try {
  const env = validateEnv({
    STRIPE_SECRET_KEY: { type: 'string', minLength: 20 },
    RETRY_COUNT: { type: 'number', min: 1, max: 10, default: 3 },
    FEATURE_FLAGS: { type: 'json', default: '{}' },
    ADMIN_PASSWORD: {
      type: 'string',
      validate: (v) => (/\d/.test(v) ? true : 'must contain at least one digit'),
    },
  });
  console.log(env);
} catch (err) {
  console.error(err.message); // full aggregated report
  process.exit(1);
}
```

## Limitations

- Supports flat key → value schemas only; nested/structured env vars should use `type: 'json'`.
- Does not read `.env` files itself when used as a library — pair it with [`dotenv`](https://www.npmjs.com/package/dotenv) (call `require('dotenv').config()` before `validateEnv`). The CLI's `check` command does load a `.env` file for you.
- Type casting is intentionally simple (no i18n number formats, no custom date parsing).

## Contributing

Issues and PRs are welcome.

1. Fork the repo and create a branch
2. `npm install`
3. `npm test` — please add/update tests for any behavior change
4. Open a PR describing the change

## License

MIT © CodeCatalyst-07
