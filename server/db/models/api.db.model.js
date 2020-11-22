const fs = require('fs')
const N3 = require('n3')
const mongoose = require('mongoose')
const { get: getProp, set: setProp } = require('lodash')
const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const yarrrmlParser = require('@rmlio/yarrrml-parser/lib/rml-generator')
const RedisService = require('../../services/redis.service')
const HttpService = require('../../services/http.service')
const axios = require('axios').default
const hash = require('object-hash')
const RecordModel = require('./record.db.model')
const jsonld = require('jsonld')

const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'
// const rml = fs.readFileSync('./ngsimapping.ttl', 'utf-8')

const PATH_TYPES = {
  PATH: 'path',
  CONSTANT: 'constant'
}

const EXPAND = true
const COMPACT = true

module.exports.PATH_TYPES = PATH_TYPES

const ApiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false
  },
  authMethod: {
    type: String,
    default: 'open'
  },
  url: {
    type: String,
    required: true
  },
  paths: [{
    toPath: {
      // ? name of the path key
      type: String
    },
    type: {
      // ? constant or path
      type: String,
      enum: [PATH_TYPES.CONSTANT, PATH_TYPES.PATH],
      default: PATH_TYPES.CONSTANT
    },
    value: {
      // ? path to fetch from OR const data to put in
      type: String,
      default: ''
    }
  }],
  rml: {
    type: String,
    default: ''
  },
  yarrrml: {
    type: String,
    default: ''
  },
  dataPath: {
    type: String,
    default: ''
  },
  customHeaders: {},
  requestMethod: {
    type: String,
    default: 'get'
  },
  requestData: {
    type: String,
    default: ''
  },
  changeHash: {
    type: Object,
    default: {}
  },
  header: {
    type: Object,
    default: {}
  },
  records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }],
  meta: { type: Object, default: {} },
  categories: { type: Array, default: [] },
  types: { type: Array, default: [] }
})

ApiSchema.methods.raw = async function getRawData () {
  const client = new HttpService(this.url, this.customHeaders)
  const { data } = this.requestMethod === 'get'
    ? await client.get()
    : await client.post(this.requestData)
  return data
}

const mapRML = (data, rml, rmlmapperPath, tempFolderPath, name) => {
  return new Promise(function (myResolve, myReject) {
    // "Producing Code" (May take some time)
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    const sources = {
      'data.json': JSON.stringify(data)
    }
    return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
      myResolve(JSON.parse(result.output))
    })
  })
}

const mapYARRRML = (data, yarrrml, rmlmapperPath, tempFolderPath, name) => {
  return new Promise(function (myResolve, myReject) {
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    const y2r = new yarrrmlParser()
    const triples = y2r.convert(yarrrml)
    const writer = new N3.Writer({})
    writer.addQuads(triples)
    return writer.end((error, result) => {
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
      const sources = {
        'data.json': JSON.stringify(data)
      }
      return wrapper.execute(result, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
        myResolve(JSON.parse(resp.output))
      })
    })
  })
}

const mapDef = (data, paths, name) => {
  return new Promise(function (myResolve, myReject) {
    const allData = data.map((rawDataElement) => {
      return paths.reduce((acc, { toPath: pathName, value: pathValue, type: pathType }) => {
        if (pathType === PATH_TYPES.CONSTANT) {
          setProp(acc, pathName, pathValue)
        } else if (pathType === PATH_TYPES.PATH) {
          const fetchedData = getProp(rawDataElement, pathValue)
          setProp(acc, pathName, fetchedData)
        }
        return acc
      }, {})
    })
    myResolve(allData)
  })
}

const transformStream = (obj, collection,c) => {
  return new Promise(function (myResolve, myReject) {
    console.log('transformStream')
    return Promise.all(obj.map((en) => {
      if ('@id' in en) {
        const id = en['@id']
        if (!(id.slice(0, 2) === '_:')) {
          console.log(decodeURIComponent(id))
          en['@id'] = decodeURIComponent(id)
          const reg = /.+?(?=\\?generatedAtTime=)/
          const res = reg.exec(decodeURIComponent(id))
          en['dcterms:isVersionOf'] = res[0]
          if(c !== ''){
            if(COMPACT){
              return jsonld.compact(en, c).then(cdoc => {
                return(cdoc)
              })
              .catch(err => console.log(err))
            }
            else {
              en['@context'] = c

            }

          }
        }
      }
      return(en)
    }))
    .then(included => {
      const context = [{
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
      }
      ]
      myResolve( {
        '@context': context,
        '@included': included,
        '@id': 'https://example/apiaip#' + collection._id + '?SampledAt=' + collection.lastSampled,
        '@type': 'tree:Node',
        'dcterms:isPartOf': {
          '@id': 'https://example/apiaip#' + collection._id,
          '@type': 'tree:Collection'
        }
      })
    })
  })
}

