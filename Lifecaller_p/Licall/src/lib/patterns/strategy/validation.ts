import { ValidationResult } from '@/types'

// Strategy Pattern - Interface para estratégias de validação
export interface ValidationStrategy {
  validate(value: any): ValidationResult
}

// Implementações concretas das estratégias
export class EmailValidationStrategy implements ValidationStrategy {
  validate(email: string): ValidationResult {
    const errors: string[] = []

    if (!email) {
      errors.push('E-mail é obrigatório')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('E-mail inválido')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class CPFValidationStrategy implements ValidationStrategy {
  validate(cpf: string): ValidationResult {
    const errors: string[] = []

    if (!cpf) {
      errors.push('CPF é obrigatório')
      return { isValid: false, errors }
    }

    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '')

    if (cleanCPF.length !== 11) {
      errors.push('CPF deve conter 11 dígitos')
      return { isValid: false, errors }
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      errors.push('CPF inválido')
      return { isValid: false, errors }
    }

    // Validação do algoritmo do CPF
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) {
      errors.push('CPF inválido')
      return { isValid: false, errors }
    }

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) {
      errors.push('CPF inválido')
      return { isValid: false, errors }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class PhoneValidationStrategy implements ValidationStrategy {
  validate(phone: string): ValidationResult {
    const errors: string[] = []

    if (!phone) {
      errors.push('Telefone é obrigatório')
      return { isValid: false, errors }
    }

    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.push('Telefone deve conter 10 ou 11 dígitos')
    }

    // Verifica se é um número válido (não todos iguais)
    if (/^(\d)\1+$/.test(cleanPhone)) {
      errors.push('Telefone inválido')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class CurrencyValidationStrategy implements ValidationStrategy {
  validate(value: string): ValidationResult {
    const errors: string[] = []

    if (!value) {
      errors.push('Valor é obrigatório')
      return { isValid: false, errors }
    }

    // Remove formatação e tenta converter para número
    const cleanValue = value.replace(/[^\d,.-]/g, '').replace(',', '.')
    const numericValue = parseFloat(cleanValue)

    if (isNaN(numericValue)) {
      errors.push('Valor deve ser um número válido')
    } else if (numericValue < 0) {
      errors.push('Valor deve ser positivo')
    } else if (numericValue > 999999999) {
      errors.push('Valor muito alto')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class RequiredFieldValidationStrategy implements ValidationStrategy {
  constructor(private fieldName: string) {}

  validate(value: any): ValidationResult {
    const errors: string[] = []

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${this.fieldName} é obrigatório`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Context class que utiliza as estratégias
export class FormValidator {
  private strategies: Map<string, ValidationStrategy> = new Map()

  addValidation(field: string, strategy: ValidationStrategy): this {
    this.strategies.set(field, strategy)
    return this
  }

  validate(formData: Record<string, any>): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {}

    for (const [field, strategy] of this.strategies) {
      results[field] = strategy.validate(formData[field])
    }

    return results
  }

  validateField(field: string, value: any): ValidationResult {
    const strategy = this.strategies.get(field)
    if (!strategy) {
      return { isValid: true, errors: [] }
    }
    return strategy.validate(value)
  }

  isFormValid(formData: Record<string, any>): boolean {
    const results = this.validate(formData)
    return Object.values(results).every(result => result.isValid)
  }
}

// Factory para criar validadores comuns
export class ValidationStrategyFactory {
  static createEmailValidator(): ValidationStrategy {
    return new EmailValidationStrategy()
  }

  static createCPFValidator(): ValidationStrategy {
    return new CPFValidationStrategy()
  }

  static createPhoneValidator(): ValidationStrategy {
    return new PhoneValidationStrategy()
  }

  static createCurrencyValidator(): ValidationStrategy {
    return new CurrencyValidationStrategy()
  }

  static createRequiredValidator(fieldName: string): ValidationStrategy {
    return new RequiredFieldValidationStrategy(fieldName)
  }
}