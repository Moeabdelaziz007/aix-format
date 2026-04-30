export type FieldError = { field: string; message: string; severity: 'error' | 'warn' };

export function validateBuilderField(
  field: string,
  value: any
): FieldError | null {
  switch (field) {
    case 'name':
      if (!value) return { field, message: 'Agent name is required', severity: 'error' };
      if (value.length < 3) return { field, message: 'Name must be ≥ 3 characters', severity: 'error' };
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) return { field, message: 'Only letters, numbers, spaces, hyphens', severity: 'error' };
      return null;
    case 'version':
      if (!value) return { field, message: 'Version is required', severity: 'error' };
      if (!/^\d+\.\d+\.\d+$/.test(value)) return { field, message: 'Must follow semver: 1.0.0', severity: 'error' };
      return null;
    case 'author':
      if (!value) return { field, message: 'Author required for AIX compliance', severity: 'error' };
      return null;
    case 'description':
      if (!value) return { field, message: 'Description is required', severity: 'error' };
      if (value.length < 20) return { field, message: 'Description too short — be specific', severity: 'warn' };
      return null;
    case 'role':
      if (!value) return { field, message: 'Role is required', severity: 'error' };
      return null;
    case 'instructions':
      if (!value) return { field, message: 'Instructions are required', severity: 'error' };
      return null;
    default:
      return null;
  }
}
