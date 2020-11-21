const mongoose = require('mongoose')

const RecordSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  typeOf: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5m' }
  }
})

const RecordModel = mongoose.model('Record', RecordSchema)

RecordModel.addRecords = (models) => {
  models.forEach(model => model.save())
}
RecordModel.addRecord = model => model.save()
RecordModel.getAll = () => RecordModel.find({})

module.exports = RecordModel
