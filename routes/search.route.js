import express from 'express'
import SearchController from '../controllers/search.controller.js'
import { upload } from '../configs/multer.js'

const router = express.Router()

router.post('/image', upload.single('image'), SearchController.searchByImage)

router.post('/text', SearchController.searchByText)

router.post('/combined',upload.single('image'), SearchController.searchByImageAndText)

router.post('/:id', SearchController.findSimilarById)

export default router