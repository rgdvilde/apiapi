const express = require('express')
const DataController = require('../controllers/data.controller')

const router = express.Router()

router.get('/', DataController.getAll)
router.get('/raw/:id', DataController.getRawDataFromApi)
router.get('/:id', DataController.getForCollection)
router.get('/:id/:zoom/:x/:y', DataController.getForCollectionSlippyTile)

module.exports = router
