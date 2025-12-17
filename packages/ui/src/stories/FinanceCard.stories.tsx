import type { Meta, StoryObj } from '@storybook/react';
import { FinanceCard } from '../FinanceCard';

const meta: Meta<typeof FinanceCard> = {
  title: 'Finance/FinanceCard',
  component: FinanceCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FinanceCard>;

// Dados básicos do cliente
const mockClientBankInfo = {
  banco: "Banco do Brasil",
  agencia: "1234",
  conta: "56789-0",
  chave_pix: "123.456.789-00",
  tipo_chave_pix: "cpf"
};

const mockCaseDetails = {
  cpf: "123.456.789-00",
  matricula: "MAT-2024-001",
  created_at: "2025-01-15T10:30:00Z"
};

const mockSimulationResult = {
  banco: "Banco do Brasil",
  valorLiberado: 50000,
  valorParcela: 1250,
  coeficiente: 2.5435678,
  saldoDevedor: 48000,
  valorTotalFinanciado: 50000,
  seguroObrigatorio: 1000,
  valorLiquido: 45000,
  custoConsultoria: 3000,
  custoConsultoriaLiquido: 2580,  // 86% de 3000
  liberadoCliente: 46000,
  percentualConsultoria: 6,
  taxaJuros: 1.99,
  prazo: 48
};

export const Approved: Story = {
  args: {
    id: 1,
    clientName: "João da Silva Santos",
    status: "approved",
    totalAmount: 50000,
    installments: 48,
    dueDate: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
    simulationResult: mockSimulationResult,
    clientBankInfo: mockClientBankInfo,
    caseDetails: mockCaseDetails,
    onDisburse: (id) => console.log("Efetivar liberação para caso", id)
  },
};

export const Disbursed: Story = {
  args: {
    id: 2,
    clientName: "Maria Oliveira Costa",
    status: "disbursed",
    totalAmount: 80000,
    installments: 60,
    paidInstallments: 12,
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    simulationResult: {
      ...mockSimulationResult,
      valorLiberado: 80000,
      valorParcela: 2000,
      liberadoCliente: 73600,
      custoConsultoria: 4800,
      custoConsultoriaLiquido: 4128,
      prazo: 60
    },
    clientBankInfo: {
      ...mockClientBankInfo,
      banco: "Caixa Econômica",
      agencia: "4567",
      conta: "98765-4"
    },
    caseDetails: {
      cpf: "987.654.321-00",
      matricula: "MAT-2024-002",
      created_at: "2025-01-10T14:20:00Z"
    },
    attachments: [],
    onCancel: () => console.log("Cancelar contrato"),
    onDelete: () => console.log("Deletar contrato")
  },
};

export const WithAttachments: Story = {
  args: {
    id: 3,
    clientName: "Carlos Alberto Pereira",
    status: "disbursed",
    totalAmount: 120000,
    installments: 72,
    paidInstallments: 24,
    dueDate: new Date(Date.now() + 20*24*60*60*1000).toISOString(),
    simulationResult: {
      ...mockSimulationResult,
      valorLiberado: 120000,
      valorParcela: 3500,
      liberadoCliente: 110400,
      custoConsultoria: 7200,
      custoConsultoriaLiquido: 6192,
      prazo: 72
    },
    clientBankInfo: mockClientBankInfo,
    caseDetails: {
      cpf: "111.222.333-44",
      matricula: "MAT-2024-003",
      created_at: "2025-01-05T09:15:00Z"
    },
    attachments: [
      {
        id: 1,
        filename: "comprovante_pagamento.pdf",
        size: 245678,
        uploaded_at: "2025-01-20T16:30:00Z",
        mime_type: "application/pdf"
      },
      {
        id: 2,
        filename: "contrato_assinado.pdf",
        size: 567890,
        uploaded_at: "2025-01-21T10:00:00Z",
        mime_type: "application/pdf"
      },
      {
        id: 3,
        filename: "documento_identidade.jpg",
        size: 123456,
        uploaded_at: "2025-01-22T14:45:00Z",
        mime_type: "image/jpeg"
      }
    ],
    onUploadAttachment: (file) => console.log("Upload de arquivo:", file.name),
    onCancel: () => console.log("Cancelar contrato"),
    onDelete: () => console.log("Deletar contrato")
  },
};

export const Pending: Story = {
  args: {
    id: 4,
    clientName: "Ana Paula Rodrigues",
    status: "pending",
    totalAmount: 35000,
    installments: 36,
    dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString(),
    simulationResult: {
      ...mockSimulationResult,
      valorLiberado: 35000,
      valorParcela: 1100,
      liberadoCliente: 32200,
      custoConsultoria: 2100,
      custoConsultoriaLiquido: 1806,
      prazo: 36
    },
    clientBankInfo: mockClientBankInfo,
    caseDetails: {
      cpf: "555.666.777-88",
      matricula: "MAT-2024-004",
      created_at: "2025-01-25T11:00:00Z"
    },
    onApprove: (id) => console.log("Aprovar caso", id),
    onReject: (id) => console.log("Rejeitar caso", id)
  },
};

export const Overdue: Story = {
  args: {
    id: 5,
    clientName: "Pedro Henrique Souza",
    status: "overdue",
    totalAmount: 60000,
    installments: 48,
    paidInstallments: 10,
    dueDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
    simulationResult: {
      ...mockSimulationResult,
      valorLiberado: 60000,
      valorParcela: 1500,
      liberadoCliente: 55200,
      custoConsultoria: 3600,
      custoConsultoriaLiquido: 3096,
      prazo: 48
    },
    clientBankInfo: mockClientBankInfo,
    caseDetails: {
      cpf: "999.888.777-66",
      matricula: "MAT-2024-005",
      created_at: "2024-12-01T08:30:00Z"
    },
    attachments: [
      {
        id: 1,
        filename: "notificacao_atraso.pdf",
        size: 89012,
        uploaded_at: "2025-01-18T09:00:00Z",
        mime_type: "application/pdf"
      }
    ]
  },
};

export const FullDetails: Story = {
  args: {
    id: 6,
    clientName: "Fernanda Lima Alves",
    status: "disbursed",
    totalAmount: 95000,
    installments: 60,
    paidInstallments: 18,
    dueDate: new Date(Date.now() + 25*24*60*60*1000).toISOString(),
    simulationResult: {
      ...mockSimulationResult,
      banco: "Santander",
      valorLiberado: 95000,
      valorParcela: 2800,
      liberadoCliente: 87400,
      custoConsultoria: 5700,
      custoConsultoriaLiquido: 4902,
      prazo: 60
    },
    clientBankInfo: {
      banco: "Santander",
      agencia: "7890",
      conta: "12345-6",
      chave_pix: "fernanda.lima@email.com",
      tipo_chave_pix: "email"
    },
    caseDetails: {
      cpf: "222.333.444-55",
      matricula: "MAT-2024-006",
      created_at: "2025-01-12T15:45:00Z"
    },
    attachments: [
      {
        id: 1,
        filename: "contrato_principal.pdf",
        size: 456789,
        uploaded_at: "2025-01-15T10:00:00Z",
        mime_type: "application/pdf"
      },
      {
        id: 2,
        filename: "comprovante_liberacao.pdf",
        size: 234567,
        uploaded_at: "2025-01-16T14:30:00Z",
        mime_type: "application/pdf"
      }
    ],
    onUploadAttachment: (file) => console.log("Upload de arquivo:", file.name),
    isUploadingAttachment: false,
    onCancel: () => console.log("Cancelar contrato"),
    onDelete: () => console.log("Deletar contrato"),
    onLoadFullDetails: (caseId) => console.log("Carregar detalhes completos do caso", caseId)
  },
};
