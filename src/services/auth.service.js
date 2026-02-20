/**
 * Auth Service - Camada de abstração para autenticação
 * Permite alternar entre nossa API, Base44 e autenticação mockada
 */

import { base44 } from '@/api/base44Client';
import { mockAuthService } from './mock-auth.service';
import { newAuthService } from './new-auth.service';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
const USE_NEW_API = import.meta.env.VITE_USE_NEW_API === 'true';

/**
 * Service de autenticação
 */
export const authService = {
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated: async () => {
    if (USE_MOCK) return mockAuthService.isAuthenticated();
    if (USE_NEW_API) return newAuthService.isAuthenticated();
    return base44.auth.isAuthenticated();
  },

  /**
   * Obtém os dados do usuário atual
   */
  me: async () => {
    if (USE_MOCK) return mockAuthService.me();
    if (USE_NEW_API) return newAuthService.me();
    return base44.auth.me();
  },

  /**
   * Faz logout do usuário
   */
  logout: (redirectUrl) => {
    if (USE_MOCK) return mockAuthService.logout(redirectUrl);
    if (USE_NEW_API) return newAuthService.logout(redirectUrl);
    return base44.auth.logout(redirectUrl);
  },

  /**
   * Redireciona para a página de login
   */
  redirectToLogin: (returnUrl) => {
    if (USE_MOCK) return mockAuthService.redirectToLogin(returnUrl);
    if (USE_NEW_API) return newAuthService.redirectToLogin(returnUrl);
    return base44.auth.redirectToLogin(returnUrl);
  },

  /**
   * Registra um novo usuário
   */
  register: async (email, password, fullName) => {
    if (USE_MOCK) return mockAuthService.register(email, password, fullName);
    if (USE_NEW_API) return newAuthService.register(email, password, fullName);
    throw new Error('Registro direto não disponível com Base44');
  },

  /**
   * Faz login
   */
  login: async (email, password) => {
    if (USE_MOCK) return mockAuthService.login(email, password);
    if (USE_NEW_API) return newAuthService.login(email, password);
    throw new Error('Login direto não disponível com Base44');
  },

  /**
   * Atualiza dados do usuário atual
   */
  updateMe: async (data) => {
    if (USE_MOCK) return mockAuthService.updateMe(data);
    if (USE_NEW_API) return newAuthService.updateMe(data);
    return base44.auth.updateMe(data);
  },

  /**
   * Envia email de reset de senha
   */
  resetPassword: async (email) => {
    if (USE_MOCK) return mockAuthService.resetPassword(email);
    if (USE_NEW_API) return newAuthService.resetPassword(email);
    return base44.auth.resetPassword(email);
  }
};

