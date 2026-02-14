import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import { CreateEnvironmentDTO, UpdateEnvironmentDTO, EnvironmentResponseDTO, FilterParams } from '../../types';

export class EnvironmentsService {
  async create(ownerEmail: string, data: CreateEnvironmentDTO): Promise<EnvironmentResponseDTO> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurant_id, owner_email: ownerEmail },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const environment = await prisma.environment.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: ownerEmail,
        name: data.name,
        capacity: data.capacity,
        updated_date: new Date(),
      },
    });

    return environment as EnvironmentResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<EnvironmentResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.restaurant_id) where.restaurant_id = filters.restaurant_id;

    const environments = await prisma.environment.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return environments as EnvironmentResponseDTO[];
  }

  async findById(id: string, ownerEmail: string): Promise<EnvironmentResponseDTO> {
    const environment = await prisma.environment.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!environment) {
      throw new AppError('Environment not found', 404);
    }

    return environment as EnvironmentResponseDTO;
  }

  async update(id: string, ownerEmail: string, data: UpdateEnvironmentDTO): Promise<EnvironmentResponseDTO> {
    const environment = await prisma.environment.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!environment) {
      throw new AppError('Environment not found', 404);
    }

    const updated = await prisma.environment.update({
      where: { id },
      data: { ...data, updated_date: new Date() },
    });

    return updated as EnvironmentResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const environment = await prisma.environment.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!environment) {
      throw new AppError('Environment not found', 404);
    }

    await prisma.environment.delete({ where: { id } });
    return { message: 'Environment deleted successfully' };
  }
}

export default new EnvironmentsService();

