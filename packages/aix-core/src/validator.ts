import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  valid: boolean;
  status: 200 | 422;
  errors?: ValidationError[];
}

export class AIXValidator {
  private ajv: Ajv;
  private validator: any;

  constructor(schemaPath: string) {
    this.ajv = new Ajv({ allErrors: true, jsonPointers: true });
    addFormats(this.ajv);
    addErrors(this.ajv);

    try {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      this.validator = this.ajv.compile(schema);
    } catch (error) {
      console.error(`[AIXValidator] Critical error loading schema at ${schemaPath}:`, error);
      throw error;
    }
  }

  public validate(envelope: any): ValidationResult {
    const valid = this.validator(envelope);
    if (!valid) {
      return {
        valid: false,
        status: 422,
        errors: this.formatErrors(this.validator.errors || []),
      };
    }
    return { valid: true, status: 200 };
  }

  private formatErrors(errors: ErrorObject[]): ValidationError[] {
    return errors.map((err) => ({
      path: err.instancePath || 'root',
      message: err.message || 'Validation failed',
      code: err.keyword,
    }));
  }
}
