# Esquema do Banco de Dados - Domus AI

Este documento descreve a estrutura completa do banco de dados MariaDB, incluindo todas as tabelas, campos, tipos de dados e relacionamentos.

## Tabelas

### 1. users (Usuários)

Armazena informações dos usuários do sistema.

| Campo        | Tipo         | Nulo | Padrão      | Descrição                           |
|--------------|--------------|------|-------------|-------------------------------------|
| id           | VARCHAR(36)  | NÃO  | UUID        | Identificador único (PK)            |
| email        | VARCHAR(255) | NÃO  | -           | Email do usuário (UNIQUE)           |
| password     | VARCHAR(255) | NÃO  | -           | Senha hash (bcrypt)                 |
| full_name    | VARCHAR(255) | NÃO  | -           | Nome completo                       |
| role         | ENUM         | NÃO  | 'USER'      | Papel: 'USER' ou 'ADMIN'            |
| avatar_url   | VARCHAR(500) | SIM  | NULL        | URL do avatar                       |
| created_date | DATETIME     | NÃO  | NOW()       | Data de criação                     |
| updated_date | DATETIME     | NÃO  | NOW()       | Data de atualização                 |

**Índices:**
- PRIMARY KEY: `id`
- UNIQUE: `email`

---

### 2. subscriptions (Assinaturas)

Armazena as assinaturas dos usuários.

| Campo                  | Tipo         | Nulo | Padrão | Descrição                              |
|------------------------|--------------|------|--------|----------------------------------------|
| id                     | VARCHAR(36)  | NÃO  | UUID   | Identificador único (PK)               |
| user_email             | VARCHAR(255) | NÃO  | -      | Email do usuário (FK)                  |
| plan_type              | ENUM         | NÃO  | -      | 'DOMUS_FREE' ou 'DOMUS_PAID'           |
| status                 | ENUM         | NÃO  | -      | Status da assinatura                   |
| stripe_customer_id     | VARCHAR(255) | SIM  | NULL   | ID do cliente no Stripe                |
| stripe_subscription_id | VARCHAR(255) | SIM  | NULL   | ID da assinatura no Stripe             |
| current_period_start   | DATETIME     | NÃO  | -      | Início do período atual                |
| current_period_end     | DATETIME     | NÃO  | -      | Fim do período atual                   |
| cancelled_at           | DATETIME     | SIM  | NULL   | Data de cancelamento                   |
| created_date           | DATETIME     | NÃO  | NOW()  | Data de criação                        |
| updated_date           | DATETIME     | NÃO  | NOW()  | Data de atualização                    |

**Enums:**
- `plan_type`: 'DOMUS_FREE', 'DOMUS_PAID'
- `status`: 'ACTIVE', 'TRIAL', 'CANCELLED', 'PAST_DUE'

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `user_email`
- INDEX: `status`

**Relacionamentos:**
- `user_email` → `users.email` (CASCADE)

---

### 3. restaurants (Restaurantes)

Armazena informações dos restaurantes.

| Campo           | Tipo         | Nulo | Padrão              | Descrição                    |
|-----------------|--------------|------|---------------------|------------------------------|
| id              | VARCHAR(36)  | NÃO  | UUID                | Identificador único (PK)     |
| owner_email     | VARCHAR(255) | NÃO  | -                   | Email do proprietário (FK)   |
| name            | VARCHAR(255) | NÃO  | -                   | Nome do restaurante          |
| slug            | VARCHAR(255) | NÃO  | -                   | Slug único (UNIQUE)          |
| phone           | VARCHAR(20)  | NÃO  | -                   | Telefone                     |
| address         | VARCHAR(500) | NÃO  | -                   | Endereço completo            |
| total_capacity  | INT          | NÃO  | -                   | Capacidade total             |
| timezone        | VARCHAR(50)  | NÃO  | 'America/Sao_Paulo' | Fuso horário                 |
| public          | BOOLEAN      | NÃO  | TRUE                | Visível publicamente         |
| operating_hours | JSON         | SIM  | NULL                | Horários de funcionamento    |
| created_date    | DATETIME     | NÃO  | NOW()               | Data de criação              |
| updated_date    | DATETIME     | NÃO  | NOW()               | Data de atualização          |

