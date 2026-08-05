import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-5.6-luna'),
  OPENAI_TIMEOUT_MS: z.string().default('60000').transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()),
  APP_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  API_URL: z.string().url().default('http://localhost:3000'),
  DEMO_SEEKER_EMAIL: z.string().email().default('seeker@viewings.demo'),
  DEMO_LISTER_EMAIL: z.string().email().default('lister@viewings.demo'),
  DEMO_ADMIN_EMAIL: z.string().email().default('admin@viewings.demo'),
  DEMO_PASSWORD: z.string().min(8).default('DemoPass123!'),
  TZ: z.string().default('Pacific/Auckland'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
  }
  return result.data;
}

export const env = loadEnv();
