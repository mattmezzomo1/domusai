import { Request, Response } from 'express';
import authService from './auth.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { LoginDTO, CreateUserDTO, UpdateUserDTO, ResetPasswordDTO } from '../../types';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateUserDTO = req.body;
    const result = await authService.register(data);
    res.status(201).json(result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const data: LoginDTO = req.body;
    const result = await authService.login(data);
    res.json(result);
  });

  logout = asyncHandler(async (_req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you could implement token blacklisting here
    res.json({ message: 'Logged out successfully' });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await authService.me(userId);
    res.json(user);
  });

  updateMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const data: UpdateUserDTO = req.body;
    const user = await authService.updateMe(userId, data);
    res.json(user);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const data: ResetPasswordDTO = req.body;
    const result = await authService.resetPassword(data);
    res.json(result);
  });

  isAuthenticated = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAuth = await authService.isAuthenticated(userId);
    res.json({ authenticated: isAuth });
  });
}

export default new AuthController();

