import app from './app'
import { seedSuperAdmin } from './app/utils/seed'

const server = async () => {
  try {
    await seedSuperAdmin()
    app.listen(process.env.PORT || 5000, () => {
      console.log('server is running on port ' + (process.env.PORT || 5000))
    })
  } catch (error) {
    console.log(error)
  }
}

server()
