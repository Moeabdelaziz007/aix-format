import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AIXErrorHandler } from '../core/error_handler.js';

describe('AIXErrorHandler Security Fix', () => {
  const errorHandler = new AIXErrorHandler();

  test('generateRequestId should return a unique string', () => {
    const id1 = errorHandler.generateRequestId();
    const id2 = errorHandler.generateRequestId();

    assert.strictEqual(typeof id1, 'string');
    assert.ok(id1.length > 0);
    assert.notStrictEqual(id1, id2);
  });

  test('calculateBackoff should include jitter', () => {
    const attempt = 1;
    const strategy = 'constant';
    const initial = 1000;
    const max = 32000;
    const jitter = true;

    const delay = errorHandler.calculateBackoff(attempt, strategy, initial, max, jitter);

    // With jitter, it should be between 500 and 1000
    assert.ok(delay >= 500 && delay <= 1000);
  });
});
