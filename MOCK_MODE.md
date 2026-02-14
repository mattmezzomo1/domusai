# 🎭 Modo Mock - Frontend Desacoplado

Este projeto agora suporta **modo mock**, permitindo desenvolvimento frontend completamente independente do backend Base44.

## 🚀 Como Usar

### Ativar Modo Mock

1. Crie ou edite o arquivo `.env.local`:
```bash
VITE_USE_MOCK_DATA=true
```

2. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

Pronto! O frontend agora usa dados mockados armazenados no `localStorage`.

### Desativar Modo Mock (usar Base44 real)

1. Edite `.env.local`:
```bash
VITE_USE_MOCK_DATA=false
VITE_BASE44_APP_ID=seu_app_id
VITE_BASE44_APP_BASE_URL=sua_url_backend
```

2. Reinicie o servidor.

## 📁 Arquitetura

### Camada de Abstração

Todos os acessos a dados passam por **services** que abstraem a fonte:

```javascript
// ❌ ANTES (acoplado ao Base44)
const restaurants = await base44.entities.Restaurant.list();

// ✅ AGORA (desacoplado)
import { restaurantService } from '@/services/api.service';
const restaurants = await restaurantService.list();
```

### Services Disponíveis

- `authService` - Autenticação
- `restaurantService` - Restaurantes
- `reservationService` - Reservas
- `customerService` - Clientes
- `tableService` - Mesas
- `shiftService` - Turnos
- `subscriptionService` - Assinaturas
- `functionsService` - Functions/Backend

### Estrutura de Arquivos

```
src/
├── services/
│   ├── api.service.js          # Camada de abstração principal
│   ├── auth.service.js         # Serviço de autenticação
│   ├── mock-data.service.js    # Dados mockados + CRUD
│   └── mock-auth.service.js    # Autenticação mockada
```

## 🎨 Dados Mockados

### Dados Iniciais

O modo mock cria automaticamente:
- ✅ 1 Restaurante (Restaurante Domus)
- ✅ 6 Mesas (capacidades variadas)
- ✅ 2 Turnos (Almoço e Jantar)
- ✅ 5 Clientes de exemplo
- ✅ 20 Reservas (passadas, presentes e futuras)
- ✅ 1 Assinatura ativa

### Persistência

Os dados são salvos no `localStorage` do navegador:
- ✅ Alterações persistem entre reloads
- ✅ CRUD completo funciona (Create, Read, Update, Delete)
- ✅ Filtros e ordenação funcionam

### Reset de Dados

Para resetar os dados mockados:

```javascript
// No console do navegador:
localStorage.removeItem('domus_mock_data');
// Recarregue a página
```

Ou use a função utilitária:

```javascript
import { mockDataService } from '@/services/mock-data.service';
mockDataService.reset();
```

## 🔐 Autenticação Mock

### Auto-Login

Em modo mock, o sistema faz **auto-login** automaticamente com:
- Email: `admin@domus.com`
- Nome: `Admin Domus`
- Role: `admin`

### Sem Necessidade de Credenciais

Não é necessário fazer login manualmente. O sistema:
1. Detecta que está em modo mock
2. Cria um token mockado
3. Autentica automaticamente
4. Permite acesso a todas as páginas

## 🛠️ Desenvolvimento

### Adicionar Novos Dados Mock

Edite `src/services/mock-data.service.js`:

```javascript
const createInitialMockData = () => {
  // Adicione seus dados aqui
  const data = {
    restaurants: [...],
    // ... outros dados
  };
  return data;
};
```

### Simular Delays de Rede

Os services mockados já incluem delays realistas:

```javascript
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms
```

### Simular Erros

Você pode modificar os services para simular erros:

```javascript
create: async (data) => {
  if (data.name === 'ERROR') {
    throw new Error('Simulated error');
  }
  // ... resto do código
}
```

## ✅ Vantagens do Modo Mock

1. **Desenvolvimento Offline** - Trabalhe sem internet
2. **Sem Dependências** - Não precisa do backend rodando
3. **Dados Controlados** - Teste cenários específicos
4. **Velocidade** - Sem latência de rede
5. **Isolamento** - Não afeta dados de produção
6. **Prototipagem Rápida** - Teste UIs rapidamente

## 🔄 Migração de Código Existente

Para migrar código que usa Base44 diretamente:

### 1. Importar Services

```javascript
// Antes
import { base44 } from '@/api/base44Client';

// Depois
import { restaurantService, reservationService } from '@/services/api.service';
```

### 2. Substituir Chamadas

```javascript
// Antes
const data = await base44.entities.Restaurant.list();

// Depois
const data = await restaurantService.list();
```

### 3. Autenticação

```javascript
// Antes
import { base44 } from '@/api/base44Client';
const user = await base44.auth.me();

// Depois
import { authService } from '@/services/auth.service';
const user = await authService.me();
```

### 4. Functions

```javascript
// Antes
await base44.functions.invoke('create-checkout', params);

// Depois
import { functionsService } from '@/services/api.service';
await functionsService.invoke('create-checkout', params);
```

## 📝 Notas

- O modo mock é apenas para **desenvolvimento frontend**
- Functions retornam respostas simuladas (não executam lógica real)
- Stripe checkout retorna URL mockada
- Não use em produção (sempre use `VITE_USE_MOCK_DATA=false`)

## 🐛 Troubleshooting

### Dados não aparecem?
- Verifique se `VITE_USE_MOCK_DATA=true` no `.env.local`
- Reinicie o servidor (`npm run dev`)
- Limpe o localStorage e recarregue

### Autenticação não funciona?
- Verifique o console para erros
- Limpe `localStorage.removeItem('mock_token')`
- Recarregue a página

### Mudanças não persistem?
- Verifique se o localStorage está habilitado
- Verifique se não está em modo anônimo/privado

