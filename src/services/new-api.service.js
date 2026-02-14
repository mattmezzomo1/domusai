/**
 * New API Service - Serviço de API usando nosso backend
 */

import { apiClient } from '@/api/apiClient';

/**
 * Helper para construir query string com filtros
 */
const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });
  
  return params.toString() ? `?${params.toString()}` : '';
};

/**
 * Service para gerenciar Restaurantes
 */
export const newRestaurantService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/restaurants${queryString}`);
  },
  
  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newRestaurantService.list(allFilters);
  },
  
  getById: async (id) => {
    return apiClient.get(`/restaurants/${id}`);
  },
  
  getBySlug: async (slug) => {
    return apiClient.get(`/restaurants/slug/${slug}`);
  },
  
  create: async (data) => {
    return apiClient.post('/restaurants', data);
  },
  
  update: async (id, data) => {
    return apiClient.put(`/restaurants/${id}`, data);
  },
  
  delete: async (id) => {
    return apiClient.delete(`/restaurants/${id}`);
  }
};

/**
 * Service para gerenciar Reservas
 */
export const newReservationService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/reservations${queryString}`);
  },
  
  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newReservationService.list(allFilters);
  },
  
  getById: async (id) => {
    return apiClient.get(`/reservations/${id}`);
  },
  
  getByCode: async (code) => {
    return apiClient.get(`/reservations/code/${code}`);
  },
  
  create: async (data) => {
    return apiClient.post('/reservations', data);
  },
  
  update: async (id, data) => {
    return apiClient.put(`/reservations/${id}`, data);
  },
  
  delete: async (id) => {
    return apiClient.delete(`/reservations/${id}`);
  }
};

/**
 * Service para gerenciar Clientes
 */
export const newCustomerService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/customers${queryString}`);
  },
  
  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newCustomerService.list(allFilters);
  },
  
  getById: async (id) => {
    return apiClient.get(`/customers/${id}`);
  },
  
  create: async (data) => {
    return apiClient.post('/customers', data);
  },
  
  update: async (id, data) => {
    return apiClient.put(`/customers/${id}`, data);
  },
  
  delete: async (id) => {
    return apiClient.delete(`/customers/${id}`);
  }
};

/**
 * Service para gerenciar Mesas
 */
export const newTableService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/tables${queryString}`);
  },
  
  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newTableService.list(allFilters);
  },
  
  getById: async (id) => {
    return apiClient.get(`/tables/${id}`);
  },
  
  create: async (data) => {
    return apiClient.post('/tables', data);
  },
  
  update: async (id, data) => {
    return apiClient.put(`/tables/${id}`, data);
  },
  
  delete: async (id) => {
    return apiClient.delete(`/tables/${id}`);
  }
};

/**
 * Service para gerenciar Turnos
 */
export const newShiftService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/shifts${queryString}`);
  },

  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newShiftService.list(allFilters);
  },

  getById: async (id) => {
    return apiClient.get(`/shifts/${id}`);
  },

  create: async (data) => {
    return apiClient.post('/shifts', data);
  },

  update: async (id, data) => {
    return apiClient.put(`/shifts/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/shifts/${id}`);
  }
};

/**
 * Service para gerenciar Subscriptions
 */
export const newSubscriptionService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/subscriptions${queryString}`);
  },

  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newSubscriptionService.list(allFilters);
  },

  getById: async (id) => {
    return apiClient.get(`/subscriptions/${id}`);
  },

  getByUserEmail: async (email) => {
    return apiClient.get(`/subscriptions/user/${email}`);
  },

  create: async (data) => {
    return apiClient.post('/subscriptions', data);
  },

  update: async (id, data) => {
    return apiClient.put(`/subscriptions/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/subscriptions/${id}`);
  }
};

/**
 * Service para gerenciar Ambientes
 */
export const newEnvironmentService = {
  list: async (filters = {}) => {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/environments${queryString}`);
  },

  filter: async (filters = {}, sort = {}) => {
    const allFilters = { ...filters, ...sort };
    return newEnvironmentService.list(allFilters);
  },

  getById: async (id) => {
    return apiClient.get(`/environments/${id}`);
  },

  create: async (data) => {
    return apiClient.post('/environments', data);
  },

  update: async (id, data) => {
    return apiClient.put(`/environments/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/environments/${id}`);
  }
};

/**
 * Service para invocar Functions (Admin)
 */
export const newFunctionsService = {
  // Admin: Create free trial account
  createFreeTrialAccount: async (email, full_name) => {
    return apiClient.post('/admin/create-freetrial-account', { email, full_name });
  },

  // Admin: Grant free plan
  grantFreePlan: async (user_email) => {
    return apiClient.post('/admin/grant-free-plan', { user_email });
  },

  // Admin: Revoke access
  revokeAccess: async (user_email) => {
    return apiClient.post('/admin/revoke-access', { user_email });
  },

  // Admin: Upgrade to paid
  upgradeToPaid: async (user_email) => {
    return apiClient.post('/admin/upgrade-to-paid', { user_email });
  },

  // Admin: Create discount code
  createDiscountCode: async (data) => {
    return apiClient.post('/admin/create-discount-code', data);
  },

  // Generic function invoke (para compatibilidade)
  invoke: async (functionName, params) => {
    // Mapeia nomes de funções antigas para novos endpoints
    const functionMap = {
      'create-freetrial-account': () => newFunctionsService.createFreeTrialAccount(params.email, params.full_name),
      'admin-grant-free-plan': () => newFunctionsService.grantFreePlan(params.user_email),
      'admin-revoke-access': () => newFunctionsService.revokeAccess(params.user_email),
      'admin-upgrade-to-paid': () => newFunctionsService.upgradeToPaid(params.user_email),
    };

    if (functionMap[functionName]) {
      return functionMap[functionName]();
    }

    throw new Error(`Function ${functionName} not implemented`);
  }
};

/**
 * Service para Payments
 */
export const newPaymentService = {
  createCheckout: async (data) => {
    return apiClient.post('/payments/create-checkout', data);
  }
};

