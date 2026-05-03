import { z } from 'zod';

// Agent form validation schema
export const agentFormSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9-_\s]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  
  role: z.string()
    .min(3, 'Role must be at least 3 characters')
    .max(100, 'Role must be less than 100 characters'),
  
  tone: z.enum(['professional', 'casual', 'friendly', 'technical', 'creative'], {
    errorMap: () => ({ message: 'Please select a valid tone' }),
  }),
  
  instructions: z.string()
    .min(20, 'Instructions must be at least 20 characters')
    .max(2000, 'Instructions must be less than 2000 characters')
    .optional(),
});

export type AgentFormData = z.infer<typeof agentFormSchema>;

// Skill form validation schema
export const skillFormSchema = z.object({
  name: z.string()
    .min(3, 'Skill name must be at least 3 characters')
    .max(50, 'Skill name must be less than 50 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(300, 'Description must be less than 300 characters'),
  
  type: z.enum(['web_search', 'code_execution', 'sentiment_analysis', 'data_processing', 'api_call'], {
    errorMap: () => ({ message: 'Please select a valid skill type' }),
  }),
  
  enabled: z.boolean().default(true),
  
  config: z.record(z.unknown()).optional(),
});

export type SkillFormData = z.infer<typeof skillFormSchema>;

// KYC form validation schema
export const kycFormSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  
  email: z.string()
    .email('Please enter a valid email address'),
  
  country: z.string()
    .min(2, 'Please select a country')
    .max(2, 'Invalid country code'),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 120;
    }, 'You must be at least 18 years old'),
  
  documentType: z.enum(['passport', 'national_id', 'drivers_license'], {
    errorMap: () => ({ message: 'Please select a valid document type' }),
  }),
  
  documentNumber: z.string()
    .min(5, 'Document number must be at least 5 characters')
    .max(50, 'Document number must be less than 50 characters'),
});

export type KYCFormData = z.infer<typeof kycFormSchema>;

// Deployment form validation schema
export const deploymentFormSchema = z.object({
  agentId: z.string()
    .min(1, 'Agent ID is required'),
  
  environment: z.enum(['development', 'staging', 'production'], {
    errorMap: () => ({ message: 'Please select a valid environment' }),
  }),
  
  region: z.enum(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'], {
    errorMap: () => ({ message: 'Please select a valid region' }),
  }).optional(),
  
  autoScale: z.boolean().default(false),
  
  maxInstances: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 instance')
    .max(10, 'Cannot exceed 10 instances')
    .optional(),
});

export type DeploymentFormData = z.infer<typeof deploymentFormSchema>;

// Helper function to get field error message
export function getFieldError(
  errors: Record<string, { message?: string }>,
  fieldName: string
): string | undefined {
  return errors[fieldName]?.message;
}

// Helper function to check if field has error
export function hasFieldError(
  errors: Record<string, unknown>,
  fieldName: string
): boolean {
  return fieldName in errors;
}

// Made with Moe Abdelaziz
