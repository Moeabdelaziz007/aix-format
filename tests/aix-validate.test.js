import test from 'node:test';
import assert from 'node:assert';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '..', 'bin', 'aix-validate.js');

test('aix-validate CLI', async (t) => {

  await t.test('shows help when no arguments are provided', async () => {
    const { stdout } = await execAsync(`node ${cliPath}`);
    assert.match(stdout, /Usage:/);
    assert.match(stdout, /Options:/);
  });

  await t.test('shows help when --help is provided', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);
    assert.match(stdout, /Usage:/);
  });

  await t.test('fails when no file is specified but other args are', async () => {
    try {
      await execAsync(`node ${cliPath} --verbose`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.strictEqual(error.code, 2);
      assert.match(error.stderr, /No file specified/);
    }
  });

  await t.test('fails when file does not exist', async () => {
    try {
      await execAsync(`node ${cliPath} non-existent-file.aix`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.strictEqual(error.code, 2);
      assert.match(error.stderr, /File not found/);
    }
  });

  await t.test('fails on invalid AIX file format', async () => {
    const invalidFile = join(__dirname, 'temp-invalid.aix');
    writeFileSync(invalidFile, JSON.stringify({ invalid: "data" }));

    try {
      await execAsync(`node ${cliPath} ${invalidFile}`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.strictEqual(error.code, 1);
      assert.match(error.stdout, /Invalid AIX file/);
    } finally {
      if (existsSync(invalidFile)) unlinkSync(invalidFile);
    }
  });

  // Create a minimal valid AIX file for testing
  const validFile = join(__dirname, 'temp-valid.aix');
  const minimalValidAix = {
    meta: {
      version: '2.0.0',
      id: 'did:axiom:axiomid.app:12345678',
      name: 'Test Agent',
      created: '2025-01-01T00:00:00Z',
      author: 'Tester'
    },
    persona: {
      role: 'Test Role',
      instructions: 'Do test things'
    },
    identity_layer: {
      id: 'did:axiom:axiomid.app:12345678',
      authority: 'axiomid.app',
      issuedAt: '2025-01-01T00:00:00Z'
    },
    security: {
      checksum: {
        algorithm: 'sha256',
        value: 'placeholder'
      }
    },
    kyc_proof: {
      status: 'verified'
    }
  };

  await t.test('validates an existing valid AIX file', async () => {
    writeFileSync(validFile, JSON.stringify(minimalValidAix));
    try {
      const { stdout, stderr } = await execAsync(`node ${cliPath} ${validFile}`);
      assert.match(stdout, /Valid AIX file/);
      assert.strictEqual(stderr, '');
    } finally {
      if (existsSync(validFile)) unlinkSync(validFile);
    }
  });

  await t.test('validates an existing valid AIX file in JSON format', async () => {
    writeFileSync(validFile, JSON.stringify(minimalValidAix));
    try {
      const { stdout } = await execAsync(`node ${cliPath} ${validFile} --json`);
      const result = JSON.parse(stdout);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.file, validFile);
      assert.ok(result.agent);
      assert.strictEqual(result.agent.name, 'Test Agent');
    } finally {
      if (existsSync(validFile)) unlinkSync(validFile);
    }
  });

  await t.test('fails strict KYC on invalid file with --strict-kyc', async () => {
    const kycInvalidFile = join(__dirname, 'temp-kyc-invalid.aix');
    const invalidKycAix = {
      meta: {
        version: '1.0.0', // Fails strict KYC version check
        id: 'did:axiom:axiomid.app:12345678',
        name: 'Test Agent',
        created: '2025-01-01T00:00:00Z',
        author: 'Tester'
      },
      persona: {
        role: 'Test Role',
        instructions: 'Do test things'
      },
      identity_layer: {
        id: 'did:axiom:axiomid.app:12345678',
        authority: 'axiomid.app',
        issuedAt: '2025-01-01T00:00:00Z'
      },
      security: {
        checksum: {
          algorithm: 'sha256',
          value: 'placeholder'
        }
      }
    };
    writeFileSync(kycInvalidFile, JSON.stringify(invalidKycAix));

    try {
      await execAsync(`node ${cliPath} ${kycInvalidFile} --strict-kyc`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.strictEqual(error.code, 1);
      assert.match(error.stdout, /Strict validation failed/);
    } finally {
      if (existsSync(kycInvalidFile)) unlinkSync(kycInvalidFile);
    }
  });

  await t.test('succeeds strict KYC with valid file with --strict-kyc', async () => {
    const kycValidFile = join(__dirname, 'temp-kyc-valid.aix');
    writeFileSync(kycValidFile, JSON.stringify(minimalValidAix));

    try {
      const { stdout } = await execAsync(`node ${cliPath} ${kycValidFile} --strict-kyc`);
      assert.match(stdout, /Valid AIX file/);
    } finally {
      if (existsSync(kycValidFile)) unlinkSync(kycValidFile);
    }
  });

  await t.test('fails checksum with --security flag on mismatched checksum', async () => {
    const secInvalidFile = join(__dirname, 'temp-sec-invalid.aix');
    writeFileSync(secInvalidFile, JSON.stringify(minimalValidAix));

    try {
      await execAsync(`node ${cliPath} ${secInvalidFile} --security`);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.strictEqual(error.code, 1);
      assert.match(error.stdout, /Strict validation failed/);
      assert.match(error.stdout, /CHECKSUM_MISMATCH/);
    } finally {
      if (existsSync(secInvalidFile)) unlinkSync(secInvalidFile);
    }
  });

  await t.test('verbose mode prints detailed info', async () => {
    const verboseValidFile = join(__dirname, 'temp-verbose.aix');
    writeFileSync(verboseValidFile, JSON.stringify(minimalValidAix));

    try {
      const { stdout } = await execAsync(`node ${cliPath} ${verboseValidFile} --verbose`);
      assert.match(stdout, /Valid AIX file/);
      assert.match(stdout, /Created:/);
      assert.match(stdout, /Capabilities:/);
      assert.match(stdout, /Security:/);
    } finally {
      if (existsSync(verboseValidFile)) unlinkSync(verboseValidFile);
    }
  });

});
