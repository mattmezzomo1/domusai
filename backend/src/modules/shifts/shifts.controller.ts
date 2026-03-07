import { Request, Response } from 'express';
import shiftsService from './shifts.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class ShiftsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const shift = await shiftsService.create(req.user!.email, req.body);
    res.status(201).json(shift);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const shifts = await shiftsService.findAll(req.user!.email, req.query);
    res.json(shifts);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const shift = await shiftsService.findById(id, req.user!.email);
    res.json(shift);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const shift = await shiftsService.update(id, req.user!.email, req.body);
    res.json(shift);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await shiftsService.delete(id, req.user!.email);
    res.json(result);
  });

  // Public endpoint to get shifts by restaurant
  findByRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurantId = req.params.restaurantId as string;
    const shifts = await shiftsService.findByRestaurant(restaurantId, req.query);
    res.json(shifts);
  });
}

export default new ShiftsController();

