import { Request, Response } from 'express';
import customersService from './customers.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { CreateCustomerDTO, UpdateCustomerDTO } from '../../types';

export class CustomersController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const ownerEmail = req.user!.email;
    const data: CreateCustomerDTO = req.body;
    const customer = await customersService.create(ownerEmail, data);
    res.status(201).json(customer);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const ownerEmail = req.user!.email;
    const filters = req.query;
    const customers = await customersService.findAll(ownerEmail, filters);
    res.json(customers);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const customer = await customersService.findById(id, ownerEmail);
    res.json(customer);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const data: UpdateCustomerDTO = req.body;
    const customer = await customersService.update(id, ownerEmail, data);
    res.json(customer);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const ownerEmail = req.user!.email;
    const result = await customersService.delete(id, ownerEmail);
    res.json(result);
  });

  // Public endpoint to find customer by phone and restaurant
  findByPhoneAndRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const phone = req.params.phone as string;
    const restaurantId = req.params.restaurantId as string;
    const customer = await customersService.findByPhoneAndRestaurant(phone, restaurantId);
    res.json(customer);
  });

  // Public endpoint to create customer (for public booking)
  createPublic = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateCustomerDTO = req.body;
    const customer = await customersService.createPublic(data);
    res.status(201).json(customer);
  });

  // Public endpoint to update customer (for public booking)
  updatePublic = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data: UpdateCustomerDTO = req.body;
    const customer = await customersService.updatePublic(id, data);
    res.json(customer);
  });
}

export default new CustomersController();

