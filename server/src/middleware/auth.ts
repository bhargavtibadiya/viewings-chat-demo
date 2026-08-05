import type { Request, Response, NextFunction } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { sendUnauthorized, sendForbidden } from '../utils/helpers/response.js';
import { notDeleted } from '../utils/helpers/softDelete.js';
import type { UserRole } from '#generated/client.js';
import type { AuthenticatedUser } from '../types/express.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

function isJwtPayload(value: jwt.JwtPayload | string): value is JwtPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.sub === 'string' &&
    typeof value.email === 'string' &&
    typeof value.role === 'string'
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res);
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === 'string' || !isJwtPayload(decoded)) {
      sendUnauthorized(res, 'Invalid token');
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, ...notDeleted() },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    req.user = authenticatedUser;
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res);
      return;
    }
    next();
  };
}

function jwtExpiresInSeconds(): number {
  const dayMatch = /^(\d+)d$/.exec(env.JWT_EXPIRES_IN);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10) * 86400;
  }

  const hourMatch = /^(\d+)h$/.exec(env.JWT_EXPIRES_IN);
  if (hourMatch) {
    return parseInt(hourMatch[1], 10) * 3600;
  }

  const numeric = parseInt(env.JWT_EXPIRES_IN, 10);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return 604800;
}

export function signToken(user: AuthenticatedUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const signOptions: SignOptions = {
    expiresIn: jwtExpiresInSeconds(),
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}
