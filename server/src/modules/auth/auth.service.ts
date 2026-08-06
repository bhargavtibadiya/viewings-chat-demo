import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { signToken } from '../../middleware/auth.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import type { LoginDtoType } from './dto/auth.dto.js';
import type { LoginResponse, SafeUser } from './types/auth.types.js';
import type { User } from '../../generated/client.js';

export class AuthService {
  private toSafeUser(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Authenticates a user and issues their access token.
   *
   * @param dto - Validated login credentials
   * @returns The access token and safe user profile
   * @throws {ServiceError} if the credentials are invalid
   */
  async login(dto: LoginDtoType): Promise<LoginResponse> {
    const user = await prisma.user.findFirst({
      where: { email: dto.email, ...notDeleted() },
    });

    if (!user) {
      throw createServiceError(401, 'Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw createServiceError(401, 'Invalid email or password');
    }

    const safeUser = this.toSafeUser(user);
    const token = signToken(safeUser);

    return { token, user: safeUser };
  }

  /**
   * Retrieves a user's safe profile.
   *
   * @param userId - ID of the user to retrieve
   * @returns The safe user profile
   * @throws {ServiceError} if the user does not exist
   */
  async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findFirst({
      where: { id: userId, ...notDeleted() },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      throw createServiceError(404, 'User not found');
    }

    return this.toSafeUser(user);
  }

  /**
   * Hashes a password using the application's configured work factor.
   *
   * @param password - Plain-text password to hash
   * @returns The password hash
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Returns the configured demo account password.
   *
   * @returns The demo password
   */
  getDemoPassword(): string {
    return env.DEMO_PASSWORD;
  }
}

export const authService = new AuthService();
