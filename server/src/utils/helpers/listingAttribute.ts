import type { Prisma } from '../../generated/client.js';

export function attributeValueToJson(value: string | number | boolean | string[]): Prisma.InputJsonValue {
  return value;
}
