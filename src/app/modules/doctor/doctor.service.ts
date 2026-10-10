import { prisma } from '../../lib/prisma'

const getAllDoctors = async () => {
  const allDoctors = await prisma.doctor.findMany({
    include: {
      user: true,
      doctorSpecialties: {
        include: {
          specialty: true
        }
      }
    }
  })

  return allDoctors
}

const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findFirst({
    where: {
      id,
      isDeleted: false
    },
    include: {
      user: true,
      doctorSpecialties: {
        include: {
          specialty: true
        }
      }
    }
  })

  if (!doctor) {
    throw new Error('Doctor not found')
  }

  return doctor
}

interface UpdateDoctorPayload {
  id: string
  name?: string
  profilePhoto?: string
  contactNumber?: string
  address?: string
  registrationNumber?: string
  experience?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  appointmentFee?: number
  qualifications?: string
  currentWorkplace?: string
  designation?: string
  specialties?: string[]
}

const updateDoctor = async (payload: UpdateDoctorPayload) => {
  console.log(payload)
  const { specialties, ...doctorData } = payload

  const existingDoctor = await prisma.doctor.findFirst({
    where: {
      id: payload.id,
      isDeleted: false
    }
  })

  if (!existingDoctor) {
    throw new Error('Doctor not found')
  }

  if (specialties) {
    const existingSpecialties = await prisma.specialty.findMany({
      where: {
        id: {
          in: specialties
        }
      },
      select: {
        id: true
      }
    })

    if (existingSpecialties.length !== new Set(specialties).size) {
      throw new Error('One or more specialties not found')
    }
  }

  const updatedDoctor = await prisma.$transaction(async (tx) => {
    await tx.doctor.update({
      where: { id: payload.id },
      data: doctorData
    })

    if (specialties !== undefined) {
      await tx.doctorSpecialty.deleteMany({
        where: {
          doctorId: payload.id
        }
      })

      if (specialties.length > 0) {
        await tx.doctorSpecialty.createMany({
          data: specialties.map((specialtyId) => ({
            doctorId: payload.id,
            specialtyId
          }))
        })
      }
    }

    return tx.doctor.findUniqueOrThrow({
      where: { id: payload.id },
      include: {
        user: true,
        doctorSpecialties: {
          include: {
            specialty: true
          }
        }
      }
    })
  })

  return updatedDoctor
}

const deleteDoctor = async (id: string) => {
  const existingDoctor = await prisma.doctor.findFirst({
    where: {
      id,
      isDeleted: false
    }
  })

  if (!existingDoctor) {
    throw new Error('Doctor not found')
  }

  const deletedDoctor = await prisma.doctor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  })

  return deletedDoctor
}

export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
}