**Índices:**
- PRIMARY KEY: `id`
- UNIQUE: `slug`
- INDEX: `owner_email`

**Relacionamentos:**
- `owner_email` → `users.email` (CASCADE)

---

### 4. customers (Clientes)

Armazena informações dos clientes dos restaurantes.

| Campo              | Tipo          | Nulo | Padrão | Descrição                    |
|--------------------|---------------|------|--------|------------------------------|
| id                 | VARCHAR(36)   | NÃO  | UUID   | Identificador único (PK)     |
| restaurant_id      | VARCHAR(36)   | NÃO  | -      | ID do restaurante (FK)       |
| owner_email        | VARCHAR(255)  | NÃO  | -      | Email do proprietário        |
| full_name          | VARCHAR(255)  | NÃO  | -      | Nome completo                |
| phone_whatsapp     | VARCHAR(20)   | NÃO  | -      | Telefone/WhatsApp            |
| email              | VARCHAR(255)  | SIM  | NULL   | Email do cliente             |
| birth_date         | DATE          | SIM  | NULL   | Data de nascimento           |
| total_reservations | INT           | NÃO  | 0      | Total de reservas            |
| total_spent        | DECIMAL(10,2) | NÃO  | 0.00   | Total gasto                  |
| created_date       | DATETIME      | NÃO  | NOW()  | Data de criação              |
| updated_date       | DATETIME      | NÃO  | NOW()  | Data de atualização          |

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `restaurant_id`
- INDEX: `phone_whatsapp`
- INDEX: `email`

**Relacionamentos:**
- `restaurant_id` → `restaurants.id` (CASCADE)

---

### 5. environments (Ambientes)

Armazena os ambientes/áreas dos restaurantes.

| Campo         | Tipo         | Nulo | Padrão | Descrição                |
|---------------|--------------|------|--------|--------------------------|
| id            | VARCHAR(36)  | NÃO  | UUID   | Identificador único (PK) |
| restaurant_id | VARCHAR(36)  | NÃO  | -      | ID do restaurante (FK)   |
| owner_email   | VARCHAR(255) | NÃO  | -      | Email do proprietário    |
| name          | VARCHAR(255) | NÃO  | -      | Nome do ambiente         |
| capacity      | INT          | SIM  | NULL   | Capacidade do ambiente   |
| created_date  | DATETIME     | NÃO  | NOW()  | Data de criação          |
| updated_date  | DATETIME     | NÃO  | NOW()  | Data de atualização      |

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `restaurant_id`

**Relacionamentos:**
- `restaurant_id` → `restaurants.id` (CASCADE)

---

### 6. tables (Mesas)

Armazena as mesas dos restaurantes.

| Campo          | Tipo         | Nulo | Padrão      | Descrição                |
|----------------|--------------|------|-------------|--------------------------|
| id             | VARCHAR(36)  | NÃO  | UUID        | Identificador único (PK) |
| restaurant_id  | VARCHAR(36)  | NÃO  | -           | ID do restaurante (FK)   |
| owner_email    | VARCHAR(255) | NÃO  | -           | Email do proprietário    |
| name           | VARCHAR(100) | NÃO  | -           | Nome/número da mesa      |
| seats          | INT          | NÃO  | -           | Número de lugares        |
| environment_id | VARCHAR(36)  | SIM  | NULL        | ID do ambiente (FK)      |
| is_active      | BOOLEAN      | NÃO  | TRUE        | Mesa ativa               |
| status         | ENUM         | NÃO  | 'AVAILABLE' | Status da mesa           |
| position_x     | INT          | SIM  | NULL        | Posição X no mapa        |
| position_y     | INT          | SIM  | NULL        | Posição Y no mapa        |
| created_date   | DATETIME     | NÃO  | NOW()       | Data de criação          |
| updated_date   | DATETIME     | NÃO  | NOW()       | Data de atualização      |

**Enums:**
- `status`: 'AVAILABLE', 'UNAVAILABLE', 'BLOCKED'

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `restaurant_id`
- INDEX: `environment_id`
- INDEX: `status`

