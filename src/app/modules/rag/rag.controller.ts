import { Request, Response } from 'express'
import sendResponse from '../../shared/sendResponse'
import status from 'http-status'
import catchAsync from '../../shared/catchAsync'
import { RagService } from './rag.service'

const ragService = new RagService()

const getStats = async (req: Request, res: Response) => {
  console.log('connected', req.query)
  res.status(200).json({ message: 'connected rag apis' })
}

const ingestDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await ragService.ingestDoctor()

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Doctors data ingestion completed',
    data: result
  })
})

export const RagController = {
  getStats,
  ingestDoctors
}
