const express = require('express')
const DataController = require('../controllers/data.controller')

const router = express.Router()

router.get('/', DataController.getAll)
router.get('/raw/:id', DataController.getRawDataFromApi)
router.get('/:id', DataController.getForCollection)
router.get('/:id/stream', DataController.getStreamForCollection)
router.get('/:id/stream/:z/:x/:y', DataController.getStreamForCollection)
router.get('/:id/:page/stream', DataController.getStreamForCollection)
router.get('/:id/:page/stream/:z/:x/:y', DataController.getStreamForCollection)

module.exports = router
