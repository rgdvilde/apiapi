const { map, flatten } = require('lodash')
const ApiModel = require('../db/models/api.db.model')
const CollectionModel = require('../db/models/collection.model')

module.exports = {
  getAll (req, res, next) {
    return ApiModel.getAll().then((allApis) => {
      const resultPromises = map(allApis, api => api.invoke())
      return Promise.all(resultPromises)
    }).then(allResults => res.send(allResults)).catch(next)
  },
  getForCollection (req, res, next) {
    const { id: collectionId } = req.params
    CollectionModel.findById(collectionId).then((doc) => {
      doc.invokeApis().then((result) => {
        res.set('Content-Type', 'application/ld+json')
        res.json(result)
      })
    }).catch(next)
  },
  getStreamForCollection (req, res, next) {
    const { id: collectionId, x, y, z, page, unixtime } = req.params
    CollectionModel.findById(collectionId).then((doc) => {
      doc.getApiStreams(x, y, z, page, unixtime).then((result) => {
        res.set('Content-Type', 'application/ld+json')
        res.json(result)
      })
    }).catch(next)
  },
  getFromApi (req, res, next) {
    const { id } = req.params
    ApiModel.findById(id).then((doc) => {
      doc.invoke().then(result => res.json(result))
    }).catch(next)
  },
  getRawDataFromApi (req, res, next) {
    const { id } = req.params
    ApiModel.findById(id).then((api) => {
      api.raw().then(result => res.json(result))
    }).catch(next)
  }
}
