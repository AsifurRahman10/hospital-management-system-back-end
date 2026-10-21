import { z } from 'zod'

const updateAdminValidationSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    email: z.email('Invalid email address').optional(),

    profilePhoto: z.url('Invalid profile photo URL').nullable().optional(),
    contactNumber: z.string().nullable().optional()
  })
  .partial()

const updateAdminProfileZodSchema = z.object({
  adminInfo: z
    .object({
      name: z
        .string('Name must be a string')
        .min(1, 'Name cannot be empty')
        .max(100, 'Name must be less than 100 characters')
        .optional(),
      profilePhoto: z.url('Profile photo must be a valid URL').optional(),
      contactNumber: z
        .string('Contact number must be a string')
        .min(1, 'Contact number cannot be empty')
        .max(20, 'Contact number must be less than 20 characters')
        .optional()
    })
    .optional()
})

export const AdminValidation = {
  updateAdminValidationSchema,
  updateAdminProfileZodSchema
}