**Relacionamentos:**
- `restaurant_id` → `restaurants.id` (CASCADE)
- `environment_id` → `environments.id` (SET NULL)

---

### 7. shifts (Turnos)

Armazena os turnos de atendimento dos restaurantes.

| Campo                   | Tipo         | Nulo | Padrão | Descrição                       |
|-------------------------|--------------|------|--------|---------------------------------|
| id                      | VARCHAR(36)  | NÃO  | UUID   | Identificador único (PK)        |
| restaurant_id           | VARCHAR(36)  | NÃO  | -      | ID do restaurante (FK)          |
| owner_email             | VARCHAR(255) | NÃO  | -      | Email do proprietário           |
| name                    | VARCHAR(100) | NÃO  | -      | Nome do turno                   |
| start_time              | VARCHAR(5)   | NÃO  | -      | Horário início (HH:mm)          |
| end_time                | VARCHAR(5)   | NÃO  | -      | Horário fim (HH:mm)             |
| slot_interval_minutes   | INT          | NÃO  | 15     | Intervalo entre slots (minutos) |
| default_dwell_minutes   | INT          | NÃO  | 90     | Tempo padrão de permanência     |
| default_buffer_minutes  | INT          | NÃO  | 10     | Tempo de buffer entre reservas  |
| max_capacity            | INT          | SIM  | NULL   | Capacidade máxima do turno      |
| days_of_week            | JSON         | NÃO  | -      | Dias da semana (array 0-6)      |
| active                  | BOOLEAN      | NÃO  | TRUE   | Turno ativo                     |
| created_date            | DATETIME     | NÃO  | NOW()  | Data de criação                 |
| updated_date            | DATETIME     | NÃO  | NOW()  | Data de atualização             |

**Índices:**
- PRIMARY KEY: `id`
- INDEX: `restaurant_id`
- INDEX: `active`

**Relacionamentos:**
- `restaurant_id` → `restaurants.id` (CASCADE)

---

### 8. reservations (Reservas)

Armazena as reservas dos clientes.

| Campo            | Tipo         | Nulo | Padrão    | Descrição                    |
|------------------|--------------|------|-----------|------------------------------|
| id               | VARCHAR(36)  | NÃO  | UUID      | Identificador único (PK)     |
| restaurant_id    | VARCHAR(36)  | NÃO  | -         | ID do restaurante (FK)       |
| owner_email      | VARCHAR(255) | NÃO  | -         | Email do proprietário        |
| customer_id      | VARCHAR(36)  | NÃO  | -         | ID do cliente (FK)           |
| reservation_code | VARCHAR(50)  | NÃO  | -         | Código da reserva (UNIQUE)   |
| date             | DATE         | NÃO  | -         | Data da reserva              |
| shift_id         | VARCHAR(36)  | NÃO  | -         | ID do turno (FK)             |
| slot_time        | VARCHAR(5)   | NÃO  | -         | Horário do slot (HH:mm)      |
| party_size       | INT          | NÃO  | -         | Número de pessoas            |
| table_id         | VARCHAR(36)  | NÃO  | -         | ID da mesa principal (FK)    |
| linked_tables    | JSON         | NÃO  | -         | Array de IDs de mesas        |
| environment_id   | VARCHAR(36)  | SIM  | NULL      | ID do ambiente (FK)          |
| status           | ENUM         | NÃO  | 'PENDING' | Status da reserva            |
| source           | ENUM         | NÃO  | -         | Origem: 'PHONE' ou 'ONLINE'  |
| notes            | TEXT         | SIM  | NULL      | Observações                  |
| created_date     | DATETIME     | NÃO  | NOW()     | Data de criação              |
| updated_date     | DATETIME     | NÃO  | NOW()     | Data de atualização          |

**Enums:**
- `status`: 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'
- `source`: 'PHONE', 'ONLINE'

**Índices:**
- PRIMARY KEY: `id`
- UNIQUE: `reservation_code`
- INDEX: `restaurant_id`
- INDEX: `customer_id`
- INDEX: `date`
- INDEX: `status`
- INDEX: `shift_id`
- INDEX: `table_id`

