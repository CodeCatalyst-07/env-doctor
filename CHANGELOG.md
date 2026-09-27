# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-09-27

### Added
- `validateEnv(schema, options)` — schema-based validation of `process.env` with aggregated error reporting
- Field types: `string`, `number`, `boolean`, `url`, `email`, `port`, `json`
- Field rules: `required`, `default`, `enum`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate`
- `generateExample(schema, options)` — generates `.env.example` content/file from a schema
- `env-doctor` CLI with `check` and `generate-example` commands
- TypeScript type declarations
- Full test suite using Node's built-in test runner
