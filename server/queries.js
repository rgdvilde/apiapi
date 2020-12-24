let CollectionModel
let ApiModel
let RecordModel
let ModelModel

exports.loadCollection = (m) => { CollectionModel = m }
exports.loadApi = (m) => { ApiModel = m }
exports.loadRecord = (m) => { RecordModel = m }
exports.loadModel = (m) => { ModelModel = m }

exports.q_getFragmentIds = (id, skip, limit, x, y, z) => {
  console.log('dit is skip en limit')
  console.log(skip)
  console.log(limit)
  const xyz = x & y & z
  if (xyz) {
    return q_getFragmentIdsXYZ(id, skip, limit, x, y, z).then((r) => { return r })
  } else {
    // return new Promise((res,rej)=> {res(true)})
    	return CollectionModel.aggregate(
    	  [
    	    { '$match': {
    	      '_id': id
    	    } },
    	    { '$unwind': '$apis' },
    	    { '$project': {
    	      '_id': '$apis'
    	    } },
    	    { '$lookup': {
    	      'from': ApiModel.collection.name,
    	      'localField': '_id',
    	      'foreignField': '_id',
    	      'as': 'apis'
    	    } },
    	    { '$unwind': '$apis' },
    	    { '$project': {
    	      '_id': '$apis._id',
    	      'records': '$apis.records'
    	    } },
    	    { '$lookup': {
    	      'from': RecordModel.collection.name,
    	      'localField': 'records',
    	      'foreignField': '_id',
    	      'as': 'records'
    	    } },
    	    { '$unwind': '$records' },
    	    { '$project': {
    	      '_id': '$records._id',
    	      'lat': '$records.lat',
    	      'lon': '$records.lon',
    	      'batch': '$records.batch'
    	    } },
    	    {
    	      '$sort': { 'batch': 1, 'id': 1 }
    	    },
    	    { '$limit': limit },
    	    { '$skip': skip }
    	  ])
    	  .exec()
    	  .catch((err) => { console.log(err) })
    	  .then((result) => {
      	console.log('this is the amount of recors selected')
      	console.log(result.length)
      	console.log(result)
    	    return result
    	  })
    	  .catch((err) => { console.log(err) })
  }
}

exports.q_getFragmentIdsNoLimit = (id, skip) => {
  // return new Promise((res,rej)=> {res(true)})
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$project': {
        '_id': '$records._id',
        'lat': '$records.lat',
        'lon': '$records.lon',
        'batch': '$records.batch'
      } },
      {
        '$sort': { 'batch': 1, 'id': 1 }
      },
      { '$skip': skip }
    ])
    .exec()
    .catch((err) => { console.log(err) })
    .then((result) => {
      return result
    })
    .catch((err) => { console.log(err) })
}

const calculateSquare = (x, y, z) => {
  x = parseInt(x)
  y = parseInt(y)
  z = parseInt(z)
  const tile2long = (x, z) => {
    return (x / 2 ** z * 360 - 180)
  }
  const tile2lat = (y, z) => {
    const n = Math.PI - 2 * Math.PI * y / 2 ** z
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))))
  }
  return {
    '00': [tile2long(x, z), tile2lat(y + 1, z)],
    '10': [tile2long(x + 1, z), tile2lat(y + 1, z)],
    '01': [tile2long(x, z), tile2lat(y, z)],
    '11': [tile2long(x + 1, z), tile2lat(y, z)]
  }
}

const q_getFragmentIdsXYZ = (id, skip, limit, x, y, z) => {
  // return new Promise((res,rej)=> {res(true)})
  const cor = calculateSquare(x, y, z)
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$project': {
        '_id': '$records._id',
        'lat': '$records.lat',
        'lon': '$records.lon',
        'batch': '$records.batch'
      } },
      { '$match': {
        'lon': { $gt: cor['00'][0], $lt: cor['10'][0] },
        'lat': { $gt: cor['00'][1], $lt: cor['01'][1] }
      } },
      {
        '$sort': { 'batch': 1, 'id': 1 }
      },
      { '$limit': limit },
      { '$skip': skip }
    ])
    .exec()
    .catch((err) => { console.log(err) })
    .then((result) => {
      	console.log('this is the amount of recors selected with XYZ selection')
      	console.log(result.length)
      	console.log(JSON.stringify(result))
      console.log('coordinates are ' + JSON.stringify(cor))
      return result
    })
    .catch((err) => { console.log(err) })
}

