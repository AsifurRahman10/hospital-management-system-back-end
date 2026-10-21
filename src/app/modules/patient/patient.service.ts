import { isValid, parse } from 'date-fns'
import {
  BloodGroup,
  Gender,
  MaritalStatus
} from '../../../../generated/prisma/enums'
import { IUser } from '../../interface'
import { prisma } from '../../lib/prisma'
import { deleteImageFromCloudinary } from '../../config/cloudinary.config'

export interface IUpdatePatientInfoPayload {
  name?: string
  profilePhoto?: string
  contactNumber?: string
  address?: string
}

export interface IUpdatePatientHealthDataPayload {
  gender: Gender
  dateOfBirth: Date
  bloodGroup: BloodGroup
  hasAllergies: boolean
  hasDiabetes: boolean
  height: string
  weight: string
  smokingStatus: boolean
  dietaryPreference?: string
  pregnancyStatus: boolean
  mentalHealthHistory?: string
  immunizationStatus?: string
  hasPastSurgeries: boolean
  recentAnxiety: boolean
  recentDepression: boolean
  maritalStatus?: MaritalStatus
}

export interface IUpdatePatientMedicalReportPayload {
  reportName?: string
  reportLink?: string
  shouldDelete?: boolean
  reportId?: string
}

export interface IUpdatePatientProfilePayload {
  patientInfo?: IUpdatePatientInfoPayload
  patientHealthData?: IUpdatePatientHealthDataPayload
  medicalReports?: IUpdatePatientMedicalReportPayload[]
}

const updateMyProfile = async (
  user: IUser,
  payload: IUpdatePatientProfilePayload
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email
    },
    include: {
      patientHealthData: true,
      medicalReports: true
    }
  })

  await prisma.$transaction(async (tx) => {
    if (payload.patientInfo) {
      await tx.patient.update({
        where: {
          id: patientData.id
        },
        data: {
          ...payload.patientInfo
        }
      })
    }

    if (payload?.patientInfo?.name || payload?.patientInfo?.profilePhoto) {
      const userData = {
        name: payload.patientInfo.name
          ? payload.patientInfo.name
          : patientData.name,
        image: payload.patientInfo.profilePhoto
          ? payload.patientInfo.profilePhoto
          : patientData.profilePhoto
      }
      await tx.user.update({
        where: {
          id: patientData.userId
        },
        data: {
          ...userData
        }
      })
    }

    if (payload.patientHealthData) {
      const healthDataToSave: IUpdatePatientHealthDataPayload = {
        ...payload.patientHealthData
      }

      if (payload.patientHealthData.dateOfBirth) {
        healthDataToSave.dateOfBirth = convertToDateTime(
          typeof healthDataToSave.dateOfBirth === 'string'
            ? healthDataToSave.dateOfBirth
            : undefined
        ) as Date
      }

      await tx.patientHealthData.upsert({
        where: {
          patientId: patientData.id
        },
        update: healthDataToSave,
        create: {
          patientId: patientData.id,
          ...healthDataToSave
        }
      })
    }

    if (
      payload.medicalReports &&
      Array.isArray(payload.medicalReports) &&
      payload.medicalReports.length > 0
    ) {
      for (const report of payload.medicalReports) {
        if (report.shouldDelete && report.reportId) {
          const deletedReport = await tx.medicalReport.delete({
            where: {
              id: report.reportId
            }
          })

          if (deletedReport.reportLink) {
            await deleteImageFromCloudinary(deletedReport.reportLink)
          }
        } else if (report.reportName && report.reportLink) {
          await tx.medicalReport.create({
            data: {
              patientId: patientData.id,
              reportName: report.reportName,
              reportLink: report.reportLink
            }
          })
        }
      }
    }
  })
}

const convertToDateTime = (dateString: string | undefined) => {
  if (!dateString) return undefined

  const date = parse(dateString, 'yyyy-MM-dd', new Date())

  if (!isValid(date)) return undefined

  return date
}

export const PatientService = {
  updateMyProfile
}
