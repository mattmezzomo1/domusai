# 🔍 Review de Integração Frontend ↔ Backend

## Data: 2026-02-14
## Status: ⚠️ INCONSISTÊNCIAS CRÍTICAS ENCONTRADAS

---

## 1. ✅ API Client (`src/api/apiClient.js`)

### Status: **CORRETO** ✅

O API Client está bem implementado:
- ✅ Gerenciamento de tokens JWT correto
- ✅ Headers de autenticação automáticos
- ✅ Tratamento de erros adequado
- ✅ Métodos HTTP completos (GET, POST, PUT, PATCH, DELETE)
- ✅ Serialização JSON correta

**Nenhuma alteração necessária.**

---

## 2. ⚠️ PROBLEMA CRÍTICO: Componentes ainda usam Base44 diretamente

### Componentes Afetados:

Todos os componentes de formulário ainda fazem chamadas diretas ao `base44` ao invés de usar os serviços abstraídos:

#### ❌ `src/components/crm/AddCustomerDialog.jsx`
```javascript
// LINHA 3: Importa base44 diretamente
import { base44 } from "@/api/base44Client";

// LINHA 25: Usa base44 diretamente
queryFn: () => base44.entities.Restaurant.list(),

// LINHA 40: Usa base44 diretamente
return base44.entities.Customer.create({
```

**PROBLEMA**: Deveria usar `customerService` de `@/services/api.service`

---

#### ❌ `src/components/reservations/AddReservationDialog.jsx`
```javascript
// LINHA 2: Importa base44 diretamente
import { base44 } from "@/api/base44Client";

// LINHA 36: Usa base44 diretamente
queryFn: () => base44.entities.Restaurant.list(),

// LINHA 46: Usa base44 diretamente
return await base44.entities.Customer.filter({ restaurant_id: restaurant.id });
```

**PROBLEMA**: Deveria usar `reservationService`, `customerService`, etc.

---

#### ❌ `src/components/settings/TablesSettings.jsx`
```javascript
// LINHA 2: Importa base44 diretamente
import { base44 } from "@/api/base44Client";

// LINHA 37: Usa base44 diretamente
queryFn: () => base44.entities.Restaurant.list(),

// LINHA 66: Usa base44 diretamente
return base44.entities.Table.create({
```

**PROBLEMA**: Deveria usar `tableService` de `@/services/api.service`

---

#### ❌ `src/components/settings/ShiftsSettings.jsx`
```javascript
// LINHA 2: Importa base44 diretamente
import { base44 } from "@/api/base44Client";

// LINHA 37: Usa base44 diretamente
queryFn: () => base44.entities.Restaurant.list(),

// LINHA 56: Usa base44 diretamente
return base44.entities.Shift.create({
```

**PROBLEMA**: Deveria usar `shiftService` de `@/services/api.service`

---

#### ❌ `src/components/settings/RestaurantSettings.jsx`
```javascript
// LINHA 2: Importa base44 diretamente
import { base44 } from "@/api/base44Client";

// LINHA 39: Usa base44 diretamente
queryFn: () => base44.entities.Restaurant.list(),
```

**PROBLEMA**: Deveria usar `restaurantService` de `@/services/api.service`

---

## 3. ⚠️ Inconsistências de Campos

### 3.1 ✅ Clientes (Customers) - CORRETO

**`AddCustomerDialog.jsx` (linhas 15-20)**:
```javascript
{
  full_name: '',        // ✅ CORRETO
  phone_whatsapp: '',   // ✅ CORRETO
  email: '',            // ✅ CORRETO
  birth_date: '',       // ✅ CORRETO
  notes: ''
}
```

**PROBLEMA**: Campo `birth_date` está sendo enviado como string 'YYYY-MM-DD' (linha 114):
```javascript
<Input
  id="birth_date"
  type="date"
  value={formData.birth_date}
  onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
/>
```

**SOLUÇÃO NECESSÁRIA**: Converter para ISO-8601 completo antes de enviar:
```javascript
birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null
```

---

### 3.2 ✅ Mesas (Tables) - CORRETO

**`TablesSettings.jsx` (linha 25)**:
```javascript
{ name: '', seats: '', environment_id: '' }  // ✅ CORRETO
```

