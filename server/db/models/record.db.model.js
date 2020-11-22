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
  lat: {
    type: Number,
    required:false
  },
  lon: {
    type: Number,
    required: false
  },
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true
  },
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: '100m' }
  }
})

const RecordModel = mongoose.model('Record', RecordSchema)

RecordModel.addRecords = (models) => {
  models.forEach(model => model.save())
}
RecordModel.addRecord = model => model.save()
RecordModel.getAll = () => RecordModel.find({})

module.exports = RecordModel
