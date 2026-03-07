# Configuração de Tracking - Facebook Pixel, Meta Conversions API e Google Tag Manager

## 📋 Visão Geral

Este sistema permite que os donos de restaurantes configurem tracking avançado para suas páginas de reserva online, integrando:

- **Facebook Pixel** - Rastreamento client-side de eventos
- **Meta Conversions API** - Rastreamento server-side para maior precisão
- **Google Tag Manager** - Gerenciamento centralizado de tags

## 🚀 Instalação

### 1. Executar Migração do Banco de Dados

Execute o script SQL para adicionar as colunas de tracking:

```bash
# No diretório backend
mysql -u seu_usuario -p seu_banco_de_dados < add_tracking_columns.sql
```

Ou execute manualmente:

```sql
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(255) DEFAULT NULL AFTER enable_modifications,
ADD COLUMN IF NOT EXISTS meta_conversion_api_token VARCHAR(500) DEFAULT NULL AFTER facebook_pixel_id,
ADD COLUMN IF NOT EXISTS gtm_container_id VARCHAR(255) DEFAULT NULL AFTER meta_conversion_api_token;

CREATE INDEX IF NOT EXISTS idx_restaurants_facebook_pixel ON restaurants(facebook_pixel_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_gtm_container ON restaurants(gtm_container_id);
```

### 2. Atualizar Schema do Prisma

```bash
cd backend
npx prisma generate
```

### 3. Reiniciar o Backend

```bash
cd backend
npm run dev
```

## 📱 Como Usar

### Para Donos de Restaurantes

1. Acesse **Configurações** → **Tracking**
2. Configure suas credenciais:

#### Facebook Pixel
- Acesse [Facebook Events Manager](https://www.facebook.com/business/help/952192354843755)
- Copie seu **Pixel ID** (ex: 1234567890123456)
- Cole no campo "Pixel ID"

#### Meta Conversions API
- No Facebook Events Manager, vá em **Settings** → **Conversions API**
- Gere um **Access Token**
- Cole no campo "Access Token"

#### Google Tag Manager
- Acesse [Google Tag Manager](https://tagmanager.google.com/)
- Copie seu **Container ID** (ex: GTM-XXXXXXX)
- Cole no campo "Container ID"

3. Clique em **Salvar Configurações**

## 📊 Eventos Rastreados

O sistema rastreia automaticamente os seguintes eventos durante o processo de reserva:

### Step 1 - Seleção de Detalhes
- **Evento:** `ViewContent`
- **Dados:** data, número de pessoas, turno, ambiente

### Step 2 - Seleção de Horário
- **Evento:** `AddToCart`
- **Dados:** horário selecionado, data, número de pessoas

### Step 3 - Dados Pessoais
- **Evento:** `InitiateCheckout`
- **Dados:** nome, email, telefone (com hash para privacidade)

### Conclusão da Reserva
- **Eventos:** `Purchase` + `Lead`
- **Dados:** código da reserva, número de pessoas, data, horário

## 🔒 Privacidade e GDPR

- Todos os dados pessoais são enviados de forma segura
- O Facebook Pixel usa **Advanced Matching** para melhor precisão
- Dados sensíveis são hasheados antes do envio
- Compatível com GDPR e LGPD

## 🧪 Como Testar

### Facebook Pixel
1. Instale a extensão [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/) no Chrome
2. Acesse sua página de reservas
3. Verifique se o pixel está disparando corretamente

### Google Tag Manager
1. Acesse o GTM e ative o modo **Preview**
2. Acesse sua página de reservas
3. Veja os eventos sendo disparados em tempo real

### Meta Conversions API
1. Acesse o Facebook Events Manager
2. Vá em **Test Events**
3. Verifique se os eventos server-side estão sendo recebidos

## 📈 Benefícios

- **Melhor Atribuição:** Rastreie de onde vêm suas reservas
- **Otimização de Anúncios:** Use dados de conversão para otimizar campanhas
- **Remarketing:** Crie audiências personalizadas
- **Analytics Avançado:** Entenda o comportamento dos usuários

## 🛠️ Arquitetura Técnica

### Frontend
- `src/services/tracking.service.js` - Serviço de tracking
- `src/components/settings/TrackingSettings.jsx` - Interface de configuração
- `src/pages/PublicBooking.jsx` - Integração nos steps de reserva
- `src/pages/BookingPublic.jsx` - Integração nos steps de reserva

### Backend
- `backend/prisma/schema.prisma` - Schema do banco de dados
- `backend/src/types/index.ts` - Tipos TypeScript
- `backend/add_tracking_columns.sql` - Script de migração

## 🔄 Fluxo de Dados

```
1. Usuário acessa página de reserva
   ↓
2. trackingService.initialize(restaurant)
   ↓
3. Scripts de tracking são carregados (FB Pixel, GTM)
   ↓
4. Usuário completa cada step
   ↓
5. Eventos são enviados para:
   - Facebook Pixel (client-side)
   - Google Tag Manager (client-side)
   - Meta Conversions API (server-side - futuro)
   ↓
6. Plataformas recebem e processam eventos
```

## 📝 Notas Importantes

- **Meta Conversions API:** Atualmente logado no console. Para produção, implemente endpoint backend para enviar eventos de forma segura.
- **Segurança:** Nunca exponha tokens de API no frontend em produção.
- **Performance:** Scripts são carregados de forma assíncrona para não impactar performance.

## 🆘 Suporte

Para dúvidas sobre configuração:
- Facebook Pixel: https://www.facebook.com/business/help/952192354843755
- Meta Conversions API: https://www.facebook.com/business/help/2041148702652965
- Google Tag Manager: https://support.google.com/tagmanager

