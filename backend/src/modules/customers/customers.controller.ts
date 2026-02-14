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
}

export default new CustomersController();

