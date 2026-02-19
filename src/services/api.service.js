/**
 * API Service - Camada de abstração para acesso a dados
 * Permite alternar entre nossa API, Base44 e dados mockados
 */

import { base44 } from '@/api/base44Client';
import { mockDataService } from './mock-data.service';
import {
  newRestaurantService,
  newReservationService,
  newCustomerService,
  newTableService,
  newShiftService,
  newSubscriptionService,
  newEnvironmentService,
  newFunctionsService,
  newPaymentService
} from './new-api.service';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const USE_NEW_API = import.meta.env.VITE_USE_NEW_API === 'true';

/**
 * Service para gerenciar Restaurantes
 */
export const restaurantService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.restaurants.list();
    if (USE_NEW_API) return newRestaurantService.list();
    return base44.entities.Restaurant.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.restaurants.filter(filters, sort);
    if (USE_NEW_API) return newRestaurantService.filter(filters, sort);
    return base44.entities.Restaurant.filter(filters, sort);
  },

  getBySlug: async (slug) => {
    if (USE_MOCK) {
      const restaurants = await mockDataService.restaurants.filter({ slug }, null);
      return restaurants[0] || null;
    }
    if (USE_NEW_API) return newRestaurantService.getBySlug(slug);
    const restaurants = await base44.entities.Restaurant.filter({ slug });
    return restaurants[0] || null;
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.restaurants.create(data);
    if (USE_NEW_API) return newRestaurantService.create(data);
    return base44.entities.Restaurant.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.restaurants.update(id, data);
    if (USE_NEW_API) return newRestaurantService.update(id, data);
    return base44.entities.Restaurant.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.restaurants.delete(id);
    if (USE_NEW_API) return newRestaurantService.delete(id);
    return base44.entities.Restaurant.delete(id);
  }
};

/**
 * Service para gerenciar Reservas
 */
export const reservationService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.reservations.list();
    if (USE_NEW_API) return newReservationService.list();
    return base44.entities.Reservation.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.reservations.filter(filters, sort);
    if (USE_NEW_API) return newReservationService.filter(filters, sort);
    return base44.entities.Reservation.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.reservations.create(data);
    if (USE_NEW_API) return newReservationService.create(data);
    return base44.entities.Reservation.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.reservations.update(id, data);
    if (USE_NEW_API) return newReservationService.update(id, data);
    return base44.entities.Reservation.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.reservations.delete(id);
    if (USE_NEW_API) return newReservationService.delete(id);
    return base44.entities.Reservation.delete(id);
  }
};

/**
 * Service para gerenciar Clientes
 */
export const customerService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.customers.list();
    if (USE_NEW_API) return newCustomerService.list();
    return base44.entities.Customer.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.customers.filter(filters, sort);
    if (USE_NEW_API) return newCustomerService.filter(filters, sort);
    return base44.entities.Customer.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.customers.create(data);
    if (USE_NEW_API) return newCustomerService.create(data);
    return base44.entities.Customer.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.customers.update(id, data);
    if (USE_NEW_API) return newCustomerService.update(id, data);
    return base44.entities.Customer.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.customers.delete(id);
    if (USE_NEW_API) return newCustomerService.delete(id);
    return base44.entities.Customer.delete(id);
  }
};

/**
 * Service para gerenciar Mesas
 */
export const tableService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.tables.list();
    if (USE_NEW_API) return newTableService.list();
    return base44.entities.Table.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.tables.filter(filters, sort);
    if (USE_NEW_API) return newTableService.filter(filters, sort);
    return base44.entities.Table.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.tables.create(data);
    if (USE_NEW_API) return newTableService.create(data);
    return base44.entities.Table.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.tables.update(id, data);
    if (USE_NEW_API) return newTableService.update(id, data);
    return base44.entities.Table.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.tables.delete(id);
    if (USE_NEW_API) return newTableService.delete(id);
    return base44.entities.Table.delete(id);
  }
};

