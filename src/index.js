'use strict';

const fs = require('fs');
const { casters } = require('./validators/types');
const { EnvValidationError } = require('./errors');

/**
 * @typedef {Object} FieldSchema
 * @property {'string'|'number'|'boolean'|'url'|'email'|'port'|'json'} [type='string']
 * @property {boolean} [required=true] whether the var must be present (ignored if `default` is set)
 * @property {*} [default] value used when the var is missing
 * @property {Array<string|number>} [enum] list of allowed values (checked after type casting)
 * @property {number} [min] minimum numeric value (type: number/port)
 * @property {number} [max] maximum numeric value (type: number/port)
 * @property {number} [minLength] minimum string length (type: string)
 * @property {number} [maxLength] maximum string length (type: string)
 * @property {RegExp} [pattern] regex the raw string must match
 * @property {(value:*) => (true|string)} [validate] custom validator; return true or an error string
 * @property {string} [description] human readable description, used by generateExample()
 */

/**
 * Validates `source` (defaults to process.env) against `schema`.
 * Collects EVERY problem before failing, instead of stopping at the first one.
 *
 * @param {Record<string, FieldSchema>} schema
 * @param {Object} [options]
 * @param {Record<string, string|undefined>} [options.source=process.env]
 * @returns {Record<string, *>} a plain object with cleaned/casted values
 * @throws {EnvValidationError} if any variable is missing or invalid
 */
function validateEnv(schema, options = {}) {
  const source = options.source || process.env;
  const issues = [];
  const result = {};

  for (const [key, rules = {}] of Object.entries(schema)) {
    const type = rules.type || 'string';
    const raw = source[key];
    const isMissing = raw === undefined || raw === '';

    if (isMissing) {
      if (rules.default !== undefined) {
        result[key] = rules.default;
        continue;
      }
      if (rules.required === false) {
        result[key] = undefined;
        continue;
      }
      issues.push({ key, message: 'is required but missing' });
      continue;
    }

    const caster = casters[type];
    if (!caster) {
      issues.push({ key, message: `has unknown type "${type}"` });
      continue;
    }

    const casted = caster(raw);
    if (!casted.ok) {
      issues.push({ key, message: casted.message });
      continue;
    }

    let value = casted.value;

    if (rules.pattern && !rules.pattern.test(raw)) {
      issues.push({ key, message: `does not match required pattern ${rules.pattern}` });
      continue;
    }

    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        issues.push({ key, message: `must be at least ${rules.minLength} characters long` });
        continue;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        issues.push({ key, message: `must be at most ${rules.maxLength} characters long` });
        continue;
      }
    }

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        issues.push({ key, message: `must be >= ${rules.min}` });
        continue;
      }
      if (rules.max !== undefined && value > rules.max) {
        issues.push({ key, message: `must be <= ${rules.max}` });
        continue;
      }
    }

    if (rules.enum && !rules.enum.includes(value)) {
      issues.push({ key, message: `must be one of [${rules.enum.join(', ')}], got "${value}"` });
      continue;
    }

    if (typeof rules.validate === 'function') {
      const outcome = rules.validate(value);
      if (outcome !== true) {
        issues.push({ key, message: typeof outcome === 'string' ? outcome : 'failed custom validation' });
        continue;
      }
    }

    result[key] = value;
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return result;
}

/**
 * Generates a `.env.example` file (or returns the string) from a schema,
 * so your repo's example file can never drift from what the code actually needs.
 *
 * @param {Record<string, FieldSchema>} schema
 * @param {Object} [options]
 * @param {string} [options.outputPath] if given, writes the file to disk
 * @returns {string} the generated file contents
 */
function generateExample(schema, options = {}) {
  const lines = [];
  for (const [key, rules = {}] of Object.entries(schema)) {
    if (rules.description) {
      lines.push(`# ${rules.description}`);
    }
    const type = rules.type || 'string';
    const meta = [`type: ${type}`];
    if (rules.required === false) meta.push('optional');
    if (rules.enum) meta.push(`one of: ${rules.enum.join(' | ')}`);
    lines.push(`# ${meta.join(', ')}`);

    const placeholder = rules.default !== undefined ? rules.default : '';
    lines.push(`${key}=${placeholder}`);
    lines.push('');
  }
  const contents = lines.join('\n').trim() + '\n';

  if (options.outputPath) {
    fs.writeFileSync(options.outputPath, contents, 'utf8');
  }

  return contents;
}

module.exports = { validateEnv, generateExample, EnvValidationError };
