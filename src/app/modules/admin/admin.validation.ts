import { z } from 'zod'

const updateAdminValidationSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    email: z.email('Invalid email address').optional(),

    profilePhoto: z.url('Invalid profile photo URL').nullable().optional(),
    contactNumber: z.string().nullable().optional()
  })
  .partial()

export const AdminValidation = {
  updateAdminValidationSchema
}
