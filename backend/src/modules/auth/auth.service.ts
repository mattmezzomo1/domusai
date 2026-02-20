import prisma from '../../utils/db';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateToken } from '../../utils/jwt.util';
import { AppError } from '../../middleware/error.middleware';
import {
  LoginDTO,
  LoginResponseDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  ResetPasswordDTO,
} from '../../types';

export class AuthService {
  async register(data: CreateUserDTO): Promise<LoginResponseDTO> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        full_name: data.full_name,
        role: data.role || 'USER',
        avatar_url: data.avatar_url,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as UserResponseDTO,
      token,
    };
  }

  async login(data: LoginDTO): Promise<LoginResponseDTO> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as UserResponseDTO,
      token,
    };
  }

  async me(userId: string): Promise<UserResponseDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDTO;
  }

  async updateMe(userId: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const updateData: any = {};

    if (data.full_name) updateData.full_name = data.full_name;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    updateData.updated_date = new Date();

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDTO;
  }

  async resetPassword(data: ResetPasswordDTO): Promise<{ message: string }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // In a real application, you would:
    // 1. Generate a reset token
    // 2. Store it in the database with expiration
    // 3. Send email with reset link
    // For now, we'll just update the password directly if reset_token is provided

    if (data.reset_token) {
      // Verify reset token (simplified version)
      const hashedPassword = await hashPassword(data.new_password);

      await prisma.user.update({
        where: { email: data.email },
        data: {
          password: hashedPassword,
          updated_date: new Date(),
        },
      });

      return { message: 'Password reset successfully' };
    }

    // TODO: Implement email sending with reset token
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async isAuthenticated(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return !!user;
  }
}

export default new AuthService();

