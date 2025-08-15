/**
 * Utility functions for robust error handling and null safety
 */

/**
 * Throws immediately if condition is falsy. Useful for asserting assumptions.
 * @param condition - The condition to check
 * @param msg - Error message to throw if condition is falsy
 */
export function invariant(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

/**
 * Unwraps a potentially null/undefined value, throwing if it's null/undefined.
 * @param v - The value to unwrap
 * @param msg - Error message to throw if value is null/undefined
 * @returns The unwrapped value
 */
export function unwrap<T>(v: T | null | undefined, msg = "Unexpected null"): T {
  if (v == null) throw new Error(msg);
  return v;
}

/**
 * Safe number parsing with default fallback
 * @param value - Value to parse as number
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed number or default
 */
export function safeNumber(value: unknown, defaultValue: number): number {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safe string parsing with default fallback
 * @param value - Value to convert to string
 * @param defaultValue - Default value if value is null/undefined
 * @returns String value or default
 */
export function safeString(value: unknown, defaultValue = ""): string {
  return value == null ? defaultValue : String(value);
}

/**
 * API Response Types for consistent frontend communication
 */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

/**
 * Creates a successful API response
 * @param data - The data to return
 * @returns Consistent success response shape
 */
export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

/**
 * Creates an error API response
 * @param message - Error message
 * @param code - HTTP status code (default: 400)
 * @returns Consistent error response shape
 */
export function err(message: string, code = 400): ApiErr {
  return { ok: false, error: message };
}