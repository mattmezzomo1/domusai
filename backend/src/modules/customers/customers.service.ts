import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerResponseDTO,
  FilterParams,
} from '../../types';

export class CustomersService {
  async create(ownerEmail: string, data: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    // Verify restaurant belongs to user
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: data.restaurant_id,
        owner_email: ownerEmail,
      },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const customer = await prisma.customer.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: ownerEmail,
        full_name: data.full_name,
        phone_whatsapp: data.phone_whatsapp,
        email: data.email,
        birth_date: data.birth_date,
        updated_date: new Date(),
      },
    });

    return {
      ...customer,
      total_spent: customer.total_spent.toNumber(),
    } as CustomerResponseDTO;
  }

  async findAll(ownerEmail: string, filters?: FilterParams): Promise<CustomerResponseDTO[]> {
    const where: any = { owner_email: ownerEmail };

    if (filters?.restaurant_id) {
      where.restaurant_id = filters.restaurant_id;
    }

    if (filters?.full_name) {
      where.full_name = { contains: filters.full_name };
    }

    if (filters?.phone_whatsapp) {
      where.phone_whatsapp = { contains: filters.phone_whatsapp };
    }

    if (filters?.email) {
      where.email = { contains: filters.email };
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { created_date: 'desc' },
    });

    return customers.map(customer => ({
      ...customer,
      total_spent: customer.total_spent.toNumber(),
    })) as CustomerResponseDTO[];
  }

  async findById(id: string, ownerEmail: string): Promise<CustomerResponseDTO> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return {
      ...customer,
      total_spent: customer.total_spent.toNumber(),
    } as CustomerResponseDTO;
  }

  async update(
    id: string,
    ownerEmail: string,
    data: UpdateCustomerDTO
  ): Promise<CustomerResponseDTO> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const updateData: any = { ...data, updated_date: new Date() };

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updatedCustomer,
      total_spent: updatedCustomer.total_spent.toNumber(),
    } as CustomerResponseDTO;
  }

  async delete(id: string, ownerEmail: string): Promise<{ message: string }> {
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        owner_email: ownerEmail,
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    await prisma.customer.delete({
      where: { id },
    });

    return { message: 'Customer deleted successfully' };
  }
}

export default new CustomersService();

