import { Router } from 'express'
import { SuperAdminController } from './superAdmin.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { SuperAdminValidation } from './superAdmin.validation'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'

const router = Router()

router.get(
  '/',
  checkAuth(Role.SUPER_ADMIN),
  SuperAdminController.getAllSuperAdmins
)
router.get(
  '/:id',
  checkAuth(Role.SUPER_ADMIN),
  SuperAdminController.getSuperAdminById
)
router.patch(
  '/:id',
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(SuperAdminValidation.updateSuperAdminValidationSchema),
  SuperAdminController.updateSuperAdmin
)
router.delete(
  '/:id',
  checkAuth(Role.SUPER_ADMIN),
  SuperAdminController.deleteSuperAdmin
)

export const SuperAdminRoutes = router
