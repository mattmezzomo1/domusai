import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import { CreateTableDTO, UpdateTableDTO, TableResponseDTO, FilterParams } from '../../types';

export class TablesService {
  async create(ownerEmail: string, data: CreateTableDTO): Promise<TableResponseDTO> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurant_id, owner_email: ownerEmail },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const table = await prisma.table.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: ownerEmail,
        name: data.name,
        seats: data.seats,
        environment_id: data.environment_id,
        is_active: data.is_active !== undefined ? data.is_active : true,
        // Convert status to UPPERCASE to match enum TableStatus (AVAILABLE, UNAVAILABLE, BLOCKED)
        status: (data.status ? data.status.toUpperCase() : 'AVAILABLE') as any,
        position_x: data.position_x,
        position_y: data.position_y,
        updated_date: new Date(),
      },
    });

    return table as TableResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<TableResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.restaurant_id) where.restaurant_id = filters.restaurant_id;
    if (filters?.environment_id) where.environment_id = filters.environment_id;
    // Convert status to UPPERCASE to match enum TableStatus (AVAILABLE, UNAVAILABLE, BLOCKED)
    if (filters?.status) where.status = filters.status.toUpperCase();
    if (filters?.is_active !== undefined) where.is_active = filters.is_active === 'true';

    const tables = await prisma.table.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return tables as TableResponseDTO[];
  }

  async findById(id: string, ownerEmail: string): Promise<TableResponseDTO> {
    const table = await prisma.table.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    return table as TableResponseDTO;
  }

  async update(id: string, ownerEmail: string, data: UpdateTableDTO): Promise<TableResponseDTO> {
    const table = await prisma.table.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    // Convert status to UPPERCASE to match enum TableStatus (AVAILABLE, UNAVAILABLE, BLOCKED)
    const updateData: any = { ...data, updated_date: new Date() };
    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    return updatedTable as TableResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const table = await prisma.table.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!table) {
      throw new AppError('Table not found', 404);
    }

    await prisma.table.delete({ where: { id } });
    return { message: 'Table deleted successfully' };
  }
}

export default new TablesService();

