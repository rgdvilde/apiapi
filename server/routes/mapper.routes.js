const express = require('express')
const MapperController = require('../controllers/mapper.controller')

const router = express.Router()

router.post('/', MapperController.map)
router.post('/validate', MapperController.mapValidate)

module.exports = router
