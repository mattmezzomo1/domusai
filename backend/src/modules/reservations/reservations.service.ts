import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import { CreateReservationDTO, UpdateReservationDTO, ReservationResponseDTO, FilterParams } from '../../types';

export class ReservationsService {
  private generateReservationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async create(ownerEmail: string, data: CreateReservationDTO): Promise<ReservationResponseDTO> {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurant_id, owner_email: ownerEmail },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Generate unique reservation code
    let reservationCode = this.generateReservationCode();
    let existing = await prisma.reservation.findUnique({
      where: { reservation_code: reservationCode },
    });

    while (existing) {
      reservationCode = this.generateReservationCode();
      existing = await prisma.reservation.findUnique({
        where: { reservation_code: reservationCode },
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: ownerEmail,
        customer_id: data.customer_id,
        reservation_code: reservationCode,
        date: data.date,
        shift_id: data.shift_id,
        slot_time: data.slot_time,
        party_size: data.party_size,
        table_id: data.table_id,
        linked_tables: data.linked_tables || [],
        environment_id: data.environment_id,
        // Convert status to UPPERCASE to match enum ReservationStatus
        status: (data.status ? data.status.toUpperCase() : 'PENDING') as any,
        // Convert source to UPPERCASE to match enum ReservationSource (PHONE, ONLINE)
        source: data.source.toUpperCase() as any,
        notes: data.notes,
        updated_date: new Date(),
      },
    });

    return reservation as ReservationResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<ReservationResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.restaurant_id) where.restaurant_id = filters.restaurant_id;
    if (filters?.customer_id) where.customer_id = filters.customer_id;
    // Convert status to UPPERCASE to match enum ReservationStatus (PENDING, CONFIRMED, CANCELLED, COMPLETED)
    if (filters?.status) where.status = filters.status.toUpperCase();
    if (filters?.date) where.date = new Date(filters.date as string);
    if (filters?.shift_id) where.shift_id = filters.shift_id;

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        customer: true, // Include customer data
      },
    });

    return reservations as any[];
  }

  async findById(id: string, ownerEmail: string): Promise<ReservationResponseDTO> {
    const reservation = await prisma.reservation.findFirst({
      where: { id, owner_email: ownerEmail },
      include: {
        customer: true, // Include customer data
      },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    return reservation as any;
  }

  async findByCode(code: string): Promise<ReservationResponseDTO> {
    const reservation = await prisma.reservation.findUnique({
      where: { reservation_code: code },
      include: {
        customer: true, // Include customer data
      },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    return reservation as any;
  }

  async findByPhone(phone: string, restaurantId: string): Promise<ReservationResponseDTO[]> {
    // Find customer by phone
    const customers = await prisma.customer.findMany({
      where: {
        phone_whatsapp: phone,
        restaurant_id: restaurantId,
      },
    });

    if (customers.length === 0) {
      return [];
    }

    const customerIds = customers.map(c => c.id);

    // Find all future reservations for these customers
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await prisma.reservation.findMany({
      where: {
        customer_id: { in: customerIds },
        restaurant_id: restaurantId,
        date: { gte: today },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return reservations as any[];
  }

  async updatePublic(id: string, data: UpdateReservationDTO): Promise<ReservationResponseDTO> {
    // Public update - doesn't require owner_email check
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    // Convert enum fields to UPPERCASE if provided
    const updateData: any = { ...data, updated_date: new Date() };
    if (updateData.status) updateData.status = updateData.status.toUpperCase();
    if (updateData.source) updateData.source = updateData.source.toUpperCase();

    console.log('📝 Atualizando reserva pública:', {
      id,
      oldStatus: reservation.status,
      newStatus: updateData.status,
      updateData
    });

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    console.log('✅ Reserva atualizada no banco de dados:', {
      id: updated.id,
      status: updated.status,
      code: updated.reservation_code
    });

    return updated as ReservationResponseDTO;
  }

  async update(id: string, ownerEmail: string, data: UpdateReservationDTO): Promise<ReservationResponseDTO> {
    const reservation = await prisma.reservation.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    // Convert enum fields to UPPERCASE if provided
    const updateData: any = { ...data, updated_date: new Date() };
    if (updateData.status) updateData.status = updateData.status.toUpperCase();
    if (updateData.source) updateData.source = updateData.source.toUpperCase();

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    return updated as ReservationResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const reservation = await prisma.reservation.findFirst({
      where: { id, owner_email: ownerEmail },
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    await prisma.reservation.delete({ where: { id } });
    return { message: 'Reservation deleted successfully' };
  }
}

export default new ReservationsService();

