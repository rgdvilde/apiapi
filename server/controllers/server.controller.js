const RedisService = require('../services/redis.service')
const ApiModel = require('../db/models/api.db.model')
const CollectionModel = require('../db/models/collection.model')
const RecordModel = require('../db/models/record.db.model')

let delay = 300
let samplers = {}

const sampleApis = (collectionId) => {
  return CollectionModel.findById(collectionId).then((res) => {
    console.log(res)
  })
}

module.exports = {
  flushCache (req, res) {
    RedisService.flushDb().then((result) => {
      return res.json({ ok: 1, result })
    }).catch(err => res.json({ ok: 0, ...err }))
  },
  startSampling (req, res) {
  	const { body } = req
  	const { collectionId, base, sampleRate } = body
    clearInterval(samplers[collectionId])
  	const collectionSampler = setInterval(() => {
	  	CollectionModel.findById(collectionId).then((res) => {
	    	const { apis } = res
        delay = sampleRate
        console.log('sampleRate is ' + delay)
	    	apis.forEach((apiId) => {
          ApiModel.findById(apiId).then((res) => {
            res.invokeStream().then((res) => {
              const { changeHash, changedObjectsArray } = res
              const records = changedObjectsArray.map((record) => {
                return new RecordModel(record)
              })
              records.forEach((r) => {
                ApiModel.updateOne({ _id: apiId }, { $push: { records: r }, changeHash })
                  .exec()
                  .then(() => {
                    return r.save()
                  })
                  .catch(err => console.log(err))
              })
              CollectionModel.updateOne({ _id: collectionId }, { lastSampled: Date.now(), base })
                .exec()
            })
          })
	    	})
	  	})
    }, sampleRate * 1000)
    samplers[collectionId] = collectionSampler
    res.json({ ok: 1 })
  },
  stopSampling (req, res) {
  	const { body } = req
  	const { collectionId } = body
  	clearInterval(samplers[collectionId])
    res.json({ ok: 1 })
  },
  clearSampling (req, res) {
  	const { body } = req
  	const { collectionId } = body
  	CollectionModel.findById(collectionId).then((res) => {
    	const { apis } = res
    	apis.forEach((apiId) => {
         	ApiModel.findById(apiId).then((res) => {
          ApiModel.updateOne({ _id: apiId }, { records: [] })
            .exec()
             	ApiModel.updateOne({ _id: apiId }, { changeHash: {} })
               	.exec()
         	})
    	})
  	})
    samplers = {}
    res.json({ ok: 1 })
  }
}