/**
 * Service para gerenciar Turnos
 */
export const shiftService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.shifts.list();
    if (USE_NEW_API) return newShiftService.list();
    return base44.entities.Shift.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.shifts.filter(filters, sort);
    if (USE_NEW_API) return newShiftService.filter(filters, sort);
    return base44.entities.Shift.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.shifts.create(data);
    if (USE_NEW_API) return newShiftService.create(data);
    return base44.entities.Shift.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.shifts.update(id, data);
    if (USE_NEW_API) return newShiftService.update(id, data);
    return base44.entities.Shift.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.shifts.delete(id);
    if (USE_NEW_API) return newShiftService.delete(id);
    return base44.entities.Shift.delete(id);
  }
};

/**
 * Service para gerenciar Subscriptions
 */
export const subscriptionService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.subscriptions.list();
    if (USE_NEW_API) return newSubscriptionService.list();
    return base44.entities.Subscription.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.subscriptions.filter(filters, sort);
    if (USE_NEW_API) return newSubscriptionService.filter(filters, sort);
    return base44.entities.Subscription.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.subscriptions.create(data);
    if (USE_NEW_API) return newSubscriptionService.create(data);
    return base44.entities.Subscription.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.subscriptions.update(id, data);
    if (USE_NEW_API) return newSubscriptionService.update(id, data);
    return base44.entities.Subscription.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.subscriptions.delete(id);
    if (USE_NEW_API) return newSubscriptionService.delete(id);
    return base44.entities.Subscription.delete(id);
  }
};

/**
 * Service para gerenciar Environments
 */
export const environmentService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.environments?.list() || [];
    if (USE_NEW_API) return newEnvironmentService.list();
    return base44.entities.Environment.list();
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.environments?.filter(filters, sort) || [];
    if (USE_NEW_API) return newEnvironmentService.filter(filters, sort);
    return base44.entities.Environment.filter(filters, sort);
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.environments?.create(data) || data;
    if (USE_NEW_API) return newEnvironmentService.create(data);
    return base44.entities.Environment.create(data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.environments?.update(id, data) || data;
    if (USE_NEW_API) return newEnvironmentService.update(id, data);
    return base44.entities.Environment.update(id, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.environments?.delete(id);
    if (USE_NEW_API) return newEnvironmentService.delete(id);
    return base44.entities.Environment.delete(id);
  }
};

/**
 * Service para invocar Functions
 */
export const functionsService = {
  invoke: async (functionName, params) => {
    if (USE_MOCK) return mockDataService.functions.invoke(functionName, params);
    if (USE_NEW_API) return newFunctionsService.invoke(functionName, params);
    return base44.functions.invoke(functionName, params);
  }
};

/**
 * Service para gerenciar Payments
 */
export const paymentService = {
  list: async () => {
    if (USE_MOCK) return mockDataService.payments?.list() || [];
    if (USE_NEW_API) return newPaymentService.list();
    return base44.entities.Payment?.list() || [];
  },

  filter: async (filters, sort) => {
    if (USE_MOCK) return mockDataService.payments?.filter(filters, sort) || [];
    if (USE_NEW_API) return newPaymentService.filter(filters, sort);
    return base44.entities.Payment?.filter(filters, sort) || [];
  },

  create: async (data) => {
    if (USE_MOCK) return mockDataService.payments?.create(data) || data;
    if (USE_NEW_API) return newPaymentService.create(data);
    return base44.entities.Payment?.create(data) || data;
  },

  update: async (id, data) => {
    if (USE_MOCK) return mockDataService.payments?.update(id, data) || data;
    if (USE_NEW_API) return newPaymentService.update(id, data);
    return base44.entities.Payment?.update(id, data) || data;
  },

  delete: async (id) => {
    if (USE_MOCK) return mockDataService.payments?.delete(id);
    if (USE_NEW_API) return newPaymentService.delete(id);
    return base44.entities.Payment?.delete(id);
  }
};

