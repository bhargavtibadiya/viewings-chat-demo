import { PrismaClient } from '../generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Creates the Prisma client configured for the application's database connection.
 *
 * @returns A configured Prisma client
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// [PERF] reuse the client during development hot reloads to avoid exhausting database connections.
export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
