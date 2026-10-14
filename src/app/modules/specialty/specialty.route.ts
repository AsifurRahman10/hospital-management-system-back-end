import { Router } from 'express'
import { specialtyController } from './specialty.controller'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'
import { validateRequest } from '../../middleware/validateRequest'
import { specialtyValidation } from './speciality.validation'
import { multerUpload } from '../../config/multer.config'

const route = Router()

route.post(
  '/',
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single('image'),
  validateRequest(specialtyValidation.createSpecialtyValidation),
  specialtyController.createSpecialty
)
route.get('/', specialtyController.getAllSpecialty)
route.get('/:id', specialtyController.getSingleSpecialty)
route.patch('/:id', specialtyController.updateSpecialty)
route.delete('/:id', specialtyController.deleteSpecialty)

export const specialtyRoutes = route
