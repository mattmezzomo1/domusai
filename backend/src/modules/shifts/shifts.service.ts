import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import { CreateShiftDTO, UpdateShiftDTO, ShiftResponseDTO, FilterParams } from '../../types';

export class ShiftsService {
  async create(ownerEmail: string, data: CreateShiftDTO): Promise<ShiftResponseDTO> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurant_id, owner_email: ownerEmail },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const shift = await prisma.shift.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: ownerEmail,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        slot_interval_minutes: data.slot_interval_minutes || 15,
        default_dwell_minutes: data.default_dwell_minutes || 90,
        default_buffer_minutes: data.default_buffer_minutes || 10,
        max_capacity: data.max_capacity,
        days_of_week: data.days_of_week,
        active: data.active !== undefined ? data.active : true,
        updated_date: new Date(),
      },
    });

    return shift as ShiftResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<ShiftResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.restaurant_id) where.restaurant_id = filters.restaurant_id;
    if (filters?.active !== undefined) where.active = filters.active === 'true';

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { start_time: 'asc' },
    });

    return shifts as ShiftResponseDTO[];
  }

  async findById(id: string, ownerEmail: string): Promise<ShiftResponseDTO> {
    const shift = await prisma.shift.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    return shift as ShiftResponseDTO;
  }

  async update(id: string, ownerEmail: string, data: UpdateShiftDTO): Promise<ShiftResponseDTO> {
    const shift = await prisma.shift.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: { ...data, updated_date: new Date() },
    });

    return updated as ShiftResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const shift = await prisma.shift.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!shift) {
      throw new AppError('Shift not found', 404);
    }

    await prisma.shift.delete({ where: { id } });
    return { message: 'Shift deleted successfully' };
  }
}

export default new ShiftsService();

