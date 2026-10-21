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

const updateDoctorProfileZodSchema = z.object({
  doctorInfo: z
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
        .optional(),
      address: z
        .string('Address must be a string')
        .min(1, 'Address cannot be empty')
        .max(200, 'Address must be less than 200 characters')
        .optional(),
      registrationNumber: z
        .string('Registration number must be a string')
        .min(1, 'Registration number cannot be empty')
        .max(100, 'Registration number must be less than 100 characters')
        .optional(),
      experience: z
        .number('Experience must be a number')
        .int('Experience must be an integer')
        .nonnegative('Experience cannot be negative')
        .optional(),
      gender: z.enum([Gender.FEMALE, Gender.MALE, Gender.OTHER]).optional(),
      appointmentFee: z
        .number('Appointment fee must be a number')
        .nonnegative('Appointment fee cannot be negative')
        .optional(),
      qualifications: z
        .string('Qualifications must be a string')
        .min(1, 'Qualifications cannot be empty')
        .max(500, 'Qualifications must be less than 500 characters')
        .optional(),
      currentWorkplace: z
        .string('Current workplace must be a string')
        .min(1, 'Current workplace cannot be empty')
        .max(200, 'Current workplace must be less than 200 characters')
        .optional(),
      designation: z
        .string('Designation must be a string')
        .min(1, 'Designation cannot be empty')
        .max(100, 'Designation must be less than 100 characters')
        .optional()
    })
    .optional(),
  specialties: z
    .array(
      z.object({
        specialtyId: z.uuid('Specialty id must be a valid UUID'),
        shouldDelete: z.boolean().optional()
      })
    )
    .optional()
})

export const DoctorValidation = {
  updateDoctorValidationSchema,
  updateDoctorProfileZodSchema
}
