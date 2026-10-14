import { z } from 'zod'

const createSpecialtyValidation = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Specialty title is required')
    .max(100, 'Title must not exceed 100 characters'),

  description: z.string().trim().nullable().optional(),

  icon: z
    .string()
    .trim()
    .max(255, 'Icon must not exceed 255 characters')
    .nullable()
    .optional()
})

export const specialtyValidation = { createSpecialtyValidation }
