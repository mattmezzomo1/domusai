import { Request, Response } from 'express';
import paymentsService from './payments.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class PaymentsController {
  createCheckout = asyncHandler(async (req: Request, res: Response) => {
    const userEmail = req.user!.email;
    const { price_id } = req.body;
    const result = await paymentsService.createCheckout(userEmail, price_id);
    res.json(result);
  });

  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.body; // This should be raw buffer from express.raw()

    const result = await paymentsService.handleStripeWebhook(signature, rawBody);
    res.json(result);
  });
}

export default new PaymentsController();

