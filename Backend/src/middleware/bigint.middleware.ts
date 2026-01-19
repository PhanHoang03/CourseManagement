import { Request, Response, NextFunction } from 'express';
import { serializeBigInt } from '../utils/serializer';

/**
 * Middleware to handle BigInt serialization in JSON responses
 * Overrides res.json() to automatically convert BigInt values to Numbers
 */
export const bigIntSerializer = (req: Request, res: Response, next: NextFunction) => {
  // Store the original json method
  const originalJson = res.json.bind(res);

  // Override res.json to serialize BigInt values before sending
  res.json = function (body?: any) {
    if (body !== undefined && body !== null) {
      // Recursively convert BigInt to Number
      const serializedBody = serializeBigInt(body);
      return originalJson(serializedBody);
    }
    return originalJson(body);
  };

  next();
};
