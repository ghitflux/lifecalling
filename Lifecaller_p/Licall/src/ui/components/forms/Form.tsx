import React, { useState } from 'react'
import { FormFieldConfig, ValidationResult } from '@/types'
import { FormValidator } from '@/lib/patterns/strategy/validation'
import { Button } from '../Button'

export interface FormProps {
  fields: FormFieldConfig[]
  initialData?: Record<string, any>
  validator?: FormValidator
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  className?: string
  layout?: 'vertical' | 'horizontal'
  columns?: 1 | 2 | 3
}

export function Form({
  fields,
  initialData = {},
  validator,
  onSubmit,
  onCancel,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  className = '',
  layout = 'vertical',
  columns = 1,
}: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, ValidationResult>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFieldChange = (name: string, value: any) => {
    const newData = { ...formData, [name]: value }
    setFormData(newData)

    // Validação em tempo real
    if (validator) {
      const fieldResult = validator.validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: fieldResult,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validator) {
      const allErrors = validator.validate(formData)
      setErrors(allErrors)

      const hasErrors = Object.values(allErrors).some(result => !result.isValid)
      if (hasErrors) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormFieldConfig) => {
    const error = errors[field.name]
    const hasError = error && !error.isValid

    const fieldClasses = [
      'block w-full px-3 py-2 border rounded-lg shadow-sm',
      'focus:outline-none focus:ring-2 focus:border-primary-500',
      hasError
        ? 'border-red-300 focus:ring-red-500'
        : 'border-gray-300 focus:ring-primary-500',
    ].join(' ')

    const renderInput = () => {
      switch (field.type) {
        case 'select':
          return (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
            >
              <option value="">Selecione...</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )

        case 'textarea':
          return (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
              rows={4}
            />
          )

        case 'tel':
          return (
            <input
              type="tel"
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => {
                let value = e.target.value
                // Formatação básica de telefone
                if (field.validation === 'phone') {
                  value = value.replace(/\D/g, '')
                  if (value.length <= 11) {
                    if (value.length <= 10) {
                      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
                    } else {
                      value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
                    }
                  }
                }
                handleFieldChange(field.name, value)
              }}
              placeholder={field.placeholder}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
            />
          )

        case 'number':
          return (
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || '')}
              placeholder={field.placeholder}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
            />
          )

        case 'date':
          return (
            <input
              type="date"
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
            />
          )

        default:
          return (
            <input
              type={field.type}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => {
                let value = e.target.value

                // Formatações específicas
                if (field.validation === 'cpf') {
                  value = value.replace(/\D/g, '')
                  if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
                  }
                }

                handleFieldChange(field.name, value)
              }}
              placeholder={field.placeholder}
              className={fieldClasses}
              required={field.required}
              disabled={loading}
            />
          )
      }
    }

    return (
      <div key={field.name} className="space-y-1">
        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {hasError && (
          <div className="text-red-600 text-sm space-y-1">
            {error.errors.map((errorMsg, index) => (
              <p key={index}>{errorMsg}</p>
            ))}
          </div>
        )}
        {error?.warnings && error.warnings.length > 0 && (
          <div className="text-yellow-600 text-sm space-y-1">
            {error.warnings.map((warning, index) => (
              <p key={index}>{warning}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div className={`grid ${gridClasses[columns]} gap-6`}>
        {fields.map(renderField)}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={loading}
        >
          {submitText}
        </Button>
      </div>
    </form>
  )
}

// Campo editável inline
export interface EditableFieldProps {
  value: string
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'tel' | 'email'
  validation?: 'phone' | 'email'
  placeholder?: string
  className?: string
}

export function EditableField({
  value,
  onSave,
  type = 'text',
  validation,
  placeholder,
  className = '',
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save error:', error)
      setEditValue(value) // Reverter valor
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const formatValue = (val: string) => {
    if (!val) return val

    if (validation === 'phone') {
      const cleaned = val.replace(/\D/g, '')
      if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      } else {
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
      }
    }

    return val
  }

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <input
          type={type}
          value={editValue}
          onChange={(e) => {
            let newValue = e.target.value
            if (validation === 'phone') {
              newValue = newValue.replace(/\D/g, '')
              if (newValue.length <= 11) {
                newValue = formatValue(newValue)
              }
            }
            setEditValue(newValue)
          }}
          placeholder={placeholder}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave()
            } else if (e.key === 'Escape') {
              handleCancel()
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleSave}
          loading={isLoading}
          disabled={isLoading}
        >
          ✓
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
        >
          ✕
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span>{formatValue(value) || placeholder || 'Clique para editar'}</span>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </div>
  )
}