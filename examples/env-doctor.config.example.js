'use strict';

/**
 * Copy this to `env-doctor.config.js` at your project root, then run:
 *   npx env-doctor check
 *   npx env-doctor generate-example
 */
module.exports = {
  PORT: { type: 'port', default: 3000, description: 'Port the server listens on' },
  DATABASE_URL: { type: 'url', description: 'Postgres connection string' },
  NODE_ENV: {
    type: 'string',
    enum: ['development', 'production', 'test'],
    default: 'development',
  },
  ADMIN_EMAIL: { type: 'email', required: false, description: 'Used for error alert emails' },
};
