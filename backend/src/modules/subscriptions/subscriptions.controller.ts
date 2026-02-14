import { Request, Response } from 'express';
import subscriptionsService from './subscriptions.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class SubscriptionsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const subscription = await subscriptionsService.create(req.body);
    res.status(201).json(subscription);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const subscriptions = await subscriptionsService.findAll(req.query);
    res.json(subscriptions);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const subscription = await subscriptionsService.findById(id);
    res.json(subscription);
  });

  findByUserEmail = asyncHandler(async (req: Request, res: Response) => {
    const email = req.params.email as string;
    const subscription = await subscriptionsService.findByUserEmail(email);
    res.json(subscription);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const subscription = await subscriptionsService.update(id, req.body);
    res.json(subscription);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await subscriptionsService.delete(id);
    res.json(result);
  });
}

export default new SubscriptionsController();

