export type FieldType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'port' | 'json';

export interface FieldSchema {
  type?: FieldType;
  required?: boolean;
  default?: any;
  enum?: Array<string | number>;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: any) => true | string;
  description?: string;
}

export interface ValidateOptions {
  source?: Record<string, string | undefined>;
}

export interface GenerateExampleOptions {
  outputPath?: string;
}

export interface EnvIssue {
  key: string;
  message: string;
}

export class EnvValidationError extends Error {
  issues: EnvIssue[];
}

export function validateEnv(
  schema: Record<string, FieldSchema>,
  options?: ValidateOptions
): Record<string, any>;

export function generateExample(
  schema: Record<string, FieldSchema>,
  options?: GenerateExampleOptions
): string;
