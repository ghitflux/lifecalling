'use client';

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Log para debug - configuração da API
console.log('🔧 API Configuration:', {
  baseURL: BASE_URL,
  environment: process.env.NODE_ENV,
  publicApiUrl: process.env.NEXT_PUBLIC_API_BASE_URL
});

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
  if (isAxiosError(err)) {
    const e = err as AxiosError<any>;
    // eslint-disable-next-line no-console
    console.error('❌ API Error:', {
      method: e.config?.method?.toUpperCase(),
      url: e.config?.url,
      status: e.response?.status,
      code: e.code,
      message: e.message,
      data: e.response?.data,
    });
  } else {
    // eslint-disable-next-line no-console
    console.error('❌ Non-Axios error:', err);
  }
}

// --- refresh single-flight (uma vez por vez) ----------------------
let refreshPromise: Promise<void> | null = null;

async function doRefreshOnce() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await api.post('/auth/refresh', null, { withCredentials: true });
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
    if (status === 401 && cfg && !cfg[RETRIED]) {
      try {
        cfg[RETRIED] = true;
        await doRefreshOnce();
        return api(cfg); // repete a request original
      } catch (_e) {
        // refresh falhou: deixar seguir pro caller lidar (ex.: redirecionar pra /login)
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
