import type { Response } from 'express';

export interface ApiErrorItem {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiErrorItem[];
}

export function sendSuccess<T>(res: Response, message: string, data?: T): void {
  const payload: ApiResponse<T> = { success: true, message };
  if (data !== undefined) {
    payload.data = data;
  }
  res.status(200).json(payload);
}

export function sendCreated<T>(res: Response, message: string, data?: T): void {
  const payload: ApiResponse<T> = { success: true, message };
  if (data !== undefined) {
    payload.data = data;
  }
  res.status(201).json(payload);
}

export function sendBadRequest(res: Response, message: string, errors?: ApiErrorItem[]): void {
  const payload: ApiResponse<never> = { success: false, message };
  if (errors !== undefined) {
    payload.errors = errors;
  }
  res.status(400).json(payload);
}

export function sendUnauthorized(res: Response, message = 'Authentication required'): void {
  res.status(401).json({ success: false, message });
}

export function sendForbidden(res: Response, message = 'Access denied'): void {
  res.status(403).json({ success: false, message });
}

export function sendNotFound(res: Response, message = 'Resource not found'): void {
  res.status(404).json({ success: false, message });
}
