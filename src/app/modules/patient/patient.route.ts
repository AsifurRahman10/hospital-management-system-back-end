import { Router } from 'express'
import { multerUpload } from '../../config/multer.config'
import { validateRequest } from '../../middleware/validateRequest'
import { PatientController } from './patient.controller'
import { updateMyPatientProfileMiddleware } from './patient.middlewares'
import { PatientValidation } from './patient.validation'
import { Role } from '../../../../generated/prisma/enums'
import checkAuth from '../../middleware/checkAuth'

const router = Router()

router.patch(
  '/update-my-profile',
  checkAuth(Role.PATIENT),
  multerUpload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'medicalReports', maxCount: 5 }
  ]),
  updateMyPatientProfileMiddleware,
  validateRequest(PatientValidation.updatePatientProfileZodSchema),
  PatientController.updateMyProfile
)

export const PatientRoutes = router
