import 'dotenv/config';
import prisma from '../config/prisma.js';
import { seedUsers } from '../utils/seed/dev/users/users.seed.js';
import { seedListings } from '../utils/seed/dev/listings/listings.seed.js';
import { createLogger } from '../utils/helpers/logger.js';

const logger = createLogger('Seed');

async function main(): Promise<void> {
  logger.info('Starting idempotent seed...');

  const users = await seedUsers();
  logger.info(`Seeded users: seeker=${users.seekerId}, lister=${users.listerId}, admin=${users.adminId}`);

  await seedListings(users.listerId);
  logger.info('Seeded 20 properties with attributes and availability slots');

  logger.info('Seed complete');
}

main()
  .catch((error: unknown) => {
    logger.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