Os campos estão corretos (`name` e `seats`), mas o componente usa `base44` diretamente.

---

### 3.3 ✅ Turnos (Shifts) - CORRETO

**`ShiftsSettings.jsx` (linhas 24-33)**:
```javascript
{
  name: '',
  start_time: '',
  end_time: '',
  slot_interval_minutes: '15',
  default_dwell_minutes: '90',
  default_buffer_minutes: '10',
  max_capacity: '',
  days_of_week: [0, 1, 2, 3, 4, 5, 6]  // ✅ CORRETO - Array de números
}
```

Campos estão corretos, mas usa `base44` diretamente.

---

### 3.4 ⚠️ Reservas (Reservations) - PROBLEMA

**`AddReservationDialog.jsx` (linhas 23-30)**:
```javascript
{
  customer_id: '',
  date: '',           // ⚠️ PROBLEMA: Formato de data
  shift_id: '',
  slot_time: '',
  party_size: '',     // ✅ CORRETO
  notes: ''
}
```

**PROBLEMA**: Campo `date` precisa ser convertido para ISO-8601 completo antes de enviar.

---

## 4. 📋 Lista Completa de Arquivos que Usam Base44

### Componentes (src/components/):
- [ ] `crm/AddCustomerDialog.jsx`
- [ ] `crm/EditCustomerDialog.jsx`
- [ ] `reservations/AddReservationDialog.jsx`
- [ ] `reservations/EditReservationDialog.jsx`
- [ ] `settings/TablesSettings.jsx`
- [ ] `settings/ShiftsSettings.jsx`
- [ ] `settings/RestaurantSettings.jsx`
- [ ] `settings/EnvironmentsSettings.jsx`
- [ ] `subscription/SubscriptionGuard.jsx`
- [ ] `admin/AdminGuard.jsx` (provavelmente)

### Páginas (src/pages/):
- [ ] `BookingPublic.jsx`
- [ ] `PublicBooking.jsx`
- [ ] `AdminPayments.jsx`
- [ ] `Reservations.jsx`
- [ ] `Customers.jsx`
- [ ] `Dashboard.jsx` (provavelmente)
- [ ] `Settings.jsx` (provavelmente)

### Contextos e Utilitários (src/lib/):
- [ ] `AuthContext.jsx` - **CRÍTICO** (gerencia autenticação)
- [ ] `NavigationTracker.jsx`

### Serviços (src/services/):
- ✅ `api.service.js` - **JÁ CORRIGIDO**
- ✅ `auth.service.js` - **JÁ CORRIGIDO**

---

## 5. 📋 Checklist de Correções Necessárias

### Prioridade CRÍTICA (Bloqueante):

- [ ] **`AuthContext.jsx`** - Atualizar para usar `authService` quando `USE_NEW_API=true`
- [ ] **Componentes de Formulário** - Substituir todas as chamadas `base44` por serviços abstraídos

### Prioridade ALTA (Importante):

- [ ] **Páginas Públicas** - `BookingPublic.jsx` e `PublicBooking.jsx`
  - Estas páginas criam clientes e reservas diretamente
  - Precisam usar os serviços abstraídos
  - **ATENÇÃO**: Verificar formato de datas nestas páginas

### Prioridade MÉDIA (Importante):

- [ ] **Converter datas para ISO-8601 completo**
  - [ ] `AddCustomerDialog.jsx` - campo `birth_date`
  - [ ] `AddReservationDialog.jsx` - campo `date`
  - [ ] `BookingPublic.jsx` - campos `date` e `birth_date`
  - [ ] `PublicBooking.jsx` - campos `date` e `birth_date`
  - [ ] Qualquer outro formulário que envie datas

### Prioridade BAIXA (Melhorias):

- [ ] Adicionar validação de formatos de data
- [ ] Adicionar feedback visual de erros de API
- [ ] Adicionar loading states consistentes
- [ ] Atualizar `NavigationTracker.jsx` (se necessário)
- [ ] Atualizar `SubscriptionGuard.jsx`

---

## 6. 🔧 Exemplo de Correção

### ANTES (❌ Errado):
```javascript
import { base44 } from "@/api/base44Client";

const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => base44.entities.Customer.list(),
});
```

