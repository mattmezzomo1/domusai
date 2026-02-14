# Documentação de Endpoints da API Domus

Esta documentação lista todos os endpoints necessários para substituir a API do Base44 e suportar todas as funcionalidades do frontend.

## Índice
1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Restaurantes](#restaurantes)
4. [Clientes](#clientes)
5. [Mesas](#mesas)
6. [Ambientes](#ambientes)
7. [Turnos](#turnos)
8. [Reservas](#reservas)
9. [Assinaturas](#assinaturas)
10. [Funções Administrativas](#funções-administrativas)
11. [Pagamentos (Stripe)](#pagamentos-stripe)

---

## Autenticação

### POST /auth/login
Realiza login do usuário
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, token: string }`

### POST /auth/logout
Realiza logout do usuário
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /auth/me
Retorna dados do usuário autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `User`

### PUT /auth/me
Atualiza dados do usuário autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ full_name?: string, avatar_url?: string }`
- **Response**: `User`

### POST /auth/reset-password
Envia email de reset de senha
- **Body**: `{ email: string }`
- **Response**: `{ success: boolean, message: string }`

### GET /auth/is-authenticated
Verifica se o usuário está autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ authenticated: boolean }`

---

## Usuários

### POST /users/invite
Convida um novo usuário (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ email: string, role: 'user' | 'admin' }`
- **Response**: `User`

### GET /users
Lista todos os usuários (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `User[]`

---

## Restaurantes

### GET /restaurants
Lista todos os restaurantes do usuário
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Restaurant[]`

### GET /restaurants/:id
Busca um restaurante por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Restaurant`

### POST /restaurants
Cria um novo restaurante
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `RestaurantCreateDTO`
- **Response**: `Restaurant`

### PUT /restaurants/:id
Atualiza um restaurante
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `RestaurantUpdateDTO`
- **Response**: `Restaurant`

### DELETE /restaurants/:id
Deleta um restaurante
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /restaurants/filter
Filtra restaurantes
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?owner_email=string&public=boolean&slug=string`
- **Response**: `Restaurant[]`

---

## Clientes

### GET /customers
Lista todos os clientes
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Customer[]`

### GET /customers/:id
Busca um cliente por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Customer`

### POST /customers
Cria um novo cliente
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `CustomerCreateDTO`
- **Response**: `Customer`

### PUT /customers/:id
Atualiza um cliente
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `CustomerUpdateDTO`
- **Response**: `Customer`

### DELETE /customers/:id
Deleta um cliente
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /customers/filter
Filtra clientes
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?restaurant_id=string&phone_whatsapp=string&email=string`
- **Response**: `Customer[]`

---

## Mesas

### GET /tables
Lista todas as mesas
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Table[]`

### GET /tables/:id
Busca uma mesa por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Table`

### POST /tables
Cria uma nova mesa
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `TableCreateDTO`
- **Response**: `Table`

### PUT /tables/:id
Atualiza uma mesa
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `TableUpdateDTO`
- **Response**: `Table`

### DELETE /tables/:id
Deleta uma mesa
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /tables/filter
Filtra mesas
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?restaurant_id=string&is_active=boolean&status=string&environment_id=string`
- **Response**: `Table[]`

---

## Ambientes

### GET /environments
Lista todos os ambientes
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Environment[]`

### GET /environments/:id
Busca um ambiente por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Environment`

### POST /environments
Cria um novo ambiente
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `EnvironmentCreateDTO`
- **Response**: `Environment`

### PUT /environments/:id
Atualiza um ambiente
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `EnvironmentUpdateDTO`
- **Response**: `Environment`

### DELETE /environments/:id
Deleta um ambiente
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /environments/filter
Filtra ambientes
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?restaurant_id=string`
- **Response**: `Environment[]`

---

## Turnos

### GET /shifts
Lista todos os turnos
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Shift[]`

### GET /shifts/:id
Busca um turno por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Shift`

### POST /shifts
Cria um novo turno
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `ShiftCreateDTO`
- **Response**: `Shift`

### PUT /shifts/:id
Atualiza um turno
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `ShiftUpdateDTO`
- **Response**: `Shift`

### DELETE /shifts/:id
Deleta um turno
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /shifts/filter
Filtra turnos
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?restaurant_id=string&active=boolean`
- **Response**: `Shift[]`

---

## Reservas

### GET /reservations
Lista todas as reservas
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Reservation[]`

### GET /reservations/:id
Busca uma reserva por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Reservation`

### POST /reservations
Cria uma nova reserva
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `ReservationCreateDTO`
- **Response**: `Reservation`

### PUT /reservations/:id
Atualiza uma reserva
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `ReservationUpdateDTO`
- **Response**: `Reservation`

### DELETE /reservations/:id
Deleta uma reserva
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /reservations/filter
Filtra reservas
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?restaurant_id=string&customer_id=string&date=string&status=string&shift_id=string&table_id=string`
- **Response**: `Reservation[]`

---

## Assinaturas

### GET /subscriptions
Lista todas as assinaturas (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Subscription[]`

### GET /subscriptions/:id
Busca uma assinatura por ID
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `Subscription`

### POST /subscriptions
Cria uma nova assinatura
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `SubscriptionCreateDTO`
- **Response**: `Subscription`

### PUT /subscriptions/:id
Atualiza uma assinatura
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `SubscriptionUpdateDTO`
- **Response**: `Subscription`

### DELETE /subscriptions/:id
Deleta uma assinatura
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: boolean }`

### GET /subscriptions/filter
Filtra assinaturas
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?user_email=string&status=string&plan_type=string`
- **Response**: `Subscription[]`

---

## Funções Administrativas

### POST /admin/create-freetrial-account
Cria uma conta free trial (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ email: string, full_name?: string }`
- **Response**: `{ success: boolean, subscription: Subscription, message: string }`

### POST /admin/grant-free-plan
Concede plano gratuito a um usuário (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ user_email: string }`
- **Response**: `{ success: boolean, subscription: Subscription }`

### POST /admin/revoke-access
Revoga acesso de um usuário (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ user_email: string }`
- **Response**: `{ success: boolean, subscription: Subscription, message: string }`

### POST /admin/upgrade-to-paid
Atualiza usuário para plano pago (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ user_email: string }`
- **Response**: `{ success: boolean, message: string }`

### POST /admin/create-discount-code
Cria código de desconto no Stripe (Admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ code: string, discountPercent: number, durationMonths?: number }`
- **Response**: `{ success: boolean, coupon: StripeCoupon, promotionCode: StripePromotionCode }`

---

## Pagamentos (Stripe)

### POST /payments/create-checkout
Cria sessão de checkout do Stripe
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ priceId: string, successUrl: string, cancelUrl: string, couponCode?: string }`
- **Response**: `{ checkoutUrl: string, sessionId: string }`

### POST /payments/webhook
Webhook do Stripe para processar eventos
- **Headers**: `stripe-signature: <signature>`
- **Body**: Stripe Event
- **Response**: `{ received: boolean }`
- **Eventos processados**:
  - `checkout.session.completed`: Cria/atualiza assinatura
  - `customer.subscription.updated`: Atualiza status da assinatura
  - `customer.subscription.deleted`: Cancela assinatura
  - `invoice.payment_succeeded`: Atualiza período da assinatura
  - `invoice.payment_failed`: Marca assinatura como past_due

---

## Tipos de Dados (DTOs)

### User
```typescript
{
  id: string
  email: string
  full_name: string
  role: 'user' | 'admin'
  avatar_url?: string
  created_date: string (ISO 8601)
}
```

### Restaurant
```typescript
{
  id: string
  owner_email: string
  name: string
  slug: string
  phone: string
  address: string
  total_capacity: number
  timezone: string
  public: boolean
  operating_hours?: object
  created_date: string (ISO 8601)
}
```

### Customer
```typescript
{
  id: string
  restaurant_id: string
  owner_email: string
  full_name: string
  phone_whatsapp: string
  email?: string
  birth_date?: string (ISO 8601)
  total_reservations?: number
  total_spent?: number
  created_date: string (ISO 8601)
}
```

### Table
```typescript
{
  id: string
  restaurant_id: string
  owner_email: string
  name: string
  seats: number
  environment_id?: string
  is_active: boolean
  status: 'available' | 'unavailable' | 'blocked'
  position_x?: number
  position_y?: number
}
```

### Environment
```typescript
{
  id: string
  restaurant_id: string
  owner_email: string
  name: string
  capacity?: number
}
```

### Shift
```typescript
{
  id: string
  restaurant_id: string
  owner_email: string
  name: string
  start_time: string (HH:mm)
  end_time: string (HH:mm)
  slot_interval_minutes: number
  default_dwell_minutes: number
  default_buffer_minutes: number
  max_capacity?: number
  days_of_week: number[] (0-6, domingo a sábado)
  active: boolean
}
```

### Reservation
```typescript
{
  id: string
  restaurant_id: string
  owner_email: string
  customer_id: string
  reservation_code: string
  date: string (YYYY-MM-DD)
  shift_id: string
  slot_time: string (HH:mm)
  party_size: number
  table_id: string
  linked_tables: string[]
  environment_id?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  source: 'phone' | 'online'
  notes?: string
  created_date: string (ISO 8601)
}
```

### Subscription
```typescript
{
  id: string
  user_email: string
  plan_type: 'domus_free' | 'domus_paid'
  status: 'active' | 'trial' | 'cancelled' | 'past_due'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  current_period_start: string (ISO 8601)
  current_period_end: string (ISO 8601)
  cancelled_at?: string (ISO 8601)
  created_date: string (ISO 8601)
}
```

---

## Notas Importantes

1. **Autenticação**: Todos os endpoints (exceto `/auth/login` e `/auth/reset-password`) requerem token JWT no header `Authorization: Bearer <token>`

2. **Filtros**: Os endpoints `/filter` suportam múltiplos parâmetros de query para filtrar resultados

3. **Ordenação**: Adicionar suporte para ordenação via query param `?sort=-created_date` (prefixo `-` para descendente)

4. **Paginação**: Considerar adicionar paginação para endpoints de listagem com `?page=1&limit=50`

5. **Permissões**:
   - Endpoints `/admin/*` requerem `role: 'admin'`
   - Usuários só podem acessar dados de seus próprios restaurantes
   - Admin pode acessar todos os dados

6. **Stripe**:
   - Webhook deve validar assinatura do Stripe
   - Usar variáveis de ambiente para chaves do Stripe
   - Price ID do plano pago: `price_1SxZb0A4KrGo8eWw7t0inHNO`

