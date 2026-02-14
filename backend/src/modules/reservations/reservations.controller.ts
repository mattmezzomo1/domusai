import { Request, Response } from 'express';
import reservationsService from './reservations.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class ReservationsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const reservation = await reservationsService.create(req.user!.email, req.body);
    res.status(201).json(reservation);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const reservations = await reservationsService.findAll(req.user!.email, req.query);
    res.json(reservations);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reservation = await reservationsService.findById(id, req.user!.email);
    res.json(reservation);
  });

  findByCode = asyncHandler(async (req: Request, res: Response) => {
    const code = req.params.code as string;
    const reservation = await reservationsService.findByCode(code);
    res.json(reservation);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reservation = await reservationsService.update(id, req.user!.email, req.body);
    res.json(reservation);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await reservationsService.delete(id, req.user!.email);
    res.json(result);
  });
}

export default new ReservationsController();

