import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateRestaurantDTO,
  UpdateRestaurantDTO,
  RestaurantResponseDTO,
  FilterParams,
} from '../../types';

export class RestaurantsService {
  async create(ownerEmail: string, data: CreateRestaurantDTO): Promise<RestaurantResponseDTO> {
    // Check if slug is already taken
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { slug: data.slug },
    });

    if (existingRestaurant) {
      throw new AppError('Restaurant with this slug already exists', 400);
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        owner_email: ownerEmail,
        name: data.name,
        slug: data.slug,
        phone: data.phone,
        address: data.address,
        total_capacity: data.total_capacity,
        timezone: data.timezone || 'America/Sao_Paulo',
        public: data.public !== undefined ? data.public : true,
        operating_hours: data.operating_hours || null,
        updated_date: new Date(),
      },
    });

    return restaurant as RestaurantResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<RestaurantResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.name) {
      where.name = { contains: filters.name };
    }

    if (filters?.slug) {
      where.slug = { contains: filters.slug };
    }

    if (filters?.public !== undefined) {
      where.public = filters.public === 'true' || filters.public === true;
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: { created_date: 'desc' },
    });

    return restaurants as RestaurantResponseDTO[];
  }

  async findById(id: string, ownerEmail: string): Promise<RestaurantResponseDTO> {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return restaurant as RestaurantResponseDTO;
  }

  async findBySlug(slug: string): Promise<RestaurantResponseDTO> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    return restaurant as RestaurantResponseDTO;
  }

  async update(
    id: string,
    ownerEmail: string,
    data: UpdateRestaurantDTO
  ): Promise<RestaurantResponseDTO> {
    // Check if restaurant exists and belongs to user
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // If slug is being updated, check if it's available
    if (data.slug && data.slug !== restaurant.slug) {
      const existingRestaurant = await prisma.restaurant.findUnique({
        where: { slug: data.slug },
      });

      if (existingRestaurant) {
        throw new AppError('Restaurant with this slug already exists', 400);
      }
    }

    const updateData: any = { ...data, updated_date: new Date() };

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    return updatedRestaurant as RestaurantResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    await prisma.restaurant.delete({
      where: { id },
    });

    return { message: 'Restaurant deleted successfully' };
  }
}

export default new RestaurantsService();

