import { z } from 'zod';

const PiEnvSchema = z.object({
  PI_API_KEY: z.string({
    required_error: "PI_API_KEY is required",
    invalid_type_error: "PI_API_KEY must be a string",
  }).min(1, "PI_API_KEY is required"),
  PI_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
});

export type PiEnv = z.infer<typeof PiEnvSchema>;

export function getPiEnv(): PiEnv {
  const env = {
    PI_API_KEY: process.env.PI_API_KEY,
    PI_ENVIRONMENT: process.env.PI_ENVIRONMENT || 'sandbox',
  };

  const result = PiEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Pi Environment Error: ${result.error.issues.map(i => i.message).join(', ')}`);
  }

  return result.data;
}
