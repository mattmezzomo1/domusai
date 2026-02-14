import prisma from '../../utils/db';
import { hashPassword, generateRandomPassword } from '../../utils/password.util';
import { AppError } from '../../middleware/error.middleware';
import { CreateUserDTO, UserResponseDTO } from '../../types';

export class UsersService {
  async inviteUser(data: CreateUserDTO): Promise<{ user: UserResponseDTO; temporaryPassword: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Generate temporary password if not provided
    const temporaryPassword = data.password || generateRandomPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        full_name: data.full_name,
        role: data.role || 'USER',
        avatar_url: data.avatar_url,
        updated_date: new Date(),
      },
    });

    // TODO: Send invitation email with temporary password

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as UserResponseDTO,
      temporaryPassword,
    };
  }

  async listUsers(filters?: { role?: string; email?: string }): Promise<UserResponseDTO[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.email) {
      where.email = { contains: filters.email };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { created_date: 'desc' },
    });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as UserResponseDTO;
    });
  }

  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDTO;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }
}

export default new UsersService();

