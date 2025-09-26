import axios from "axios";

export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true, // cookies HttpOnly
  timeout: 10000, // 10 segundos timeout
});

// Interceptador para debug de requests
API.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📝 Config:', {
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: config.withCredentials,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptador para debug de responses
API.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    console.log('📊 Data:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('🔍 Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }
    });

    // Verificar se é erro de rede
    if (error.message === 'Network Error') {
      console.error('🌐 Network Error detectado! Verifique se a API está rodando em:', error.config?.baseURL);
    }

    // Verificar se é erro de autenticação
    if (error.response?.status === 401) {
      console.warn('🔒 Erro de autenticação detectado. Usuário não está logado.');

      // Se não estamos na página de login, redirecionar
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('🔄 Redirecionando para página de login...');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);