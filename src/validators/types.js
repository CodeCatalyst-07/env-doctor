'use strict';

const URL_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\/[^\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Each caster takes the raw string value and returns either
 * { ok: true, value: <casted value> } or { ok: false, message: string }
 */
const casters = {
  string(raw) {
    return { ok: true, value: raw };
  },

  number(raw) {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      return { ok: false, message: `expected a number, got "${raw}"` };
    }
    return { ok: true, value: n };
  },

  boolean(raw) {
    const v = raw.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(v)) return { ok: true, value: true };
    if (['false', '0', 'no', 'off'].includes(v)) return { ok: true, value: false };
    return { ok: false, message: `expected a boolean (true/false), got "${raw}"` };
  },

  port(raw) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 65535) {
      return { ok: false, message: `expected a valid port number (1-65535), got "${raw}"` };
    }
    return { ok: true, value: n };
  },

  url(raw) {
    if (!URL_REGEX.test(raw)) {
      return { ok: false, message: `expected a valid URL, got "${raw}"` };
    }
    return { ok: true, value: raw };
  },

  email(raw) {
    if (!EMAIL_REGEX.test(raw)) {
      return { ok: false, message: `expected a valid email address, got "${raw}"` };
    }
    return { ok: true, value: raw };
  },

  json(raw) {
    try {
      return { ok: true, value: JSON.parse(raw) };
    } catch (err) {
      return { ok: false, message: `expected valid JSON, got "${raw}" (${err.message})` };
    }
  },
};

module.exports = { casters };
