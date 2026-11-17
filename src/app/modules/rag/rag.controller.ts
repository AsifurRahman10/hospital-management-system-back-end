import { Request, Response } from 'express'
import sendResponse from '../../shared/sendResponse'
import status from 'http-status'
import catchAsync from '../../shared/catchAsync'
import { RagService } from './rag.service'
import { redisService } from '../../lib/redis'

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

const queryRag = catchAsync(async (req: Request, res: Response) => {
  const { query, limit, sourceType } = req.body

  if (!query) {
    return sendResponse(res, {
      success: false,
      statusCode: status.BAD_REQUEST,
      message: 'Query is required'
    })
  }

  const cacheKey = `rag:query:${query}:${limit ?? 5}:${sourceType || 'all'}`
  try {
    const cachedResult = await redisService.get(cacheKey)
    if (cachedResult) {
      const parsedData = JSON.parse(cachedResult)

      sendResponse(res, {
        success: true,
        statusCode: status.OK,
        message: 'Answer retrieved from cache',
        data: parsedData
      })
      return
    }
  } catch (cacheError) {
    console.warn(
      'Cache read error, proceeding with normal processing:',
      cacheError
    )
  }
  const result = await ragService.generateAnswer(
    query,
    limit ?? 5,
    sourceType,
    true
  )

  try {
    await redisService.set(cacheKey, JSON.stringify(result), 1800)
  } catch (cacheError) {
    console.warn('Cache write error:', cacheError)
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'RAG query results',
    data: result
  })
})

export const RagController = {
  getStats,
  ingestDoctors,
  queryRag
}
