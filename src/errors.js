'use strict';

/**
 * Thrown when one or more environment variables fail validation.
 * Unlike a plain Error, it carries the FULL list of problems found
 * (not just the first one), so you can fix everything in one pass.
 */
class EnvValidationError extends Error {
  /**
   * @param {Array<{key: string, message: string}>} issues
   */
  constructor(issues) {
    const summary = EnvValidationError.formatReport(issues);
    super(summary);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }

  /**
   * Builds the human-readable, multi-line diagnostic report.
   * @param {Array<{key: string, message: string}>} issues
   * @returns {string}
   */
  static formatReport(issues) {
    const lines = [
      '',
      `env-doctor found ${issues.length} problem${issues.length === 1 ? '' : 's'} with your environment variables:`,
      '',
    ];
    for (const issue of issues) {
      lines.push(`  ✖ ${issue.key}: ${issue.message}`);
    }
    lines.push('');
    return lines.join('\n');
  }
}

module.exports = { EnvValidationError };
