import type { UserRole } from '../../../generated/client.js';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: SafeUser;
}

export interface AuthMeResponse {
  user: SafeUser;
}
