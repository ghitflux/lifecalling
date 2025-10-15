'use client';

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

// --- instancia base ----------------------------------------------
export const api: AxiosInstance = axios.create({
  baseURL: '/api', // Usa proxy do Next.js
  withCredentials: true,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: loga erros Axios de forma consistente
export function logAxiosError(tag: string, error: unknown) {
  const e = error as any;
  if (e?.response) {
    console.error(
      `[${tag}] HTTP ${e.response.status}`,
      e.response.data ?? '(sem body)',
      'URL:', e.config?.url
    );
  } else {
    console.error(`[${tag}]`, e?.code || e?.message || e, 'URL:', e?.config?.url);
  }
}

// --- CSRF Token Management ----------------------------------------
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.csrf_token || null;
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await axios.get('/api/auth/csrf', {
      withCredentials: true
    });
    return response.data.csrf_token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

// --- util interna pra logar erro do interceptor -------------------
function logInterceptorError(err: unknown) {
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
          withCredentials: true
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

// --- Request interceptor para CSRF ---------------------------------
api.interceptors.request.use(
  async (config) => {
    // Apenas para métodos que modificam dados
    const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '');
    
    if (isMutating) {
      let csrfToken = getCsrfToken();
      
      // Se não tem token, tenta buscar um novo
      if (!csrfToken) {
        csrfToken = await fetchCsrfToken();
      }
      
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor ------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    logInterceptorError(error);

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
