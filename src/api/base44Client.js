import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const USE_NEW_API = import.meta.env.VITE_USE_NEW_API === 'true';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Create a client with authentication required
// In mock mode or when using new API, create a minimal client to avoid errors
export const base44 = (USE_MOCK || USE_NEW_API)
  ? {
      auth: {},
      entities: {},
      functions: {},
      analytics: {},
      appLogs: {},
      asServiceRole: { entities: {} }
    }
  : createClient({
      appId,
      token,
      functionsVersion,
      serverUrl: '',
      requiresAuth: false,
      appBaseUrl
    });
