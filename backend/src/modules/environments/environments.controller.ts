import { Request, Response } from 'express';
import environmentsService from './environments.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class EnvironmentsController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const environment = await environmentsService.create(req.user!.email, req.body);
    res.status(201).json(environment);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const environments = await environmentsService.findAll(req.user!.email, req.query);
    res.json(environments);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const environment = await environmentsService.findById(id, req.user!.email);
    res.json(environment);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const environment = await environmentsService.update(id, req.user!.email, req.body);
    res.json(environment);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await environmentsService.delete(id, req.user!.email);
    res.json(result);
  });
}

export default new EnvironmentsController();

