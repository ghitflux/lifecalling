import type { Meta, StoryObj } from '@storybook/react'
import { Form, EditableField } from '../components/forms/Form'
import { FormFieldConfig } from '@/types'
import { FormValidator, ValidationStrategyFactory } from '@/lib/patterns/strategy/validation'

const meta: Meta<typeof Form> = {
  title: 'Components/Form',
  component: Form,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    loading: { control: 'boolean' },
    columns: { control: { type: 'select', options: [1, 2, 3] } },
    layout: { control: { type: 'select', options: ['vertical', 'horizontal'] } },
    submitText: { control: 'text' },
    cancelText: { control: 'text' },
    onSubmit: { action: 'form submitted' },
    onCancel: { action: 'form cancelled' },
  },
}

export default meta
type Story = StoryObj<typeof Form>

// Mock form fields
const basicFields: FormFieldConfig[] = [
  {
    name: 'nome',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    placeholder: 'Digite o nome completo',
  },
  {
    name: 'email',
    label: 'E-mail',
    type: 'email',
    required: true,
    placeholder: 'usuario@exemplo.com',
    validation: 'email',
  },
  {
    name: 'telefone',
    label: 'Telefone',
    type: 'tel',
    required: true,
    placeholder: '(11) 99999-9999',
    validation: 'phone',
  },
  {
    name: 'observacoes',
    label: 'Observações',
    type: 'textarea',
    placeholder: 'Informações adicionais...',
  },
]

const clientFields: FormFieldConfig[] = [
  {
    name: 'nome',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    placeholder: 'Digite o nome completo',
  },
  {
    name: 'cpf',
    label: 'CPF',
    type: 'text',
    required: true,
    placeholder: '000.000.000-00',
    validation: 'cpf',
  },
  {
    name: 'email',
    label: 'E-mail',
    type: 'email',
    placeholder: 'usuario@exemplo.com',
    validation: 'email',
  },
  {
    name: 'telefone',
    label: 'Telefone',
    type: 'tel',
    required: true,
    placeholder: '(11) 99999-9999',
    validation: 'phone',
  },
  {
    name: 'renda',
    label: 'Renda Mensal',
    type: 'number',
    placeholder: '5000.00',
  },
  {
    name: 'profissao',
    label: 'Profissão',
    type: 'text',
    placeholder: 'Ex: Analista de Sistemas',
  },
  {
    name: 'endereco',
    label: 'Endereço',
    type: 'text',
    placeholder: 'Rua, número, bairro',
  },
  {
    name: 'cidade',
    label: 'Cidade',
    type: 'text',
    placeholder: 'São Paulo',
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'SP', label: 'São Paulo' },
      { value: 'RJ', label: 'Rio de Janeiro' },
      { value: 'MG', label: 'Minas Gerais' },
      { value: 'RS', label: 'Rio Grande do Sul' },
      { value: 'PR', label: 'Paraná' },
    ],
  },
]

// Create validator with strategies
const createValidator = () => {
  const validator = new FormValidator()
    .addValidation('nome', ValidationStrategyFactory.createRequiredValidator('Nome'))
    .addValidation('email', ValidationStrategyFactory.createEmailValidator())
    .addValidation('cpf', ValidationStrategyFactory.createCPFValidator())
    .addValidation('telefone', ValidationStrategyFactory.createPhoneValidator())

  return validator
}

export const BasicForm: Story = {
  args: {
    fields: basicFields,
    submitText: 'Salvar',
    cancelText: 'Cancelar',
  },
}

export const ClientForm: Story = {
  args: {
    fields: clientFields,
    columns: 2,
    submitText: 'Cadastrar Cliente',
    validator: createValidator(),
  },
}

export const ThreeColumns: Story = {
  args: {
    fields: clientFields,
    columns: 3,
    submitText: 'Salvar',
  },
}

export const WithInitialData: Story = {
  args: {
    fields: clientFields,
    columns: 2,
    initialData: {
      nome: 'João Silva',
      cpf: '123.456.789-00',
      email: 'joao@exemplo.com',
      telefone: '(11) 99999-9999',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    submitText: 'Atualizar',
  },
}

export const Loading: Story = {
  args: {
    fields: basicFields,
    loading: true,
    submitText: 'Salvando...',
  },
}

export const WithValidation: Story = {
  args: {
    fields: basicFields,
    validator: createValidator(),
    submitText: 'Validar e Salvar',
  },
}

// Story for EditableField
const EditableFieldMeta: Meta<typeof EditableField> = {
  title: 'Components/EditableField',
  component: EditableField,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: { control: { type: 'select', options: ['text', 'tel', 'email'] } },
    validation: { control: { type: 'select', options: ['phone', 'email', undefined] } },
    onSave: { action: 'saved' },
  },
}

type EditableStory = StoryObj<typeof EditableField>

export const EditableText: EditableStory = {
  render: (args) => <EditableField {...args} />,
  args: {
    value: 'João Silva',
    type: 'text',
    placeholder: 'Nome do cliente',
  },
}

export const EditablePhone: EditableStory = {
  render: (args) => <EditableField {...args} />,
  args: {
    value: '(11) 99999-9999',
    type: 'tel',
    validation: 'phone',
    placeholder: 'Telefone',
  },
}

export const EditableEmail: EditableStory = {
  render: (args) => <EditableField {...args} />,
  args: {
    value: 'joao@exemplo.com',
    type: 'email',
    validation: 'email',
    placeholder: 'E-mail',
  },
}

export const EmptyEditable: EditableStory = {
  render: (args) => <EditableField {...args} />,
  args: {
    value: '',
    placeholder: 'Clique para adicionar',
  },
}