### DEPOIS (✅ Correto):
```javascript
import { customerService } from "@/services/api.service";

const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => customerService.list(),
});
```

---

## 7. 📊 Resumo

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| API Client | ✅ OK | Nenhuma |
| Serviços Abstraídos | ✅ OK | Nenhuma |
| **AuthContext** | ❌ CRÍTICO | Atualizar para usar authService |
| **Componentes** | ❌ CRÍTICO | Substituir base44 por serviços (20+ arquivos) |
| **Páginas Públicas** | ❌ CRÍTICO | Substituir base44 e converter datas |
| Formato de Datas | ⚠️ PROBLEMA | Converter para ISO-8601 (5+ arquivos) |
| Campos de Dados | ✅ OK | Nenhuma (campos corretos) |

### Estatísticas:
- **Total de arquivos afetados**: ~25 arquivos
- **Arquivos críticos**: 3 (AuthContext, BookingPublic, PublicBooking)
- **Componentes de formulário**: ~10 arquivos
- **Páginas**: ~7 arquivos

---

## 8. 🎯 Próximos Passos Recomendados

### Fase 1 - Crítico (Fazer AGORA):
1. **Atualizar `AuthContext.jsx`** para usar `authService` quando `USE_NEW_API=true`
2. **Testar login** com a nova API
3. **Verificar se a autenticação funciona** em todas as páginas

### Fase 2 - Alta Prioridade:
1. **Atualizar componentes de formulário** (um por vez):
   - `AddCustomerDialog.jsx`
   - `AddReservationDialog.jsx`
   - `TablesSettings.jsx`
   - `ShiftsSettings.jsx`
   - `RestaurantSettings.jsx`
2. **Adicionar conversão de datas** para ISO-8601 em todos os formulários
3. **Testar cada formulário** após a atualização

### Fase 3 - Média Prioridade:
1. **Atualizar páginas públicas** (`BookingPublic.jsx`, `PublicBooking.jsx`)
2. **Atualizar outras páginas** que usam base44
3. **Testar fluxo completo** de reserva pública

### Fase 4 - Baixa Prioridade:
1. Atualizar `SubscriptionGuard.jsx`
2. Atualizar `NavigationTracker.jsx`
3. Adicionar testes automatizados

---

## 9. ⚠️ ATENÇÃO ESPECIAL

### `AuthContext.jsx` - CRÍTICO
Este arquivo é o **coração da autenticação** do sistema. Ele precisa ser atualizado com muito cuidado:

**Problema atual**: Usa `base44.auth` diretamente e verifica configurações do app Base44.

**Solução**: Quando `USE_NEW_API=true`, deve:
1. Usar `authService.isAuthenticated()` ao invés de `base44.auth.isAuthenticated()`
2. Usar `authService.me()` ao invés de `base44.auth.me()`
3. **NÃO** verificar `appPublicSettings` (isso é específico do Base44)
4. Simplificar o fluxo de autenticação para apenas validar o token JWT

### Páginas Públicas - ALTA PRIORIDADE
`BookingPublic.jsx` e `PublicBooking.jsx` são usadas por clientes finais para fazer reservas.

**Problemas**:
1. Criam clientes diretamente com `base44.entities.Customer.create()`
2. Criam reservas diretamente com `base44.entities.Reservation.create()`
3. Podem estar enviando datas em formato errado

**Impacto**: Se não funcionarem, clientes não conseguem fazer reservas online.

---

## 10. 🛠️ Ferramentas de Ajuda

### Script para Encontrar Todos os Usos de base44:
```bash
# No terminal (PowerShell)
Get-ChildItem -Path src -Recurse -Filter *.jsx | Select-String "base44" | Select-Object Path, LineNumber, Line
```

### Padrão de Substituição:
```javascript
// ANTES
import { base44 } from "@/api/base44Client";
const data = await base44.entities.Restaurant.list();

// DEPOIS
import { restaurantService } from "@/services/api.service";
const data = await restaurantService.list();
```

### Conversão de Datas:
```javascript
// ANTES
birth_date: formData.birth_date  // '2000-01-15'

// DEPOIS
birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : null
// '2000-01-15T00:00:00.000Z'
```


