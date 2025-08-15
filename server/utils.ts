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