import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EsteiraCard } from "@lifecalling/ui";

const meta = {
  title: "Components/EsteiraCard",
  component: EsteiraCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EsteiraCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCaso = {
  id: 1,
  status: "pendente" as const,
  client: {
    name: "João Silva",
    cpf: "123.456.789-00",
    matricula: "MAT001234",
  },
  created_at: "2024-01-15T10:30:00Z",
};

export const Pending: Story = {
  args: {
    caso: {
      ...mockCaso,
      status: "pendente" as const,
    },
    onView: (id: number) => console.log("View case:", id),
    onAssign: (id: number) => console.log("Assign case:", id),
  },
};

export const InProgress: Story = {
  args: {
    caso: {
      ...mockCaso,
      id: 2,
      status: "em_atendimento" as const,
      assigned_to: "Maria Santos",
      client: {
        name: "Ana Costa",
        cpf: "987.654.321-00",
        matricula: "MAT005678",
      },
    },
    onView: (id: number) => console.log("View case:", id),
  },
};

export const Completed: Story = {
  args: {
    caso: {
      ...mockCaso,
      id: 3,
      status: "contrato_efetivado" as const,
      assigned_to: "Carlos Oliveira",
      client: {
        name: "Pedro Almeida",
        cpf: "456.789.123-00",
        matricula: "MAT009876",
      },
      created_at: "2024-01-10T14:20:00Z",
    },
    onView: (id: number) => console.log("View case:", id),
  },
};

export const Cancelled: Story = {
  args: {
    caso: {
      ...mockCaso,
      id: 4,
      status: "reprovado" as const,
      assigned_to: "Lucia Ferreira",
      client: {
        name: "Roberto Lima",
        cpf: "789.123.456-00",
        matricula: "MAT004321",
      },
      created_at: "2024-01-08T09:15:00Z",
    },
    onView: (id: number) => console.log("View case:", id),
  },
};

export const WithoutAssignee: Story = {
  args: {
    caso: {
      ...mockCaso,
      id: 5,
      status: "pendente" as const,
      client: {
        name: "Fernanda Souza",
        cpf: "789.123.456-00",
        matricula: "MAT007890",
      },
    },
    onView: (id: number) => console.log("View case:", id),
    onAssign: (id: number) => console.log("Assign case:", id),
  },
};
