const mongoose = require('mongoose')
const axios = require('axios').default
const hash = require('object-hash')
const jsonld = require('jsonld')
const jp = require('jsonpath')
const { flattenDepth } = require('lodash')
const RedisService = require('../../services/redis.service')
const DataModelModel = require('./datamodel.db.model')
const ApiModel = require('./api.db.model')
const RecordModel = require('./record.db.model')
const UploadModel = require('./upload.model')
const fs = require('fs')
const Queries = require('../../queries')


const CollectionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  lastSampled: {
    type: Date,
    required: false
  },
  base: {
    type: String,
    required: false
  },
  apis: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Api' }],
  uploads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }],
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DataModel',
    required: true
  }
})

const PAGESIZE = 5

CollectionSchema.methods.invokeApis = function invokeCollectionApis () {
  return DataModelModel.findById(this.model)
    .exec()
    .then((model) => {
      const apiPromise = ApiModel.find({
        '_id': { $in: this.apis }
      })
        .exec()
        .then((apis) => {
          return Promise.all(apis.map(api => api.invoke(model)))
        })
      const uploadsPromise = UploadModel.find({
        '_id': { $in: this.uploads }
      })
        .exec()
        .then((uploads) => {
          return Promise.all(uploads.map(up => up.invoke()))
        })
      return Promise.all([apiPromise, uploadsPromise])
    }).then(results => flattenDepth(results, 2))
}

