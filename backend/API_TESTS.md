# API Testing Guide

Base URL: `http://localhost:3001`

## 1. Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-14T..."
}
```

---

## 2. Authentication Flow

### 2.1 Create Free Trial Account (Admin Only)

First, you need to create an admin user directly in the database, or create a regular user and test login.

For testing, let's create a user directly via Prisma Studio:
```bash
npx prisma studio
```

Or insert directly in database:
```sql
INSERT INTO User (id, email, password, full_name, role, created_date, updated_date)
VALUES (
  UUID(),
  'admin@domusai.com',
  '$2a$10$...',  -- hashed password for 'admin123'
  'Admin User',
  'ADMIN',
  NOW(),
  NOW()
);
```

### 2.2 Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@domusai.com",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@domusai.com",
    "full_name": "Admin User",
    "role": "ADMIN"
  }
}
```

**Save the token for next requests!**

### 2.3 Get Current User (Me)

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2.4 Check Authentication

```bash
curl http://localhost:3001/api/auth/is-authenticated \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. Admin Endpoints

### 3.1 Create Free Trial Account

```bash
curl -X POST http://localhost:3001/api/admin/create-freetrial-account \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "full_name": "Test User",
    "role": "USER"
  },
  "temporaryPassword": "randomPassword123"
}
```

### 3.2 Grant Free Plan

```bash
curl -X POST http://localhost:3001/api/admin/grant-free-plan \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "user@example.com"
  }'
```

---

## 4. Restaurant Endpoints

### 4.1 Create Restaurant

```bash
curl -X POST http://localhost:3001/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurante Teste",
    "slug": "restaurante-teste",
    "address": "Rua Teste, 123",
    "phone": "+55 11 99999-9999",
    "email": "contato@restaurante.com"
  }'
```

### 4.2 List Restaurants

```bash
curl http://localhost:3001/api/restaurants \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4.3 Get Restaurant by Slug (Public)

```bash
curl http://localhost:3001/api/restaurants/slug/restaurante-teste
```

### 4.4 Update Restaurant

```bash
curl -X PUT http://localhost:3001/api/restaurants/RESTAURANT_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurante Atualizado"
  }'
```

---

## 5. Customer Endpoints

### 5.1 Create Customer

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "RESTAURANT_ID",
    "full_name": "João Silva",
    "phone_whatsapp": "+55 11 98888-8888",
    "email": "joao@example.com",
    "birth_date": "1990-01-15"
  }'
```

### 5.2 List Customers

```bash
curl "http://localhost:3001/api/customers?restaurant_id=RESTAURANT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 6. Testing with Postman or Insomnia

I recommend using Postman or Insomnia for easier testing. Here's a quick setup:

1. Create a new collection
2. Add environment variable `baseUrl` = `http://localhost:3001`
3. Add environment variable `token` = (will be filled after login)
4. Create requests for each endpoint

Would you like me to create a Postman collection file?

