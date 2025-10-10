import { z } from 'zod'

export const CalcApproveSchema = z.object({
  aprovado: z.boolean(),
  valor_liberado: z.number().min(0).optional(),
  parcela_total: z.number().min(0).optional(),
  coeficiente: z.number().min(0).optional(),
  observacoes: z.string().optional(),
})

export const CalcRejectSchema = z.object({
  motivo: z.string().min(1, 'Motivo é obrigatório'),
})

export const AttachmentSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.string(),
  size: z.number().min(0),
  uploadedAt: z.string().datetime(),
})

export const NoteSchema = z.object({
  content: z.string().min(1, 'Observação não pode estar vazia').max(1000, 'Observação muito longa'),
})

export type CalcApproveInput = z.infer<typeof CalcApproveSchema>
export type CalcRejectInput = z.infer<typeof CalcRejectSchema>
export type AttachmentInput = z.infer<typeof AttachmentSchema>
export type NoteInput = z.infer<typeof NoteSchema>