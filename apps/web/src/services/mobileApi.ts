import { api } from '@/lib/api';

const basePath = '/mobile';

export interface Simulation {
  id: string;
  simulation_type: string;
  requested_amount: number;
  installments: number;
  interest_rate: number;
  installment_value: number;
  total_amount: number;
  status: string;
  created_at: string;
  // New fields
  banks_json?: any[];
  prazo?: number;
  coeficiente?: string;
  seguro?: number;
  percentual_consultoria?: number;
}

export interface CreateSimulationDTO {
  simulation_type: string;
  interest_rate: number;
  requested_amount: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  clientId?: string; // Optional if user context is used, but for admin we need it
  // New fields for multi-bank
  banks_json?: any[];
  prazo?: number;
  coeficiente?: string;
  seguro?: number;
  percentual_consultoria?: number;
}

export interface AdminClient {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  cpf?: string;
  phone?: string;
}

export interface AdminSimulation extends Simulation {
  user_name: string;
  user_email: string;
  // Additional client info
  user_cpf?: string;
  user_matricula?: string;
  user_orgao?: string;
  // Fields for compatibility (fix lint errors)
  amount?: number;
  type?: string;
  // Document/attachment fields
  document_url?: string;
  document_type?: string;
  document_filename?: string;
}

export const mobileApi = {
  getSimulations: async () => {
    const response = await api.get<Simulation[]>(`${basePath}/simulations`);
    return response.data;
  },

  createSimulation: async (data: CreateSimulationDTO) => {
    const response = await api.post<Simulation>(`${basePath}/simulations`, data);
    return response.data;
  },

  createAdminSimulation: async (data: CreateSimulationDTO & { user_id: number }) => {
    const response = await api.post<AdminSimulation>(`${basePath}/admin/simulations`, data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get(`${basePath}/profile`);
    return response.data;
  },

  getMargins: async () => {
    const response = await api.get(`${basePath}/margins/current`);
    return response.data;
  },

  getAdminClients: async () => {
    const response = await api.get<AdminClient[]>(`${basePath}/admin/clients`);
    return response.data;
  },

  getAdminSimulations: async () => {
    const response = await api.get<AdminSimulation[]>(`${basePath}/admin/simulations`);
    return response.data;
  },

  getAdminSimulationById: async (id: string) => {
    const response = await api.get<AdminSimulation>(`${basePath}/admin/simulations/${id}`);
    return response.data;
  },

  approveSimulation: async (id: string) => {
    const response = await api.post(`${basePath}/admin/simulations/${id}/approve`);
    return response.data;
  },

  rejectSimulation: async (id: string) => {
    const response = await api.post(`${basePath}/admin/simulations/${id}/reject`);
    return response.data;
  }
};
