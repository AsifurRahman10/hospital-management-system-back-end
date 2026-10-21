import { Router } from 'express'
import { AdminController } from './admin.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { AdminValidation } from './admin.validation'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'
import { multerUpload } from '../../config/multer.config'
import { updateMyAdminProfileMiddleware } from './admin.middlewares'

const router = Router()

router.get(
  '/',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllAdmins
)
// must be declared before '/:id' routes so it is not treated as an id
router.patch(
  '/update-my-profile',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.fields([{ name: 'profilePhoto', maxCount: 1 }]),
  updateMyAdminProfileMiddleware,
  validateRequest(AdminValidation.updateAdminProfileZodSchema),
  AdminController.updateMyProfile
)
router.get(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAdminById
)
router.patch(
  '/:id',
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateAdminValidationSchema),
  AdminController.updateAdmin
)
router.delete(
  '/:id',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.deleteAdmin
)

export const AdminRoutes = router
