import { Router } from 'express'
import { DoctorController } from './doctor.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { DoctorValidation } from './doctor.validation'
import { multerUpload } from '../../config/multer.config'
import { updateMyDoctorProfileMiddleware } from './doctor.middlewares'
import { Role } from '../../../../generated/prisma/enums'
import checkAuth, { optionalCheckAuth } from '../../middleware/checkAuth'

const router = Router()

router.get('/', optionalCheckAuth, DoctorController.getAllDoctors)
// must be declared before '/:id' routes so it is not treated as an id
router.patch(
  '/update-my-profile',
  checkAuth(Role.DOCTOR),
  multerUpload.fields([{ name: 'profilePhoto', maxCount: 1 }]),
  updateMyDoctorProfileMiddleware,
  validateRequest(DoctorValidation.updateDoctorProfileZodSchema),
  DoctorController.updateMyProfile
)
router.get('/:id', DoctorController.getDoctorById)
router.patch(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(DoctorValidation.updateDoctorValidationSchema),
  DoctorController.updateDoctor
)
router.delete(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.deleteDoctor
)

export const DoctorRoutes = router
