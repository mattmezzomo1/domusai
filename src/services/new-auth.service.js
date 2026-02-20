/**
 * New Auth Service - Serviço de autenticação usando nossa API
 */

import { apiClient } from '@/api/apiClient';

/**
 * Service de autenticação com nossa API
 */
export const newAuthService = {
  /**
   * Registra um novo usuário
   */
  register: async (email, password, fullName) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName
      });

      // Salva o token
      if (response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  /**
   * Faz login com email e senha
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });

      // Salva o token
      if (response.token) {
        apiClient.setToken(response.token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Faz logout do usuário
   */
  logout: async (redirectUrl) => {
    // Com JWT, o logout é client-side (apenas remove o token)
    // Não precisa chamar a API
    apiClient.clearToken();

    // Redireciona se necessário
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      // Se não tem redirectUrl, redireciona para login
      window.location.href = '/login';
    }
  },

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated: async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        return false;
      }

      // Tenta obter os dados do usuário
      await apiClient.get('/auth/me');
      return true;
    } catch (error) {
      // Se falhar, remove o token inválido
      apiClient.clearToken();
      return false;
    }
  },

  /**
   * Obtém os dados do usuário atual
   */
  me: async () => {
    try {
      const user = await apiClient.get('/auth/me');
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  /**
   * Atualiza dados do usuário atual
   */
  updateMe: async (data) => {
    try {
      const user = await apiClient.put('/auth/me', data);
      return user;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  /**
   * Envia email de reset de senha
   */
  resetPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { email });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Redireciona para a página de login
   * No nosso caso, vamos criar uma página de login própria
   */
  redirectToLogin: (returnUrl) => {
    // Remove o token
    apiClient.clearToken();

    // Se já estamos na página de login, não redireciona novamente (evita loop)
    if (window.location.pathname === '/login') {
      return;
    }

    // Se o returnUrl é a própria página de login, usa '/' como fallback
    const safeReturnUrl = returnUrl && !returnUrl.includes('/login') ? returnUrl : '/';

    // Redireciona para a página de login
    const loginUrl = `/login${safeReturnUrl !== '/' ? `?returnUrl=${encodeURIComponent(safeReturnUrl)}` : ''}`;
    window.location.href = loginUrl;
  }
};

