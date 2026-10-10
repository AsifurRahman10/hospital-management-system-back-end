import { z } from 'zod'
import { Gender } from '../../../../generated/prisma/enums'

const genderEnum = z.enum(Gender)

const updateDoctorValidationSchema = z
  .object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    email: z.email('Invalid email address').optional(),

    profilePhoto: z.url('Invalid profile photo URL').nullable().optional(),
    contactNumber: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    registrationNumber: z.string().nullable().optional(),

    experience: z.number().int().nonnegative().nullable().optional(),
    gender: genderEnum.optional(),
    appointmentFee: z.number().nonnegative().nullable().optional(),

    qualifications: z.string().nullable().optional(),
    currentWorkplace: z.string().nullable().optional(),
    designation: z.string().nullable().optional(),

    specialties: z.array(z.uuid()).optional()
  })
  .partial()

export const DoctorValidation = {
  updateDoctorValidationSchema
}
