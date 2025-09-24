// Types globais do sistema
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area'

export interface KPIData {
  id: string
  nome: string
  valor: number
  meta?: number
  unidade?: string
  categoria: string
  periodo: string
  percentual?: number
  tendencia?: 'up' | 'down' | 'stable'
}

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea' | 'date'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: 'email' | 'cpf' | 'phone' | 'currency'
}

export interface TableColumn<T = any> {
  key: keyof T
  header: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}