CollectionSchema.methods.getApiStreams = async function getCollectionApiStreams (x, y, z, page, unixtime) {
  let records = []
  let pageUrl = ''
  let cached = false
  let cacheRes = {}
  return DataModelModel.findById(this.model)
    .exec()
    .then((model) => {
      const apiPromise = ApiModel.find({
        '_id': { $in: this.apis }
      })
        .exec()
        .then(async(apiss) => {
          console.log(x,y,z)
          if(x) {x = parseInt(x)}
          if(y) {y = parseInt(y)}
          if(z) {z = parseInt(z)}

          const xyz = x&&y&&z
          const totalRecords= await Queries.q_getRecordCount(this._id,x,y,z) 
          const maxPage = parseInt(Math.ceil(totalRecords/PAGESIZE)) - 1 > 0 ? parseInt(Math.ceil(totalRecords/PAGESIZE)) - 1 : 0
          if(!page){
            page = maxPage
          }
          else if (parseInt(page) > maxPage)
          {
            return []
          }
          else {
            page = parseInt(page)
          }
          if(unixtime && xyz){
            page = (Math.floor(await Queries.olderRecordsXYZ(this._id,parseInt(unixtime),x,y,z)/PAGESIZE))
          }
          else if(unixtime){
            page = (Math.floor(await Queries.olderRecords(this._id,parseInt(unixtime))/PAGESIZE))
          }
          pageUrl = this.base + '/api/data/' + this._id + '/' + page +'/stream' + (xyz?'/'+z+'/'+x+'/'+y:'')

          if(page<maxPage){
            const cachedResponse = await RedisService.getData(pageUrl)
            if(cachedResponse) {
              console.log('this is the cached data')
              console.log(cachedResponse)
              cached = true
              cacheRes = JSON.parse(cachedResponse)
              return {}
            }
          }
          console.log('the page number is:' + page)
          return Queries.q_getFragmentIds(this._id,page*PAGESIZE,(page+1)*PAGESIZE,x,y,z).then(result => {
            records.push(result)
            result = result.map(r => {return ''+r._id})
            return Promise.all(apiss.map((api) => {
              return ApiModel.findById(api._id)
                .exec()
                .then((papi) => {
                  return papi.getStream(this, model, result).then(resss=>{
                    console.log('dit is result van ret')
                    console.log(resss)
                    return resss
                  })
                })
            }))
          })
          .catch(err => {console.log(err)})
        })
      const uploadsPromise = UploadModel.find({
        '_id': { $in: this.uploads }
      })
        .exec()
        .then((uploads) => {
          return Promise.all(uploads.map(up => up.invoke()))
        })
      return Promise.all([apiPromise, uploadsPromise])
    }).then(results => {
              console.log('dit is results')
        console.log(results)
        if(cached){return cacheRes}

      return DataModelModel.findById(this.model)
      .exec()
      .then((model) => {
        const allData = flattenDepth(results, 2)
        return constructMeta(this,model,records,page,x,y,z).then(meta => {
          console.log('dit zijn de ids van alle data')
          console.log(allData)
          allData.forEach(dat => {console.log(dat['@id'])})
          console.log('contexts')
          console.log(model)
          console.log(model.localContext)
          console.log(model.globalContext)
          return transformStream(allData, this, model.localContext, model.globalContext, meta,page).then(transformedStream => {
            console.log('dit wordt gesaved naar redis')
            console.log(JSON.stringify(transformedStream))
            console.log(pageUrl)
            RedisService.setData(pageUrl,JSON.stringify(transformedStream))
            return transformedStream
          })

        })
      })
    })
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

const constructMeta = (collection,model,data,page, x,y,z) => {
  const {latPath: shaclLatPath, lonPath: shaclLonPath} = model
  console.log('data')
  console.log(data)
  if (data.length < 1){
    return new Promise((res,rej)=>{res({})})
  }
  const {_id:collectionId, base} = collection
  const xyz = x&&y&&z
  const NodeIdBase = base + '/api/data/' + collectionId
  const nextPageURI = NodeIdBase + '/' + (page + 1) + '/stream' + (xyz ? '/' + z + '/' + x + '/' + y : '')
  const previousPageURI = NodeIdBase +  '/' + (page - 1) + '/stream' + (xyz ? '/' + z + '/' + x + '/' + y : '')
  const traverseNodeIdBase = base + '/api/data/' + collectionId + '/stream/'
  const metaPromiseQueue = []

  const promiseWrapper = (promise, name) => {
    return promise.then((result) => {
      return {
        name,
        result
      }
    })
  }

  const timeMM = []
  console.log('dit zijn de records van alle data samen')
  console.log(data)
  data = data[0]
  data.forEach((r) => {
    const { id, contents, batch } = r
    if (!timeMM[0]) {
      timeMM[0] = batch
      timeMM[1] = batch
    }
    if (batch < timeMM[0]) {
      timeMM[0] = batch
    }
    if (batch > timeMM[1]) {
      timeMM[1] = batch
    }
    })  
  console.log('dit is de time dict')
  console.log(timeMM)
  const pagePromise = new Promise((resolve, reject) => {
    const calcPageCount = (page, size, total) => {
      const before = page * size
      const after = (total - (page + 1) * size) > 0 ? total - (page + 1) * size : 0
      return [before, after]
    }
    if (xyz) {
      Queries.q_getRecordCount(collectionId,x, y, z).then((result) => {
        resolve(calcPageCount(page, PAGESIZE, result))
      })
    } else {
      Queries.q_getRecordCount(collectionId).then((result) => {
        resolve(calcPageCount(page, PAGESIZE, result))
      })
    }
  })
  console.log('coordinates are')
  console.log(xyz)
  console.log(x)
  console.log(y)
  console.log(z)
  console.log(x&&y&&z)
  if (xyz) {
    metaPromiseQueue.push(promiseWrapper(Queries.q_getRecordCount(collectionId,x - 1, y, z), 'lessLon'))
    metaPromiseQueue.push(promiseWrapper(Queries.q_getRecordCount(collectionId,x + 1, y, z), 'greaterLon'))
    metaPromiseQueue.push(promiseWrapper(Queries.q_getRecordCount(collectionId,x, y + 1, z), 'lessLat'))
    metaPromiseQueue.push(promiseWrapper(Queries.q_getRecordCount(collectionId,x, y - 1, z), 'greaterLat'))
  }
  metaPromiseQueue.push(promiseWrapper(pagePromise, 'Page'))
  return Promise.all(metaPromiseQueue).then((result) => {
    resultMap = {}
    result.forEach((entry) => {
      resultMap[entry.name] = entry.result
    })
    let meta = {}
    if (resultMap.Page[0] > 0) {
      meta = {
        ...meta,
        'tree:relation': [
          ...(meta['tree:relation'] ? meta['tree:relation'] : []),
          {
            '@type': 'tree:LessThanOrEqualRelation',
            'tree:node': previousPageURI,
            'sh:path': {
              '@list': ['prov:generatedAtTime']
            },
            'tree:value': new Date(timeMM[0]).toISOString(),
            'tree:remainingItems': resultMap.Page[0]
          }
        ]
      }
    }
    if (resultMap.Page[1] > 0) {
      meta = {
        ...meta,
        'tree:relation': [
          ...(meta['tree:relation'] ? meta['tree:relation'] : []),
          {
            '@type': 'tree:GreaterThanOrEqualThanRelation',
            'tree:node': nextPageURI,
            'sh:path': {
              '@list': ['prov:generatedAtTime']
            },
            'tree:value': new Date(timeMM[1]).toISOString(),
            'tree:remainingItems': resultMap.Page[1]
          }
        ]
      }
    }
    if (xyz) {
      const parsedShaclLonPath = {
        '@list': shaclLonPath
      }
      const parsedShaclLatPath = {
        '@list': shaclLatPath
      }

      const cordinates = calculateSquare(x,y,z)

      meta = {
        ...meta,
        'xyz': [x, y, z],
        'tree:relation': [
          ...(meta['tree:relation'] ? meta['tree:relation'] : []),
          {
            '@type': 'tree:LessThanRelation',
            'tree:node': traverseNodeIdBase + z + '/' + (x - 1) + '/' + y,
            'sh:path': parsedShaclLonPath,
            'tree:value': cordinates['00'][0],
            'tree:remainingItems': resultMap.lessLon
          },
          {
            '@type': 'tree:GreaterThanRelation',
            'tree:node': traverseNodeIdBase + z + '/' + (x + 1) + '/' + y,
            'sh:path': parsedShaclLonPath,
            'tree:value': cordinates['10'][0],
            'tree:remainingItems': resultMap.greaterLon
          },
          {
            '@type': 'tree:LessThanRelation',
            'tree:node': traverseNodeIdBase + z + '/' + x + '/' + (y + 1),
            'sh:path': parsedShaclLatPath,
            'tree:value': cordinates['00'][1],
            'tree:remainingItems': resultMap.lessLat
          },
          {
            '@type': 'tree:GreaterThanRelation',
            'tree:node': traverseNodeIdBase + z + '/' + x + '/' + (y - 1),
            'sh:path': parsedShaclLatPath,
            'tree:value': cordinates['01'][1],
            'tree:remainingItems': resultMap.greaterLat
          }
        ]
      }
    }
    return meta
  })
  
}

const notBlank = (obj) => {
  if ('@id' in obj) {
    const { '@id': id } = obj
    if (!(id.slice(0, 2) === '_:')) {
      return true
    }
  }
  return false
}

const transformStream = async (obj, collection, lc, gc, meta,page) => {
  const { base, '_id': collectionId } = collection
  console.log('dit is de data die binnekomt bij de transform stream')
  console.log(obj)
  const versionedData = obj.map((en) => {
    if (notBlank(en)) {
      const { '@id': id } = en
      en['@id'] = decodeURIComponent(id)
      // console.log('dit is en')
      // console.log(en)
      const reg = /.+?(?=\\?generatedAtTime=)/
      const res = reg.exec(decodeURIComponent(id))
      if (!res || res.length < 1) {
        console.log('dit is de invalid res')
        console.log(id)
      }
      else {
        en['dcterms:isVersionOf'] = res[0]
      }
    }
    return en
  })
  const globalContext = [
    base + '/api/context/g/' + collectionId,
    {
      'prov': 'http://www.w3.org/ns/prov#',
      'tree': 'https://w3id.org/tree#',
      'sh': 'http://www.w3.org/ns/shacl#',
      'dcterms': 'http://purl.org/dc/terms/',
      'tree:member': {
        '@type': '@id'
      },
      'memberOf': {
        '@reverse': 'tree:member',
        '@type': '@id'
      },
      'tree:node': {
        '@type': '@id'
      }
    }]
  let suf = ''
  if (meta.xyz) {
    suf = '/' + meta.xyz[2] + '/' + meta.xyz[0] + '/' + meta.xyz[1]
  }
  const nodeId = base + '/api/data/' + collection._id + '/'+page + '/stream' + suf
  const nodePartOf = base + '/api/data/' + collection._id + '/stream'
  const compactedData = await Promise.all(versionedData.map(async (en) => {
    if (notBlank(en)) {
      en = await jsonld.compact(en, JSON.parse(lc))
      en['@context'] = base + '/api/context/l/' + collectionId
    }
    return en
  }))
  const out = {
    '@context': globalContext,
    '@included': compactedData,
    '@id': nodeId,
    '@type': 'tree:Node',
    'dcterms:isPartOf': {
      '@id': nodePartOf,
      '@type': 'tree:Collection'
    }
  }
  if (meta['tree:relation']) {
    out['tree:relation'] = meta['tree:relation']
  }
  return out
}

const CollectionModel = mongoose.model('Collection', CollectionSchema)
Queries.loadCollection(CollectionModel)
module.exports = CollectionModel
