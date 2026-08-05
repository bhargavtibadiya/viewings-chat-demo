export class ServiceError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

export function createServiceError(statusCode: number, message: string): ServiceError {
  return new ServiceError(statusCode, message);
}
