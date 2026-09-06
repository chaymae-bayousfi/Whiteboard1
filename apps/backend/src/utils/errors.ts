export interface AppError {
  statusCode?: number;
  message?: string;
}

export function getAppError(error: unknown, fallback: string): { statusCode: number; message: string } {
  if (typeof error === 'object' && error !== null) {
    const appError = error as AppError;
    return {
      statusCode: appError.statusCode ?? 500,
      message: appError.message ?? fallback,
    };
  }
  return { statusCode: 500, message: fallback };
}