import express from 'express'
import checkAuth from '../../middleware/checkAuth'
import { Role } from '../../../../generated/prisma/enums'
import { RagController } from './rag.controller'

const router = express.Router()

router.get('/stats', RagController.getStats)

router.post(
  '/ingest-doctors',
  checkAuth(Role.SUPER_ADMIN),
  RagController.ingestDoctors
)

export const RagRoutes = router
