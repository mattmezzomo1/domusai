import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

/**
 * Validates the Rhizo webhook bearer secret.
 * Expects: Authorization: Bearer <RHIZO_WEBHOOK_SECRET>
 */
export const rhizoAuth = (req: Request, _res: Response, next: NextFunction) => {
  const secret = process.env.RHIZO_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[rhizo] RHIZO_WEBHOOK_SECRET não configurado no ambiente');
    return next(new AppError('Webhook not configured', 500));
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token || token !== secret) {
    return next(new AppError('Unauthorized', 401));
  }

  return next();
};
