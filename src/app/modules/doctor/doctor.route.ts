import { Router } from 'express'
import { DoctorController } from './doctor.controller'
import { validateRequest } from '../../middleware/validateRequest'
import { DoctorValidation } from './doctor.validation'

const router = Router()

router.get('/', DoctorController.getAllDoctors)
router.get('/:id', DoctorController.getDoctorById)
router.patch(
  '/:id',
  validateRequest(DoctorValidation.updateDoctorValidationSchema),
  DoctorController.updateDoctor
)
router.delete('/:id', DoctorController.deleteDoctor)

export const DoctorRoutes = router
