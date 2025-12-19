"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/lib/websocket";
import { AuthProvider, useAuth } from "@/lib/auth";

function ApiInterceptor() {
  const router = useRouter();

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response: any) => response,
      (error) => {
        if (error.response?.status === 401) {
          router.push("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [router]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error: any) => {
          if (error?.response?.status === 401) return false;
          return failureCount < 3;
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ApiInterceptor />
        <WebSocketProvider />
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function WebSocketProvider() {
  const { user, getAccessToken } = useAuth();
  const token = getAccessToken();
  const { isConnected } = useWebSocket(user ? token || undefined : undefined);

  useEffect(() => {
    if (isConnected) {
      console.log('🔌 WebSocket connection established');
    }
  }, [isConnected]);

  return null;
}
