const express = require('express')
const ServerController = require('../controllers/server.controller')

const router = express.Router()

router.post('/flush', ServerController.flushCache)
router.post('/sample/start', ServerController.startSampling)
router.post('/sample/stop', ServerController.stopSampling)
router.post('/sample/clear', ServerController.clearSampling)
module.exports = router
