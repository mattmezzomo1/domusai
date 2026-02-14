import { Request, Response } from 'express';
import usersService from './users.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { CreateUserDTO } from '../../types';

export class UsersController {
  inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateUserDTO = req.body;
    const result = await usersService.inviteUser(data);
    res.status(201).json(result);
  });

  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      role: req.query.role as string | undefined,
      email: req.query.email as string | undefined,
    };
    const users = await usersService.listUsers(filters);
    res.json(users);
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await usersService.getUserById(id);
    res.json(user);
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await usersService.deleteUser(id);
    res.json(result);
  });
}

export default new UsersController();

