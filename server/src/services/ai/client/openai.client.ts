import OpenAI from 'openai';
import { env } from '../../../config/env.js';

// [NOTE] module-level singleton — one SDK client per process
let client: OpenAI | undefined;

/**
 * Returns a lazy-initialized OpenAI SDK client.
 *
 * @returns Configured OpenAI client instance
 * @throws {Error} if OPENAI_API_KEY is missing from env
 */
export function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      timeout: env.OPENAI_TIMEOUT_MS,
    });
  }

  return client;
}

/**
 * Returns the configured chat model id from env.
 *
 * @returns OpenAI model name string
 */
export function getOpenAIModel(): string {
  return env.OPENAI_MODEL;
}
