# Notas de Integração Frontend ↔ Backend

## ✅ Integração Concluída

### Arquivos Criados

1. **`src/api/apiClient.js`** - Cliente HTTP para comunicação com o backend
   - Gerenciamento de tokens JWT
   - Headers de autenticação automáticos
   - Tratamento de erros

2. **`src/services/new-auth.service.js`** - Serviço de autenticação
   - Login com email/senha
   - Logout
   - Get current user (me)
   - Update user
   - Reset password

3. **`src/services/new-api.service.js`** - Serviços de API
   - Restaurant service
   - Reservation service
   - Customer service
   - Table service
   - Shift service
   - Subscription service
   - Environment service
   - Functions service (admin)
   - Payment service

4. **`src/pages/Login.jsx`** - Página de login
   - Formulário de login
   - Tratamento de erros
   - Redirecionamento após login

5. **`FIELD_MAPPING.md`** - Documentação de mapeamento de campos

### Arquivos Modificados

1. **`src/services/api.service.js`** - Adicionado suporte à nova API
2. **`src/services/auth.service.js`** - Adicionado suporte à nova API
3. **`.env.local`** - Configurado para usar a nova API
4. **`.env.local.example`** - Atualizado com novas variáveis

---

## ⚠️ Incompatibilidades Identificadas

### 1. **Mesas (Tables)**

**Mock Data usa:**
```javascript
{
  number: '1',      // ❌ Campo errado
  capacity: 2       // ❌ Campo errado
}
```

**Backend espera:**
```javascript
{
  name: 'Mesa 1',   // ✅ Campo correto
  seats: 2          // ✅ Campo correto
}
```

**Solução**: O frontend precisa enviar `name` e `seats` ao criar/atualizar mesas.

---

### 2. **Clientes (Customers)**

**Mock Data usa:**
```javascript
{
  name: 'João Silva',  // ❌ Campo errado
  phone_whatsapp: '11987654321'  // ✅ Correto
}
```

**Backend espera:**
```javascript
{
  full_name: 'João Silva',  // ✅ Campo correto
  phone_whatsapp: '11987654321'  // ✅ Correto
}
```

**Solução**: O frontend precisa enviar `full_name` ao invés de `name`.

---

### 3. **Reservas (Reservations)**

**Mock Data usa:**
```javascript
{
  date: '2026-02-15',  // ❌ Formato errado
  guests: 4,           // ❌ Campo errado
  code: 'RES0001'      // ✅ Correto (mas gerado manualmente)
}
```

**Backend espera:**
```javascript
{
  date: '2026-02-15T00:00:00.000Z',  // ✅ ISO-8601 completo
  party_size: 4,                      // ✅ Campo correto
  reservation_code: 'RES0001'         // ✅ Gerado automaticamente
}
```

**Solução**: 
- Converter datas para ISO-8601 completo
- Usar `party_size` ao invés de `guests`
- Não enviar `reservation_code` (é gerado pelo backend)

---

### 4. **Status de Reservas**

**Mock Data usa:**
```javascript
status: 'confirmed' | 'pending' | 'cancelled' | 'completed'  // ❌ Lowercase
```

**Backend espera:**
```javascript
status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED'  // ✅ Uppercase
```

**Solução**: Converter status para uppercase.

---

### 5. **Tipo de Plano (Subscriptions)**

**Mock Data usa:**
```javascript
plan_type: 'paid' | 'free'  // ❌ Valores errados
```

**Backend espera:**
```javascript
plan_type: 'DOMUS_PAID' | 'DOMUS_FREE'  // ✅ Valores corretos
```

**Solução**: Usar os valores corretos do enum.

---

## 🔧 Próximos Passos

### 1. Testar a Integração

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 2. Acessar a Aplicação

- URL: http://localhost:5173 (ou porta do Vite)
- Login: admin@domusai.com
- Senha: admin123

### 3. Verificar Funcionalidades

- [ ] Login funciona
- [ ] Listagem de restaurantes
- [ ] Criação de clientes (verificar campo `full_name`)
- [ ] Criação de mesas (verificar campos `name` e `seats`)
- [ ] Criação de reservas (verificar formato de data e `party_size`)
- [ ] Listagem de turnos
- [ ] Logout

### 4. Ajustes Necessários

Se houver erros, verificar:

1. **Formulários de criação/edição** - Garantir que usam os campos corretos
2. **Conversão de dados** - Adicionar transformações se necessário
3. **Validações** - Ajustar validações para os novos formatos

---

## 📝 Variáveis de Ambiente

### Desenvolvimento Local (Nova API)

```env
VITE_USE_MOCK_DATA=false
VITE_USE_NEW_API=true
VITE_API_BASE_URL=http://localhost:3001/api
```

### Desenvolvimento com Mock

```env
VITE_USE_MOCK_DATA=true
VITE_USE_NEW_API=false
```

### Produção com Base44

```env
VITE_USE_MOCK_DATA=false
VITE_USE_NEW_API=false
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

---

## 🎯 Checklist de Integração

- [x] Cliente HTTP criado (`apiClient.js`)
- [x] Serviço de autenticação criado (`new-auth.service.js`)
- [x] Serviços de API criados (`new-api.service.js`)
- [x] Página de login criada (`Login.jsx`)
- [x] Variáveis de ambiente configuradas
- [x] Documentação de campos criada (`FIELD_MAPPING.md`)
- [ ] Rota de login adicionada ao router
- [ ] Testes de integração realizados
- [ ] Ajustes de campos nos formulários
- [ ] Conversão de formatos de data implementada
- [ ] AuthContext atualizado para nova API

