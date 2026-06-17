import prisma from '../../utils/db';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomerResponseDTO,
  FilterParams,
} from '../../types';
import { normalizePhone } from '../../utils/meta.util';

export class CustomersService {
  private normalizeCustomerPhone(phone: string, countryIso?: string | null): string {
    const normalizedPhone = normalizePhone(phone, countryIso);
    if (!normalizedPhone) {
      throw new AppError('Invalid phone number', 400);
    }
    return normalizedPhone;
  }

  private buildPhoneLookupCandidates(phone: string, countryIso?: string | null): string[] {
    const candidates = new Set<string>();
    const rawDigits = String(phone || '').replace(/\D/g, '');
    const normalizedPhone = normalizePhone(phone, countryIso);

    if (normalizedPhone) {
      candidates.add(normalizedPhone);
      if ((countryIso || 'BR').toUpperCase() === 'BR' && normalizedPhone.startsWith('55')) {
        candidates.add(normalizedPhone.slice(2));
      }
    }

    if (rawDigits) candidates.add(rawDigits);
    return [...candidates];
  }

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
        phone_whatsapp: this.normalizeCustomerPhone(data.phone_whatsapp, data.phone_country_iso),
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
    const phoneCountryIso = updateData.phone_country_iso;
    delete updateData.phone_country_iso;

    if (updateData.phone_whatsapp !== undefined) {
      updateData.phone_whatsapp = this.normalizeCustomerPhone(
        updateData.phone_whatsapp,
        phoneCountryIso
      );
    }

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

  // Public method to find customer by phone and restaurant (no auth required)
  async findByPhoneAndRestaurant(
    phone: string,
    restaurantId: string,
    countryIso?: string | null
  ): Promise<CustomerResponseDTO | null> {
    const phoneCandidates = this.buildPhoneLookupCandidates(phone, countryIso);
    if (phoneCandidates.length === 0) return null;

    const customer = await prisma.customer.findFirst({
      where: {
        phone_whatsapp: { in: phoneCandidates },
        restaurant_id: restaurantId,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      ...customer,
      total_spent: customer.total_spent.toNumber(),
    } as CustomerResponseDTO;
  }

  // Public method to create customer (no auth required, for public booking)
  async createPublic(data: CreateCustomerDTO): Promise<CustomerResponseDTO> {
    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: data.restaurant_id,
      },
    });

    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    const customer = await prisma.customer.create({
      data: {
        restaurant_id: data.restaurant_id,
        owner_email: restaurant.owner_email,
        full_name: data.full_name,
        phone_whatsapp: this.normalizeCustomerPhone(data.phone_whatsapp, data.phone_country_iso),
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

  // Public method to update customer (no auth required, for public booking)
  async updatePublic(id: string, data: UpdateCustomerDTO): Promise<CustomerResponseDTO> {
    const customer = await prisma.customer.findFirst({
      where: { id },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const updateData: any = { ...data, updated_date: new Date() };
    const phoneCountryIso = updateData.phone_country_iso;
    delete updateData.phone_country_iso;

    if (updateData.phone_whatsapp !== undefined) {
      updateData.phone_whatsapp = this.normalizeCustomerPhone(
        updateData.phone_whatsapp,
        phoneCountryIso
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updatedCustomer,
      total_spent: updatedCustomer.total_spent.toNumber(),
    } as CustomerResponseDTO;
  }
}

export default new CustomersService();
