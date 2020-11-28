const express = require('express')
const collectionController = require('../controllers/collection.controller')

const router = express.Router()

router.get('/l/:id', collectionController.getLocalContext)
router.get('/g/:id', collectionController.getGlobalContext)

module.exports = router
