/**
 * Mock Data Service - Dados simulados para desenvolvimento
 */

import { format, addDays, subDays } from 'date-fns';

// Gera ID único
const generateId = () => 'mock_' + Math.random().toString(36).substr(2, 9);

// Storage key para persistir dados mockados
const STORAGE_KEY = 'domus_mock_data';

// Função para carregar dados do localStorage ou criar novos
const loadOrCreateData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao carregar dados mockados:', e);
    }
  }
  return createInitialMockData();
};

// Função para salvar dados no localStorage
const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Cria dados iniciais mockados
const createInitialMockData = () => {
  const restaurantId = generateId();
  
  const data = {
    restaurants: [
      {
        id: restaurantId,
        name: 'Restaurante Domus',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        phone: '(11) 98765-4321',
        email: 'contato@domus.com',
        capacity: 80,
        opening_time: '11:00',
        closing_time: '23:00',
        booking_enabled: true,
        created_date: new Date('2024-01-01').toISOString()
      }
    ],
    
    tables: [
      { id: generateId(), restaurant_id: restaurantId, number: '1', capacity: 2, position_x: 100, position_y: 100, status: 'available' },
      { id: generateId(), restaurant_id: restaurantId, number: '2', capacity: 2, position_x: 200, position_y: 100, status: 'available' },
      { id: generateId(), restaurant_id: restaurantId, number: '3', capacity: 4, position_x: 300, position_y: 100, status: 'available' },
      { id: generateId(), restaurant_id: restaurantId, number: '4', capacity: 4, position_x: 100, position_y: 200, status: 'available' },
      { id: generateId(), restaurant_id: restaurantId, number: '5', capacity: 6, position_x: 200, position_y: 200, status: 'available' },
      { id: generateId(), restaurant_id: restaurantId, number: '6', capacity: 8, position_x: 300, position_y: 200, status: 'available' },
    ],
    
    shifts: [
      {
        id: generateId(),
        restaurant_id: restaurantId,
        name: 'Almoço',
        start_time: '11:00',
        end_time: '15:00',
        days_of_week: [1, 2, 3, 4, 5, 6, 0], // Todos os dias
        active: true
      },
      {
        id: generateId(),
        restaurant_id: restaurantId,
        name: 'Jantar',
        start_time: '18:00',
        end_time: '23:00',
        days_of_week: [1, 2, 3, 4, 5, 6, 0],
        active: true
      }
    ],
    
    customers: [],
    reservations: [],
    subscriptions: [
      {
        id: generateId(),
        user_email: 'admin@domus.com',
        plan_type: 'paid',
        status: 'active',
        stripe_subscription_id: 'sub_mock_123',
        current_period_start: subDays(new Date(), 15).toISOString(),
        current_period_end: addDays(new Date(), 15).toISOString(),
        created_date: new Date('2024-01-01').toISOString()
      }
    ]
  };
  
  // Criar alguns clientes de exemplo
  const customerNames = [
    { name: 'João Silva', phone: '11987654321' },
    { name: 'Maria Santos', phone: '11987654322' },
    { name: 'Pedro Oliveira', phone: '11987654323' },
    { name: 'Ana Costa', phone: '11987654324' },
    { name: 'Carlos Souza', phone: '11987654325' },
  ];
  
  customerNames.forEach(({ name, phone }) => {
    data.customers.push({
      id: generateId(),
      restaurant_id: restaurantId,
      name: name,
      phone_whatsapp: phone,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      total_reservations: Math.floor(Math.random() * 10) + 1,
      total_spent: Math.floor(Math.random() * 5000) + 500,
      created_date: subDays(new Date(), Math.floor(Math.random() * 90)).toISOString()
    });
  });
  
  // Criar algumas reservas de exemplo
  const today = new Date();
  const statuses = ['confirmed', 'pending', 'cancelled', 'completed'];
  
  for (let i = 0; i < 20; i++) {
    const daysOffset = Math.floor(Math.random() * 14) - 7; // -7 a +7 dias
    const date = addDays(today, daysOffset);
    const customer = data.customers[Math.floor(Math.random() * data.customers.length)];
    const table = data.tables[Math.floor(Math.random() * data.tables.length)];
    const shift = data.shifts[Math.floor(Math.random() * data.shifts.length)];
    
    data.reservations.push({
      id: generateId(),
      restaurant_id: restaurantId,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone_whatsapp,
      table_id: table.id,
      table_number: table.number,
      date: format(date, 'yyyy-MM-dd'),
      slot_time: shift.start_time,
      shift_name: shift.name,
      guests: Math.floor(Math.random() * table.capacity) + 1,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: i % 3 === 0 ? 'Cliente preferencial' : '',
      code: `RES${String(i + 1).padStart(4, '0')}`,
      created_date: subDays(date, Math.floor(Math.random() * 5)).toISOString()
    });
  }
  
  saveData(data);
  return data;
};