exports.q_getApiRecords = (id, records) => {
  return ApiModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$match': {
        'records._id': { $in: records }
      }
      },
      {
        '$sort': { 'records.batch': 1, 'records.id': 1 }
      },
      { '$group': {
        '_id': '$_id',
        'records': { '$push': '$records' }
      } }
    ])
    .exec()
    .then((result) => {
      return result
    })
}

const q_i_getRecordCountES = (id) => {
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$unwind': '$records' },
      {
        $count: 'record_amount'
      }
    ])
    .exec()
    .then((result) => {
      console.log('counting result')
      console.log(result)
      if (!result[0]) { return 0 }
      return result[0].record_amount
    })
}

const q_i_getRecordCountESXYZ = (id, x, y, z) => {
  const cor = calculateSquare(x, y, z)
  console.log(cor['00'][0])
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$project': {
        '_id': '$records._id',
        'lat': '$records.lat',
        'lon': '$records.lon',
        'batch': '$records.batch'
      } },
      { '$match': {
        'lon': { $gt: cor['00'][0], $lt: cor['10'][0] },
        'lat': { $gt: cor['00'][1], $lt: cor['01'][1] }
      } },
      {
        $count: 'record_amount'
      }
      // {
      //   '$sort': { 'batch': 1, 'id': 1 }
      // },
      // { '$limit': limit },
      // { '$skip': skip },
    ])
    .exec()
    .then((result) => {
      console.log(result)
      console.log('xyz count results are' + (result[0] ? result[0].record_amount : 0))
      if (!result[0]) { return 0 }
      return result[0].record_amount
    })
}

exports.q_getRecordCount = (id, x, y, z) => {
  const xyz = x && y && z
  if (!xyz) {
    	return q_i_getRecordCountES(id).then((result) => {
    	  if (result) { return result } else { return 0 }
    	})
  } else {
    console.log('retrieve amount of XYZ')
    return q_i_getRecordCountESXYZ(id, x, y, z).then((result) => {
      if (result) {
        console.log('de amount of records xyz is ' + result)
        return result
      } else { return 0 }
    })
  }
}

exports.olderRecords = (id, unixtime) => {
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$project': {
        '_id': '$records._id',
        'lat': '$records.lat',
        'lon': '$records.lon',
        'batch': '$records.batch'
      } },
      { '$match': {
        'batch': { $lt: unixtime }
      } },
      {
        $count: 'record_amount'
      }
    ])
    .exec()
    .then((result) => {
      if (!result[0]) {
        return 0
      } else {
        return result[0].record_amount
      }
    })
}

exports.olderRecordsXYZ = (id, unixtime, x, y, z) => {
  const cor = calculateSquare(x, y, z)
  console.log('time')
  console.log(unixtime)
  console.log(x, y, z)
  return CollectionModel.aggregate(
    [
      { '$match': {
        '_id': id
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis'
      } },
      { '$lookup': {
        'from': ApiModel.collection.name,
        'localField': '_id',
        'foreignField': '_id',
        'as': 'apis'
      } },
      { '$unwind': '$apis' },
      { '$project': {
        '_id': '$apis._id',
        'records': '$apis.records'
      } },
      { '$lookup': {
        'from': RecordModel.collection.name,
        'localField': 'records',
        'foreignField': '_id',
        'as': 'records'
      } },
      { '$unwind': '$records' },
      { '$project': {
        '_id': '$records._id',
        'lat': '$records.lat',
        'lon': '$records.lon',
        'batch': '$records.batch'
      } },
      { '$match': {
        'batch': { $lt: unixtime },
        'lon': { $gt: cor['00'][0], $lt: cor['10'][0] },
        'lat': { $gt: cor['00'][1], $lt: cor['01'][1] }
      } },
      {
        $count: 'record_amount'
      }
    ])
    .exec()
    .then((result) => {
      console.log('dit zijn de records die ouder zijn')
      console.log(result)
      if (!result[0]) {
        return 0
      } else {
        return result[0].record_amount
      }
    })
}
