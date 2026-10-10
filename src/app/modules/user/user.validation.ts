import { z } from 'zod'
import { Gender } from '../../../../generated/prisma/enums'

const genderEnum = z.enum(Gender)

const createDoctorValidationSchema = z.object({
  password: z.string().min(8),

  doctor: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    profilePhoto: z.url().optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
    registrationNumber: z.string().optional(),
    experience: z.number().int().nonnegative().optional(),
    gender: genderEnum,
    appointmentFee: z.number().nonnegative().optional(),
    qualifications: z.string().optional(),
    currentWorkplace: z.string().optional(),
    designation: z.string().optional()
  }),

  specialties: z.array(z.uuid()).optional()
})

// Update doctor validation
const updateDoctorValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),

    profilePhoto: z.url().nullable().optional(),
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
})

export const UserValidation = {
  createDoctorValidationSchema,
  updateDoctorValidationSchema
}
