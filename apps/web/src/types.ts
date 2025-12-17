export type Client = {
  id: number;
  name: string;
  cpf: string;
  matricula: string;
  orgao?: string;
  telefone_preferencial?: string;
  numero_cliente?: string;
  observacoes?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
  tipo_chave_pix?: string;
};

export type Case = {
  id: number;
  status: string;
  assigned_user_id?: number | null;
  client: Client;
};

export type SimulationResult = {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  results?: {
    valorLiberado: number;
    valorParcela: number;
    taxaJuros: number;
    prazo: number;
  };
  manual_input?: any;
  created_at: string;
  updated_at?: string;
};

export type Attachment = {
  id: number;
  filename: string;
  size: number;
  mime: string;
  uploaded_at: string;
  uploaded_by: number;
};

export type CaseDetail = {
  id: number;
  status: string;
  client: Client;
  simulation?: SimulationResult;
  attachments?: Attachment[];
};
