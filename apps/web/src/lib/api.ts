'use client';

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Log para debug apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    baseURL: BASE_URL,
    environment: process.env.NODE_ENV,
    publicApiUrl: process.env.NEXT_PUBLIC_API_BASE_URL
  });
}

// --- instancia base ----------------------------------------------
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // envia cookies HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- util pra logar erro de forma confiável -----------------------
function logAxiosError(err: unknown) {
  // Logar apenas erros não-401 ou em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  const is401 = isAxiosError(err) && (err as AxiosError).response?.status === 401;

  if (isDev || !is401) {
    if (isAxiosError(err)) {
      const e = err as AxiosError<any>;
      console.error('❌ API Error:', {
        method: e.config?.method?.toUpperCase(),
        url: e.config?.url,
        status: e.response?.status,
        code: e.code,
        message: e.message,
        data: e.response?.data,
      });
    } else {
      console.error('❌ Non-Axios error:', err);
    }
  }
}

// --- refresh single-flight (uma vez por vez) ----------------------
let refreshPromise: Promise<void> | null = null;

async function doRefreshOnce() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // Usar uma instância separada para evitar interceptor recursivo
        const refreshResponse = await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
          baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api'
        });
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Token refresh successful');
        }
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        throw error;
      } finally {
        // sempre limpar pra próxima rodada
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

// Flag por request para não entrar em loop ao repetir
const RETRIED = Symbol('retried');

// --- interceptores ------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    logAxiosError(error);

    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }

    const err = error as AxiosError<any> & { [RETRIED]?: boolean };
    const status = err.response?.status;
    const cfg = err.config as (InternalAxiosRequestConfig & { [RETRIED]?: boolean }) | undefined;

    // 401: tentar refresh UMA vez e repetir a original
    // NÃO tentar refresh se:
    // - estiver na página de login
    // - a request já foi retried
    // - a request for para /auth/login ou /auth/refresh
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
    const isAuthEndpoint = cfg?.url?.includes('/auth/login') || cfg?.url?.includes('/auth/refresh');

    if (status === 401 && cfg && !cfg[RETRIED] && !isLoginPage && !isAuthEndpoint) {
      try {
        cfg[RETRIED] = true;
        await doRefreshOnce();
        return api(cfg); // repete a request original
      } catch (_e) {
        // refresh falhou: redirecionar para login
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