const expandDepth = (j) => {
  linkMap = {}
  j.forEach((en) => {
    const { '@id': id, ...rest } = en
    if ((id.slice(0, 2) === '_:')) {
      linkMap[id] = rest
    }
  })
  const result = j.map((en) => {
    for (const at in en) {
      for (const att in en[at]) {
        if (en[at][att]['@id']) {
          if ((en[at][att]['@id'].slice(0, 2) === '_:')) {
            en[at][att] = linkMap[en[at][att]['@id']]
          }
        }
      }
    }
    return en
  })
  return result.filter(el => (el['@id'].slice(0, 2) !== '_:'))
}

calculateSquare = (x,y,z) => {
 const tile2long = (x,z) => {
  return (x/Math.pow(2,z)*360-180);
 }
 const  tile2lat = (y,z) => {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
 }
 return {
  '00' :[tile2long(x,z),tile2lat(y+1,z)],
  '10' :[tile2long(x+1,z),tile2lat(y+1,z)],
  '01' :[tile2long(x,z),tile2lat(y,z)],
  '11' :[tile2long(x+1,z),tile2lat(y,z)],
 }
}

ApiSchema.methods.raw = async function getRawData () {
  const client = new HttpService(this.url, this.customHeaders)
  const { data } = this.requestMethod === 'get'
    ? await client.get()
    : await client.post(this.requestData)
  return data
}

ApiSchema.methods.getStream = function getApiStream (collection, model) {
  const { records, rml, name, header } = this
  const cor = calculateSquare(130,85,8)

  return ApiModel.aggregate(
    [
      { "$lookup": {
        "from": RecordModel.collection.name,
        "localField": "records",
        "foreignField": "_id",
        "as": "records"
      }},
      { "$unwind": "$records" },
      { "$match": {
       "records._id": { $in: records},
       "records.lon": { $gt: cor['00'][0] , $lt: cor['10'][0] },
       "records.lat": { $gt: cor['00'][1], $lt: cor['01'][1] },
      } 
      },
      { "$group": {
        "_id": "$_id",
        "records": { "$push": "$records" }
      }}
    ])
    .exec()
    .then(result => {
      if(result[0]){
      // "tags" is now filtered by condition and "joined"
        const erecords = result[0]['records']
        const { context } = model
        const streamRecords = []
        const recordDict = {}
        erecords.forEach((r) => {
          const { id, content } = r
          const pcontent = JSON.parse(content)
          pcontent.recordid = id
          streamRecords.push(pcontent)
        })
        const data = {
          ...header,
          'records': streamRecords
        }
        return mapRML(data, rml, rmlmapperPath, tempFolderPath, name).then((out) => {
          if (EXPAND) {
            return transformStream(expandDepth(out),collection,JSON.parse(context)).then(res=> {
              return res
            })
          }
          else {
            return transformStream(out,collection,JSON.parse(context)).then(res=> {
              return res
            })
          }
        })    
      }
    })
}

ApiSchema.methods.invokeStream = function invokeApiStream (model) {
  const { changeHash, url, rml, name, dataPath } = this
  console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
  console.log('RECORDS')
  console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
  console.log(this.records)
  let newChangeHash = {}
  if (changeHash) {
    newChangeHash = changeHash
  }
  return axios.get(url)
    .then((response) => {
      // handle success
      let { data } = response
      if (dataPath) {
        data = data[dataPath]
      }
      const strippedData = {
        ...data,
        'records': []
      }
      const changedObjects = []
      data.forEach((record) => {
        // update
        const { recordid, fields } = record
        const { lat, lon } = fields
        const recordHash = hash(record)
        if (recordid in newChangeHash) {
          if (newChangeHash[recordid] === recordHash) {
            return
          }
        }
        changedObjects.push({
          'id': recordid + '?generatedAtTime=' + Date.now(),
          'hash': recordHash,
          'content': JSON.stringify(record),
          'typeOf': recordid,
          'createdAt': Date.now(),
          'lat': lat,
          'lon': lon,
          'api': this._id
        })
        newChangeHash[recordid] = recordHash
      })
      return {
        changeHash: newChangeHash,
        changedObjects,
        header: strippedData
      }
    })
    .catch((error) => {
      // handle error
      console.log(error)
    })
}

ApiSchema.methods.invoke = function invokeApi (model) {
  return RedisService.getData(this.name).then((cachedResponse) => {
    // if (cachedResponse) {
    //   return JSON.parse(cachedResponse)
    // }
    const client = new HttpService(this.url, this.customHeaders)
    const prom = this.requestMethod === 'get'
      ? client.get()
      : client.post(this.requestData)

    return prom.then(({ data: response }) => {
      const { rml, yarrrml, paths, name } = this
      let data = response
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      console.log('MAPPING ' + name)
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      if (rml == '' && yarrrml == '') {
        data = !this.dataPath ? response : getProp(response, this.dataPath)
        return mapDef(data, paths, name)
      } else if (yarrrml == '') {
        return mapRML(data, rml, rmlmapperPath, tempFolderPath, name).then((out) => {
          return out
        })
      } else {
        return mapYARRRML(data, yarrrml, rmlmapperPath, tempFolderPath, name).then((out) => {
          return out
        })
      }
    })
  })
}

const ApiModel = mongoose.model('Api', ApiSchema)
ApiModel.getAll = () => ApiModel.find({})
ApiModel.addApi = api => api.save()

module.exports = ApiModel
