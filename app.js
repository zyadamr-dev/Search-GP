import express from 'express'
import dotenv from 'dotenv'
import searchRoutes from './routes/search.route.js'
import cors from 'cors'

export const app = express()
dotenv.config()

const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

app.use('/api/v1/search', searchRoutes)

app.listen(port, () => {
    console.log(`Server is running on ${port}`)
})