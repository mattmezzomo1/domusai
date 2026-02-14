import { Request, Response } from 'express';
import tablesService from './tables.service';
import { asyncHandler } from '../../middleware/error.middleware';

export class TablesController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const table = await tablesService.create(req.user!.email, req.body);
    res.status(201).json(table);
  });

  findAll = asyncHandler(async (req: Request, res: Response) => {
    const tables = await tablesService.findAll(req.user!.email, req.query);
    res.json(tables);
  });

  findById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const table = await tablesService.findById(id, req.user!.email);
    res.json(table);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const table = await tablesService.update(id, req.user!.email, req.body);
    res.json(table);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await tablesService.delete(id, req.user!.email);
    res.json(result);
  });
}

export default new TablesController();

