import type { UserRole } from '../../../../generated/client.js';
import bcrypt from 'bcryptjs';
import prisma from '../../../../config/prisma.js';
import { env } from '../../../../config/env.js';

export interface SeededUsers {
  seekerId: string;
  listerId: string;
  adminId: string;
}

export async function seedUsers(): Promise<SeededUsers> {
  const passwordHash = await bcrypt.hash(env.DEMO_PASSWORD, 12);

  const users: Array<{ email: string; name: string; role: UserRole }> = [
    { email: env.DEMO_SEEKER_EMAIL, name: 'John Seeker', role: 'SEEKER' },
    { email: env.DEMO_LISTER_EMAIL, name: 'Jason Lister', role: 'LISTER' },
    { email: env.DEMO_ADMIN_EMAIL, name: 'Demo Admin', role: 'DEMO_ADMIN' },
  ];

  const ids: Record<string, string> = {};

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        deletedAt: null,
      },
    });
    ids[user.role] = record.id;
  }

  return {
    seekerId: ids.SEEKER ?? '',
    listerId: ids.LISTER ?? '',
    adminId: ids.DEMO_ADMIN ?? '',
  };
}
