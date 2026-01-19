/**
 * Recursively converts BigInt values to Numbers for JSON serialization
 * JSON.stringify cannot handle BigInt natively, so we need to convert them
 * Also handles Date objects and Prisma Decimal types
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Convert BigInt to Number
  if (typeof obj === 'bigint') {
    return Number(obj) as unknown as T;
  }

  // Handle Date objects - leave them as-is (JSON.stringify handles them)
  if (obj instanceof Date) {
    return obj as unknown as T;
  }

  // Handle Prisma Decimal objects (they have a toNumber method and might have {s, e, d} structure)
  if (typeof obj === 'object' && obj !== null && 'toNumber' in obj && typeof (obj as any).toNumber === 'function') {
    try {
      return (obj as any).toNumber() as unknown as T;
    } catch {
      // If toNumber fails, try toString and parse
      try {
        return Number((obj as any).toString()) as unknown as T;
      } catch {
        // Fallback: return as 0
        return 0 as unknown as T;
      }
    }
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as unknown as T;
  }

  // Handle plain objects (but not Date, which is already handled above)
  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt((obj as any)[key]);
      }
    }
    return serialized as T;
  }

  // Return primitives and other objects (like Date, RegExp, etc.) as-is
  return obj;
}
