import React, { useState } from 'react'
import { Button } from './Button'

export interface NoteInputProps {
  onSubmit: (note: string) => Promise<void>
  placeholder?: string
  buttonText?: string
  maxLength?: number
  className?: string
}

export function NoteInput({
  onSubmit,
  placeholder = 'Digite sua observação...',
  buttonText = 'Enviar',
  maxLength = 1000,
  className = '',
}: NoteInputProps) {
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(note.trim())
      setNote('')
    } catch (error) {
      console.error('Error submitting note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {note.length}/{maxLength} caracteres
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!note.trim() || isSubmitting}
          loading={isSubmitting}
          size="sm"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  )
}