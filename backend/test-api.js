// Simple API Testing Script
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3001';
let authToken = '';

// Helper function to make requests
async function request(method, path, data = null, useAuth = false) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: json,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  const result = await request('GET', '/health');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testLogin(email, password) {
  console.log('\n🔐 Testing Login...');
  const result = await request('POST', '/api/auth/login', { email, password });
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Token saved!');
  }
  
  return result.ok;
}

async function testMe() {
  console.log('\n👤 Testing Get Current User...');
  const result = await request('GET', '/api/auth/me', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testCreateFreeTrialAccount(email, fullName) {
  console.log('\n🆕 Testing Create Free Trial Account...');
  const result = await request('POST', '/api/admin/create-freetrial-account', {
    email,
    full_name: fullName,
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testCreateRestaurant(name, slug) {
  console.log('\n🍽️  Testing Create Restaurant...');
  const result = await request('POST', '/api/restaurants', {
    name,
    slug,
    address: 'Rua Teste, 123',
    phone: '+55 11 99999-9999',
    email: 'contato@restaurante.com',
    total_capacity: 50,
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testListRestaurants() {
  console.log('\n📋 Testing List Restaurants...');
  const result = await request('GET', '/api/restaurants', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testCreateCustomer(restaurantId) {
  console.log('\n👥 Testing Create Customer...');
  const result = await request('POST', '/api/customers', {
    restaurant_id: restaurantId,
    full_name: 'João Silva',
    phone_whatsapp: '+55 11 98888-8888',
    email: 'joao@example.com',
    birth_date: '1990-01-15T00:00:00.000Z',
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testListCustomers(restaurantId) {
  console.log('\n📋 Testing List Customers...');
  const result = await request('GET', `/api/customers?restaurant_id=${restaurantId}`, null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testCreateEnvironment(restaurantId) {
  console.log('\n🏢 Testing Create Environment...');
  const result = await request('POST', '/api/environments', {
    restaurant_id: restaurantId,
    name: 'Salão Principal',
    description: 'Área interna principal',
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testCreateTable(restaurantId, environmentId) {
  console.log('\n🪑 Testing Create Table...');
  const result = await request('POST', '/api/tables', {
    restaurant_id: restaurantId,
    environment_id: environmentId,
    name: 'Mesa 1',
    seats: 4,
    status: 'AVAILABLE',
    is_active: true,
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testCreateShift(restaurantId) {
  console.log('\n⏰ Testing Create Shift...');
  const result = await request('POST', '/api/shifts', {
    restaurant_id: restaurantId,
    name: 'Almoço',
    start_time: '12:00',
    end_time: '15:00',
    slot_interval_minutes: 15,
    default_dwell_minutes: 90,
    default_buffer_minutes: 10,
    max_capacity: 50,
    days_of_week: [1, 2, 3, 4, 5], // Segunda a Sexta
    active: true,
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testListShifts(restaurantId) {
  console.log('\n📋 Testing List Shifts...');
  const result = await request('GET', `/api/shifts?restaurant_id=${restaurantId}`, null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testCreateReservation(restaurantId, customerId, shiftId, tableId) {
  console.log('\n📅 Testing Create Reservation...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dateStr = tomorrow.toISOString();

  const result = await request('POST', '/api/reservations', {
    restaurant_id: restaurantId,
    customer_id: customerId,
    date: dateStr,
    shift_id: shiftId,
    slot_time: '12:30',
    party_size: 4,
    table_id: tableId,
    linked_tables: [],
    status: 'PENDING',
    source: 'ONLINE',
    notes: 'Reserva de teste',
  }, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok ? result.data : null;
}

async function testListReservations(restaurantId) {
  console.log('\n📋 Testing List Reservations...');
  const result = await request('GET', `/api/reservations?restaurant_id=${restaurantId}`, null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testFindReservationByCode(code) {
  console.log('\n🔍 Testing Find Reservation by Code...');
  const result = await request('GET', `/api/reservations/code/${code}`, null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testListSubscriptions() {
  console.log('\n💳 Testing List Subscriptions...');
  const result = await request('GET', '/api/subscriptions', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

async function testGetSubscriptionByEmail(email) {
  console.log('\n🔍 Testing Get Subscription by Email...');
  const result = await request('GET', `/api/subscriptions/user/${email}`, null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  return result.ok;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log('Base URL:', BASE_URL);
  
  // Test 1: Health Check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed! Make sure the server is running.');
    return;
  }
  
  // Test 2: Login
  const loginOk = await testLogin('admin@domusai.com', 'admin123');
  if (!loginOk) {
    console.log('\n❌ Login failed! Check credentials.');
    return;
  }

  // Test 3: Get current user
  await testMe();

  // Test 4: Create free trial account
  await testCreateFreeTrialAccount('newuser@example.com', 'New User');

  // Test 5: Create restaurant (or use existing)
  let restaurant = await testCreateRestaurant('Restaurante Teste 3', 'restaurante-teste-3');

  // Test 6: List restaurants
  const restaurants = await testListRestaurants();

  // If restaurant creation failed (already exists), use the first one from the list
  if (!restaurant && restaurants) {
    const listResult = await request('GET', '/api/restaurants', null, true);
    if (listResult.ok && listResult.data.length > 0) {
      restaurant = listResult.data[0];
      console.log('\n📌 Using existing restaurant:', restaurant.name);
    }
  }

  if (restaurant && restaurant.id) {
    // Test 7: Create customer
    const customer = await testCreateCustomer(restaurant.id);

    // Test 8: List customers
    await testListCustomers(restaurant.id);

    // Test 9: Create environment
    const environment = await testCreateEnvironment(restaurant.id);

    // Test 10: Create table
    let table = null;
    if (environment && environment.id) {
      table = await testCreateTable(restaurant.id, environment.id);
    }

    // Test 11: Create shift
    const shift = await testCreateShift(restaurant.id);

    // Test 12: List shifts
    await testListShifts(restaurant.id);

    // Test 13: Create reservation
    let reservation = null;
    if (customer && shift && table) {
      reservation = await testCreateReservation(
        restaurant.id,
        customer.id,
        shift.id,
        table.id
      );
    }

    // Test 14: List reservations
    await testListReservations(restaurant.id);

    // Test 15: Find reservation by code
    if (reservation && reservation.reservation_code) {
      await testFindReservationByCode(reservation.reservation_code);
    }
  }

  // Test 16: List subscriptions
  await testListSubscriptions();

  // Test 17: Get subscription by email
  await testGetSubscriptionByEmail('admin@domusai.com');

  console.log('\n✅ All tests completed!');
}

// Run tests
runTests().catch(console.error);

