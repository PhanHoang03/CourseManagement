import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: any; query?: any; params?: any };
      
      // Assign transformed values back to request
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) {
        // Merge transformed query values into existing query object
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        // Merge transformed params values into existing params object
        Object.assign(req.params, parsed.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return res.status(422).json({
          error: 'Validation Error',
          details: errors,
        });
      }
      next(error);
    }
  };
};
