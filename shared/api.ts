// API Response Types and Utilities for PassPilot

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is { ok: true; data: T } {
  return response.ok === true && response.data !== undefined;
}

export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  
  throw new Error(response.error || 'API request failed');
}

// Helper function to create successful API responses
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return { ok: true, data };
}

// Helper function to create error API responses
export function createErrorResponse(error: string): ApiResponse<never> {
  return { ok: false, error };
}