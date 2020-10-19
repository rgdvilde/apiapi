const express = require('express')
const ValidatorController = require('../controllers/validator.controller')

const router = express.Router()

router.post('/', ValidatorController.validate)

module.exports = router
