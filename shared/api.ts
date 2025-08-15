/**
 * Shared API response types for consistent frontend-backend communication
 */

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { 
  ok: false; 
  error: string; 
  details?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
};
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/**
 * Type guards for API responses
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiOk<T> {
  return response.ok === true;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiErr {
  return response.ok === false;
}

/**
 * Helper function to handle API responses with proper error checking
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>
): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  throw new Error(response.error);
}