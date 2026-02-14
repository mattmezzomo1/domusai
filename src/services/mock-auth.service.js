/**
 * Mock Auth Service - Autenticação simulada para desenvolvimento
 */

const MOCK_USER_KEY = 'mock_user';
const MOCK_TOKEN_KEY = 'mock_token';

// Usuário mockado padrão
const DEFAULT_MOCK_USER = {
  id: 'user_mock_001',
  email: 'admin@domus.com',
  full_name: 'Admin Domus',
  role: 'admin',
  created_date: new Date('2024-01-01').toISOString(),
  avatar_url: null
};

/**
 * Mock Auth Service
 */
export const mockAuthService = {
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated: async () => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const token = localStorage.getItem(MOCK_TOKEN_KEY);
    return !!token;
  },

  /**
   * Obtém os dados do usuário atual
   */
  me: async () => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const token = localStorage.getItem(MOCK_TOKEN_KEY);
    if (!token) {
      throw new Error('Not authenticated');
    }

    const userStr = localStorage.getItem(MOCK_USER_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }

    // Se não tem usuário salvo, retorna o padrão e salva
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(DEFAULT_MOCK_USER));
    return DEFAULT_MOCK_USER;
  },

  /**
   * Faz login do usuário
   */
  login: async (email, password) => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    // Aceita qualquer email/senha para desenvolvimento
    const user = {
      ...DEFAULT_MOCK_USER,
      email: email || DEFAULT_MOCK_USER.email
    };

    const token = 'mock_token_' + Date.now();
    
    localStorage.setItem(MOCK_TOKEN_KEY, token);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));

    return user;
  },

  /**
   * Faz logout do usuário
   */
  logout: (redirectUrl) => {
    localStorage.removeItem(MOCK_TOKEN_KEY);
    localStorage.removeItem(MOCK_USER_KEY);

    // Se tem URL de redirect, redireciona
    if (redirectUrl) {
      // Em modo mock, apenas recarrega a página
      window.location.reload();
    }
  },

  /**
   * Redireciona para a página de login
   */
  redirectToLogin: (returnUrl) => {
    // Em modo mock, faz auto-login
    console.log('[Mock Auth] Auto-login ativado');
    
    const token = 'mock_token_' + Date.now();
    localStorage.setItem(MOCK_TOKEN_KEY, token);
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(DEFAULT_MOCK_USER));
    
    // Recarrega a página
    window.location.reload();
  },

  /**
   * Limpa todos os dados de autenticação
   */
  clear: () => {
    localStorage.removeItem(MOCK_TOKEN_KEY);
    localStorage.removeItem(MOCK_USER_KEY);
  },

  /**
   * Atualiza dados do usuário atual
   */
  updateMe: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const userStr = localStorage.getItem(MOCK_USER_KEY);
    if (!userStr) {
      throw new Error('Not authenticated');
    }

    const user = JSON.parse(userStr);
    const updatedUser = { ...user, ...data };

    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Simula envio de email de reset de senha
   */
  resetPassword: async (email) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('[Mock Auth] Reset password email sent to:', email);
    return { success: true, message: 'Password reset email sent' };
  }
};

// Auto-login em modo desenvolvimento (opcional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  const token = localStorage.getItem(MOCK_TOKEN_KEY);
  if (!token) {
    console.log('[Mock Auth] Auto-login inicial');
    localStorage.setItem(MOCK_TOKEN_KEY, 'mock_token_initial');
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(DEFAULT_MOCK_USER));
  }
}

