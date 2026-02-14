/**
 * API Client - Cliente HTTP para comunicação com o backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Classe para gerenciar erros da API
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Cliente HTTP para fazer requisições à API
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Obtém o token de autenticação do localStorage
   */
  getToken() {
    return localStorage.getItem('domus_auth_token');
  }

  /**
   * Salva o token de autenticação no localStorage
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('domus_auth_token', token);
    } else {
      localStorage.removeItem('domus_auth_token');
    }
  }

  /**
   * Remove o token de autenticação
   */
  clearToken() {
    localStorage.removeItem('domus_auth_token');
  }

  /**
   * Monta os headers da requisição
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Faz uma requisição HTTP
   */
  async request(method, endpoint, data = null, customHeaders = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(customHeaders);

    const options = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiError(
          responseData?.error || responseData?.message || 'Request failed',
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message, 0, null);
    }
  }

  /**
   * Métodos HTTP
   */
  get(endpoint, customHeaders = {}) {
    return this.request('GET', endpoint, null, customHeaders);
  }

  post(endpoint, data, customHeaders = {}) {
    return this.request('POST', endpoint, data, customHeaders);
  }

  put(endpoint, data, customHeaders = {}) {
    return this.request('PUT', endpoint, data, customHeaders);
  }

  patch(endpoint, data, customHeaders = {}) {
    return this.request('PATCH', endpoint, data, customHeaders);
  }

  delete(endpoint, customHeaders = {}) {
    return this.request('DELETE', endpoint, null, customHeaders);
  }
}

// Exporta uma instância única do cliente
export const apiClient = new ApiClient();

