import type { Meta, StoryObj } from "@storybook/react";
import { CaseCard } from "@lifecalling/ui";
import { fn } from "@storybook/test";

const meta = {
  title: "Components/CaseCard",
  component: CaseCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onAssign: fn(),
  },
} satisfies Meta<typeof CaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCase = {
  id: 1,
  status: "novo",
  client: {
    name: "João Silva",
    cpf: "123.456.789-00",
    matricula: "MAT001",
  },
};

export const Default: Story = {
  args: {
    item: mockCase,
    href: "/cases/1",
    onAssign: fn(),
  },
};

export const WithoutAssignButton: Story = {
  args: {
    item: mockCase,
    href: "/cases/1",
  },
};

export const EmAtendimento: Story = {
  args: {
    item: {
      ...mockCase,
      status: "em_atendimento",
    },
    href: "/cases/1",
    onAssign: fn(),
  },
};

export const Aprovado: Story = {
  args: {
    item: {
      ...mockCase,
      status: "aprovado",
      client: {
        name: "Maria Santos",
        cpf: "987.654.321-00",
        matricula: "MAT002",
      },
    },
    href: "/cases/2",
  },
};

export const ContratoEfetivado: Story = {
  args: {
    item: {
      ...mockCase,
      id: 3,
      status: "contrato_efetivado",
      client: {
        name: "Pedro Oliveira",
        cpf: "555.444.333-22",
        matricula: "MAT003",
      },
    },
    href: "/cases/3",
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <CaseCard
        item={mockCase}
        href="/cases/1"
        onAssign={fn()}
      />
      <CaseCard
        item={{
          id: 2,
          status: "em_atendimento",
          client: {
            name: "Ana Costa",
            cpf: "111.222.333-44",
            matricula: "MAT004",
          },
        }}
        href="/cases/2"
      />
      <CaseCard
        item={{
          id: 3,
          status: "aprovado",
          client: {
            name: "Carlos Mendes",
            cpf: "999.888.777-66",
            matricula: "MAT005",
          },
        }}
        href="/cases/3"
      />
    </div>
  ),
};