**Relacionamentos:**
- `restaurant_id` → `restaurants.id` (CASCADE)
- `customer_id` → `customers.id` (CASCADE)
- `table_id` → `tables.id` (CASCADE)
- `shift_id` → `shifts.id` (CASCADE)
- `environment_id` → `environments.id` (SET NULL)

---

## Diagrama de Relacionamentos

```
users (1) ──────< (N) restaurants
  │                      │
  │                      ├──< customers
  │                      ├──< tables
  │                      ├──< environments
  │                      ├──< shifts
  │                      └──< reservations
  │
  └──< subscriptions

environments (1) ──< (N) tables
                      │
                      └──< reservations

customers (1) ──< (N) reservations
tables (1) ──< (N) reservations
shifts (1) ──< (N) reservations
```

---

## Notas Importantes

### 1. Tipos de Dados
- **VARCHAR(36)**: Usado para UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- **DATETIME**: Armazena data e hora no formato ISO 8601
- **DATE**: Armazena apenas a data (YYYY-MM-DD)
- **JSON**: Armazena dados estruturados em formato JSON
- **ENUM**: Valores predefinidos (mais eficiente que VARCHAR)
- **DECIMAL(10,2)**: Valores monetários com 2 casas decimais

### 2. Convenções de Nomenclatura
- **Tabelas**: Plural, snake_case (ex: `users`, `reservations`)
- **Campos**: Singular, snake_case (ex: `full_name`, `created_date`)
- **Chaves Estrangeiras**: `{tabela}_id` (ex: `restaurant_id`, `customer_id`)
- **Enums**: UPPER_CASE com underscore (ex: `DOMUS_FREE`, `PAST_DUE`)

### 3. Campos Padrão
Todas as tabelas possuem:
- `id`: Chave primária UUID
- `created_date`: Data de criação (auto-preenchido)
- `updated_date`: Data de atualização (auto-atualizado)

### 4. Relacionamentos e Integridade
- **CASCADE**: Ao deletar o pai, deleta os filhos
- **SET NULL**: Ao deletar o pai, define NULL nos filhos
- Todos os relacionamentos usam UUIDs para garantir unicidade

### 5. Índices
- Índices criados em:
  - Chaves primárias (automático)
  - Chaves estrangeiras (para performance em JOINs)
  - Campos frequentemente usados em filtros (status, date, email)
  - Campos únicos (email, slug, reservation_code)

### 6. Campos JSON
- `operating_hours`: Estrutura de horários por dia da semana
- `days_of_week`: Array de números [0-6] (domingo a sábado)
- `linked_tables`: Array de UUIDs de mesas vinculadas

### 7. Segurança
- Senhas armazenadas com hash bcrypt (nunca em texto plano)
- Tokens JWT para autenticação
- Validação de permissões no nível da aplicação

---

## Alinhamento Backend ↔ Banco de Dados

Este documento garante que:
1. O backend use exatamente os mesmos nomes de campos do banco
2. Os tipos de dados sejam compatíveis entre TypeScript e MariaDB
3. Não haja discrepâncias entre nomenclaturas (ex: backend chamando "x" o que o banco chama "y")
4. As validações do backend respeitem as constraints do banco

**Exemplo de Alinhamento:**
```typescript
// Backend DTO
interface CustomerCreateDTO {
  restaurant_id: string;      // ✅ Mesmo nome do banco
  full_name: string;          // ✅ Mesmo nome do banco
  phone_whatsapp: string;     // ✅ Mesmo nome do banco
  email?: string;             // ✅ Mesmo nome do banco
  birth_date?: string;        // ✅ Mesmo nome do banco
}

// Banco de Dados
CREATE TABLE customers (
  restaurant_id VARCHAR(36),  // ✅ Mesmo nome do DTO
  full_name VARCHAR(255),     // ✅ Mesmo nome do DTO
  phone_whatsapp VARCHAR(20), // ✅ Mesmo nome do DTO
  email VARCHAR(255),         // ✅ Mesmo nome do DTO
  birth_date DATE             // ✅ Mesmo nome do DTO
);
```

