import { Request, Response } from 'express';
import adminService from './admin.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class AdminController {
  createFreetrialAccount = asyncHandler(async (req: Request, res: Response) => {
    const { email, full_name } = req.body;
    const result = await adminService.createFreetrialAccount(email, full_name);
    res.status(201).json(result);
  });

  grantFreePlan = asyncHandler(async (req: Request, res: Response) => {
    const { user_email } = req.body;
    const result = await adminService.grantFreePlan(user_email);
    res.json(result);
  });

  revokeAccess = asyncHandler(async (req: Request, res: Response) => {
    const { user_email } = req.body;
    const result = await adminService.revokeAccess(user_email);
    res.json(result);
  });

  upgradeToPaid = asyncHandler(async (req: Request, res: Response) => {
    const { user_email, stripe_customer_id, stripe_subscription_id } = req.body;
    const result = await adminService.upgradeToPaid(user_email, stripe_customer_id, stripe_subscription_id);
    res.json(result);
  });

  createDiscountCode = asyncHandler(async (req: Request, res: Response) => {
    const { code, discount_percent } = req.body;
    const result = await adminService.createDiscountCode(code, discount_percent);
    res.json(result);
  });
}

export default new AdminController();

