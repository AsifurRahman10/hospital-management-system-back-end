import { v2 as cloudinary } from 'cloudinary'
import { envConfig } from '.'
import AppError from '../shared/AppError'
import status from 'http-status'

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY.CLOUDINARY_API_SECRET
})

export const deleteImageFromCloudinary = async (url: string) => {
  const regex = /^\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/

  const match = url.match(regex)
  try {
    if (match && match[1]) {
      const publicId = match[1]
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image'
      })

      console.log(`File ${publicId} deleted from Cloudinary.`)
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error)
    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      'Failed to delete file from Cloudinary'
    )
  }
}

export default cloudinary
