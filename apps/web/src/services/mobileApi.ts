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
  updated_at?: string;
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
  user_id: number;
  user_name: string;
  user_email: string;
  // Additional client info
  user_cpf?: string;
  user_matricula?: string;
  user_orgao?: string;
  user_phone?: string;
  // Fields for compatibility (fix lint errors)
  amount?: number;
  type?: string;
  // Document/attachment fields
  document_url?: string;
  document_type?: string;
  document_filename?: string;
  // Analysis fields
  analysis_status?: 'pending_analysis' | 'pending_docs' | 'approved_for_calculation' | 'reproved';
  analyst_id?: number;
  analyst_name?: string;
  analyst_notes?: string;
  pending_documents?: PendingDocument[];
  analyzed_at?: string;
  client_type?: 'new_client' | 'existing_client';
  has_active_contract?: boolean;
}

export interface PendingDocument {
  type: string;
  description: string;
}

export interface PendSimulationRequest {
  analyst_notes: string;
  pending_documents: PendingDocument[];
}

export interface ReproveSimulationRequest {
  analyst_notes: string;
}

export interface ApproveForCalculationRequest {
  analyst_notes?: string;
}

export interface AdminDocumentItem {
  id: string;
  document_type?: string;
  document_filename?: string;
  created_at: string;
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

  updateAdminSimulation: async (id: string, data: Partial<CreateSimulationDTO>) => {
    const response = await api.put<AdminSimulation>(`${basePath}/admin/simulations/${id}`, data);
    return response.data;
  },

  setAdminSimulationAsLatest: async (id: string) => {
    const response = await api.post<AdminSimulation>(`${basePath}/admin/simulations/${id}/set-latest`);
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
  },

  // Analysis endpoints
  getSimulationsForAnalysis: async () => {
    const response = await api.get<AdminSimulation[]>(`${basePath}/admin/simulations/analysis`);
    return response.data;
  },

  pendSimulation: async (id: string, data: PendSimulationRequest) => {
    const response = await api.post(`${basePath}/admin/simulations/${id}/pend`, data);
    return response.data;
  },

  reproveSimulation: async (id: string, data: ReproveSimulationRequest) => {
    const response = await api.post(`${basePath}/admin/simulations/${id}/reprove`, data);
    return response.data;
  },

  approveForCalculation: async (id: string, data: ApproveForCalculationRequest) => {
    const response = await api.post(`${basePath}/admin/simulations/${id}/approve-for-calculation`, data);
    return response.data;
  },

  getAdminSimulationDocuments: async (id: string) => {
    const response = await api.get<AdminDocumentItem[]>(`${basePath}/admin/simulations/${id}/documents`);
    return response.data;
  },

  // Document endpoints
  getSimulationDocument: async (id: string) => {
    const response = await api.get(`${basePath}/admin/documents/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
