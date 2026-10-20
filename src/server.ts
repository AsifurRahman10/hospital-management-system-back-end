import app from './app'
import { seedSuperAdmin } from './app/utils/seed'

const server = async () => {
  try {
    await seedSuperAdmin()
    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server is running on http://localhost:${process.env.PORT || 5000}`
      )
    })
  } catch (error) {
    console.log(error)
  }
}

server()
