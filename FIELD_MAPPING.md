# Mapeamento de Campos - Frontend ↔ Backend

Este documento garante que os campos e formatos de dados sejam consistentes entre frontend e backend.

## 🔑 Autenticação

### Login Request
```javascript
// Frontend → Backend
{
  email: string,
  password: string
}
```

### Login Response
```javascript
// Backend → Frontend
{
  token: string,
  user: {
    id: string,
    email: string,
    full_name: string,
    role: 'USER' | 'ADMIN',
    avatar_url: string | null,
    created_date: string (ISO-8601),
    updated_date: string (ISO-8601)
  }
}
```

### Get Current User (Me)
```javascript
// Backend → Frontend
{
  id: string,
  email: string,
  full_name: string,
  role: 'USER' | 'ADMIN',
  avatar_url: string | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

---

## 🍽️ Restaurantes

### Restaurant Object
```javascript
{
  id: string,
  owner_email: string,
  name: string,
  slug: string,
  phone: string,
  address: string,
  total_capacity: number,
  timezone: string,
  public: boolean,
  operating_hours: object | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

### Create/Update Restaurant
```javascript
// Frontend → Backend
{
  name: string,
  slug: string,
  phone: string,
  address: string,
  total_capacity: number,
  timezone?: string,  // default: 'America/Sao_Paulo'
  public?: boolean,   // default: true
  operating_hours?: object
}
```

---

## 👥 Clientes

### Customer Object
```javascript
{
  id: string,
  restaurant_id: string,
  owner_email: string,
  full_name: string,
  phone_whatsapp: string,
  email: string,
  birth_date: string (ISO-8601) | null,
  total_reservations: number,
  total_spent: number,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

### Create/Update Customer
```javascript
// Frontend → Backend
{
  restaurant_id: string,
  full_name: string,
  phone_whatsapp: string,
  email: string,
  birth_date?: string (ISO-8601)  // Formato: '1990-01-15T00:00:00.000Z'
}
```

**⚠️ IMPORTANTE**: `birth_date` deve ser enviado no formato ISO-8601 completo, não apenas 'YYYY-MM-DD'

---

## 🪑 Mesas

### Table Object
```javascript
{
  id: string,
  restaurant_id: string,
  owner_email: string,
  name: string,
  seats: number,
  environment_id: string | null,
  is_active: boolean,
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'BLOCKED',
  position_x: number | null,
  position_y: number | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

### Create/Update Table
```javascript
// Frontend → Backend
{
  restaurant_id: string,
  name: string,
  seats: number,
  environment_id?: string,
  is_active?: boolean,  // default: true
  status?: 'AVAILABLE' | 'UNAVAILABLE' | 'BLOCKED',  // default: 'AVAILABLE'
  position_x?: number,
  position_y?: number
}
```

**⚠️ IMPORTANTE**: Campo `name` é obrigatório (não `table_number`)

---

## 🏢 Ambientes

### Environment Object
```javascript
{
  id: string,
  restaurant_id: string,
  owner_email: string,
  name: string,
  capacity: number | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

---

## ⏰ Turnos (Shifts)

### Shift Object
```javascript
{
  id: string,
  restaurant_id: string,
  owner_email: string,
  name: string,
  start_time: string,  // Formato: 'HH:mm' (ex: '12:00')
  end_time: string,    // Formato: 'HH:mm' (ex: '15:00')
  slot_interval_minutes: number,
  default_dwell_minutes: number,
  default_buffer_minutes: number,
  max_capacity: number | null,
  days_of_week: number[],  // Array [0-6], onde 0=Domingo, 1=Segunda, etc
  active: boolean,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

**⚠️ IMPORTANTE**: `days_of_week` é um array de números, não strings

---

## 📅 Reservas

### Reservation Object
```javascript
{
  id: string,
  restaurant_id: string,
  owner_email: string,
  customer_id: string,
  reservation_code: string,  // Gerado automaticamente
  date: string (ISO-8601),   // Data da reserva
  shift_id: string,
  slot_time: string,  // Formato: 'HH:mm'
  party_size: number,
  table_id: string,
  linked_tables: string[],  // Array de IDs
  environment_id: string | null,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  source: 'PHONE' | 'ONLINE',
  notes: string | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

### Create Reservation
```javascript
// Frontend → Backend
{
  restaurant_id: string,
  customer_id: string,
  date: string (ISO-8601),  // Formato: '2026-02-15T00:00:00.000Z'
  shift_id: string,
  slot_time: string,  // Formato: 'HH:mm'
  party_size: number,
  table_id: string,
  linked_tables?: string[],  // default: []
  environment_id?: string,
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',  // default: 'PENDING'
  source: 'PHONE' | 'ONLINE',
  notes?: string
}
```

**⚠️ IMPORTANTE**: 
- `date` deve ser ISO-8601 completo
- `reservation_code` é gerado automaticamente pelo backend

---

## 💳 Assinaturas (Subscriptions)

### Subscription Object
```javascript
{
  id: string,
  user_email: string,
  plan_type: 'DOMUS_FREE' | 'DOMUS_PAID',
  status: 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'PAST_DUE',
  stripe_customer_id: string | null,
  stripe_subscription_id: string | null,
  current_period_start: string (ISO-8601),
  current_period_end: string (ISO-8601),
  cancelled_at: string (ISO-8601) | null,
  created_date: string (ISO-8601),
  updated_date: string (ISO-8601)
}
```

---

## 📝 Notas Importantes

### Formatos de Data
- **Sempre usar ISO-8601 completo**: `'2026-02-15T00:00:00.000Z'`
- **Nunca usar apenas**: `'2026-02-15'`

### Formatos de Hora
- **Usar formato HH:mm**: `'12:30'`, `'18:00'`

### Campos Obrigatórios vs Opcionais
- Campos sem `?` são obrigatórios
- Campos com `?` são opcionais

### Filtros
- Todos os endpoints de listagem aceitam filtros via query string
- Exemplo: `/api/customers?restaurant_id=abc123`

### Autenticação
- Todas as requisições (exceto login) devem incluir header:
  ```
  Authorization: Bearer {token}
  ```

