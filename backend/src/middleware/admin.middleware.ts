import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }

  next();
};

