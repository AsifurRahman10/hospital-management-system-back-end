import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import cloudinary from './cloudinary.config'

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const originalname = file.originalname
    const fileExtension = originalname.split('.').pop()?.toLowerCase()
    const fileNameWithoutExtension = originalname
      .split('.')
      .slice(0, -1)
      .join('.')
      .toLocaleLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const uniqueName =
      Math.random().toString(36).substring(2) +
      '-' +
      Date.now() +
      '-' +
      fileNameWithoutExtension

    const folderName = fileExtension === 'pdf' ? 'pdfs' : 'images'

    return {
      folder: `HMS/${folderName}`,
      public_id: uniqueName,
      resource_type: fileExtension === 'pdf' ? 'raw' : 'image'
    }
  }
})

export const multerUpload = multer({ storage: storage })