// Carrega dados iniciais
let mockData = loadOrCreateData();

// Helper para filtrar e ordenar dados
const filterAndSort = (items, filters = {}, sort = null) => {
  let filtered = [...items];

  // Aplicar filtros
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    filtered = filtered.filter(item => {
      if (Array.isArray(value)) {
        return value.includes(item[key]);
      }
      return item[key] === value;
    });
  });

  // Aplicar ordenação
  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;

    filtered.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
      return 0;
    });
  }

  return filtered;
};

/**
 * Mock Data Service - Simula operações de banco de dados
 */
export const mockDataService = {
  // Restaurants
  restaurants: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.restaurants];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.restaurants, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = { id: generateId(), ...data, created_date: new Date().toISOString() };
      mockData.restaurants.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.restaurants.findIndex(r => r.id === id);
      if (index !== -1) {
        mockData.restaurants[index] = { ...mockData.restaurants[index], ...data };
        saveData(mockData);
        return mockData.restaurants[index];
      }
      throw new Error('Restaurant not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.restaurants = mockData.restaurants.filter(r => r.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Reservations
  reservations: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.reservations];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.reservations, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = {
        id: generateId(),
        ...data,
        code: `RES${String(mockData.reservations.length + 1).padStart(4, '0')}`,
        created_date: new Date().toISOString()
      };
      mockData.reservations.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.reservations.findIndex(r => r.id === id);
      if (index !== -1) {
        mockData.reservations[index] = { ...mockData.reservations[index], ...data };
        saveData(mockData);
        return mockData.reservations[index];
      }
      throw new Error('Reservation not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.reservations = mockData.reservations.filter(r => r.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Customers
  customers: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.customers];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.customers, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = { id: generateId(), ...data, created_date: new Date().toISOString() };
      mockData.customers.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.customers.findIndex(c => c.id === id);
      if (index !== -1) {
        mockData.customers[index] = { ...mockData.customers[index], ...data };
        saveData(mockData);
        return mockData.customers[index];
      }
      throw new Error('Customer not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.customers = mockData.customers.filter(c => c.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Tables
  tables: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.tables];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.tables, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = { id: generateId(), ...data };
      mockData.tables.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.tables.findIndex(t => t.id === id);
      if (index !== -1) {
        mockData.tables[index] = { ...mockData.tables[index], ...data };
        saveData(mockData);
        return mockData.tables[index];
      }
      throw new Error('Table not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.tables = mockData.tables.filter(t => t.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Shifts
  shifts: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.shifts];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.shifts, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = { id: generateId(), ...data };
      mockData.shifts.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.shifts.findIndex(s => s.id === id);
      if (index !== -1) {
        mockData.shifts[index] = { ...mockData.shifts[index], ...data };
        saveData(mockData);
        return mockData.shifts[index];
      }
      throw new Error('Shift not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.shifts = mockData.shifts.filter(s => s.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Subscriptions
  subscriptions: {
    list: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...mockData.subscriptions];
    },

    filter: async (filters, sort) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return filterAndSort(mockData.subscriptions, filters, sort);
    },

    create: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const newItem = { id: generateId(), ...data, created_date: new Date().toISOString() };
      mockData.subscriptions.push(newItem);
      saveData(mockData);
      return newItem;
    },

    update: async (id, data) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const index = mockData.subscriptions.findIndex(s => s.id === id);
      if (index !== -1) {
        mockData.subscriptions[index] = { ...mockData.subscriptions[index], ...data };
        saveData(mockData);
        return mockData.subscriptions[index];
      }
      throw new Error('Subscription not found');
    },

    delete: async (id) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockData.subscriptions = mockData.subscriptions.filter(s => s.id !== id);
      saveData(mockData);
      return { success: true };
    }
  },

  // Functions (mock)
  functions: {
    invoke: async (functionName, params) => {
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log(`[Mock Function] ${functionName}`, params);

      // Simula respostas de diferentes functions
      switch (functionName) {
        case 'create-checkout':
          return { url: 'https://checkout.stripe.com/mock-session' };

        case 'create-freetrial-account':
          return { success: true, message: 'Conta criada com sucesso' };

        case 'admin-grant-free-plan':
        case 'admin-revoke-access':
        case 'admin-upgrade-to-paid':
        case 'admin-create-discount-code':
          return { success: true };

        default:
          return { success: true, message: 'Function executed' };
      }
    }
  },

  // Utility: Reset all data
  reset: () => {
    mockData = createInitialMockData();
    console.log('[Mock Data] Dados resetados');
  },

  // Utility: Get all data
  getAll: () => {
    return { ...mockData };
  }
};

