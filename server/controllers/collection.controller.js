const CollectionModel = require('../db/models/collection.model')

module.exports = {
  findAll (req, res, next) {
    return CollectionModel.find({})
      .exec()
      .then(results => res.json(results))
      .catch(err => next(err))
  },
  findById (req, res, next) {
    const { id } = req.params
    return CollectionModel.findById(id)
      .populate('apis')
      .populate('model')
      .populate('uploads')
      .exec()
      .then(result => res.json(result))
      .catch(err => next(err))
  },
  updateSampleRate (req, res, next) {
    console.log(req)
    const { body } = req
    CollectionModel.updateOne({ _id: body.collectionId }, { sampleRate: body.sampleRate })
      .exec()
      .then(doc => res.json(doc))
      .catch(err => next(err))
  },
  create (req, res, next) {
    const newCollection = new CollectionModel(req.body)
    newCollection.save()
      .then(doc => res.json(doc))
      .catch(err => next(err))
  },
  updateOne (req, res, next) {
    const { body, params: { id } } = req
    CollectionModel.replaceOne({ _id: id }, body)
      .exec()
      .then(doc => res.json(doc))
      .catch(err => next(err))
  },
  actualUpdateOne (req, res, next) {
    const { body, params: { id } } = req
    CollectionModel.updateOne({ _id: id }, body)
      .exec()
      .then(doc => res.json(doc))
      .catch(err => next(err))
  },
  deleteOne (req, res, next) {
    const { id } = req.params
    CollectionModel.findByIdAndDelete(id)
      .exec()
      .then(response => res.json(response))
      .catch(err => next(err))
  },
  getLocalContext (req, res, next) {
    const { id } = req.params
    CollectionModel.findById(id)
      .populate('model')
      .exec()
      .then((response) => {
        const { model } = response
        const { localContext } = model
        console.log(model)
        res.json(JSON.parse(localContext))
      })
      .catch(err => next(err))
  },
  getGlobalContext (req, res, next) {
    const { id } = req.params
    CollectionModel.findById(id)
      .populate('model')
      .exec()
      .then((response) => {
        const { model } = response
        const { globalContext } = model
        res.json(JSON.parse(globalContext))
      })
      .catch(err => next(err))
  }
}
