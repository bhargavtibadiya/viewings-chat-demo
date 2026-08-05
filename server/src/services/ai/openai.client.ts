import OpenAI from 'openai';
import { env } from '../../config/env.js';

let client: OpenAI | undefined;

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

export function getOpenAIModel(): string {
  return env.OPENAI_MODEL;
}
