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

  findByPhone = asyncHandler(async (req: Request, res: Response) => {
    const phone = req.params.phone as string;
    const restaurantId = req.query.restaurant_id as string;

    if (!restaurantId) {
      res.status(400).json({ error: 'restaurant_id is required' });
      return;
    }

    const reservations = await reservationsService.findByPhone(phone, restaurantId);
    res.json(reservations);
  });

  // Public endpoint to find reservations by restaurant
  findByRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const restaurantId = req.params.restaurantId as string;
    const filters = req.query;
    const reservations = await reservationsService.findByRestaurant(restaurantId, filters);
    res.json(reservations);
  });

  // Public endpoint to create reservation (for public booking)
  createPublic = asyncHandler(async (req: Request, res: Response) => {
    // Extract real client IP (respect reverse-proxy headers)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      undefined;

    const userAgent = req.headers['user-agent'] || undefined;

    const reservation = await reservationsService.createPublic(req.body, {
      clientIp,
      userAgent,
    });
    res.status(201).json(reservation);
  });

  updatePublic = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const reservation = await reservationsService.updatePublic(id, req.body);
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

