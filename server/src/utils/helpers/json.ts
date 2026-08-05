export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseJsonStringArray(value: unknown): string[] {
  if (isStringArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (isStringArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }
  return [];
}
