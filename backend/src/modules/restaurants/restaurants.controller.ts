import { Request, Response } from 'express';
import restaurantsService from './restaurants.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { CreateRestaurantDTO, UpdateRestaurantDTO } from '../../types';

export class RestaurantsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const ownerEmail = req.user!.email;
    const data: CreateRestaurantDTO = req.body;
    const restaurant = await restaurantsService.create(ownerEmail, data);
    res.status(201).json(restaurant);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const ownerEmail = req.user!.email;
    const filters = req.query;
    const restaurants = await restaurantsService.findAll(ownerEmail, filters);
    res.json(restaurants);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const restaurant = await restaurantsService.findById(id, ownerEmail);
    res.json(restaurant);
  });

  findBySlug = asyncHandler(async (req: Request, res: Response) => {
    const slug = req.params.slug as string;
    const restaurant = await restaurantsService.findBySlug(slug);
    res.json(restaurant);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const data: UpdateRestaurantDTO = req.body;
    console.log('🔍 [Restaurant Controller] Update request:', { id, data });
    const restaurant = await restaurantsService.update(id, ownerEmail, data);
    console.log('✅ [Restaurant Controller] Update successful:', restaurant);
    res.json(restaurant);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const result = await restaurantsService.delete(id, ownerEmail);
    res.json(result);
  });
}

export default new RestaurantsController();

