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
const COMPACT = false
const PAGESIZE = 5
const PAGE = 0

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

const transformStream = (obj, collection,c, meta) => {
  const {base} = collection
  return new Promise(function (myResolve, myReject) {
    console.log('transformStream')
    return Promise.all(obj.map((en) => {
      if ('@id' in en) {
        const id = en['@id']
        if (!(id.slice(0, 2) === '_:')) {
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
      let suf = ''
      if(meta['xyz']){
        suf = '/' + meta['xyz'][2] + '/' + meta['xyz'][0] + '/' + meta['xyz'][1]
      }
      const nodeId = base + '/api/data/'+ collection._id + '?SampledAt=' + collection.lastSampled.toISOString() + '/stream' + suf
      const nodePartOf = base + '/api/data/'+ collection._id + '/stream'
      const out = {
        '@context': context,
        '@included': included,
        '@id': nodeId,
        '@type': 'tree:Node',
        'dcterms:isPartOf': {
          '@id': nodePartOf,
          '@type': 'tree:Collection'
        },
      }
      if (meta['tree:relation']) {
        out['tree:relation'] = meta['tree:relation']
      }
      myResolve(out)
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
  x = parseInt(x)
  y = parseInt(y)
  z = parseInt(z)
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

ApiSchema.methods.getStream = function getApiStream (collection, model,x,y,z) {
  const { records, rml, name, header } = this
  const { base } = collection
  const xyz = x && y && z
  x = parseInt(x)
  y = parseInt(y)
  z = parseInt(z)
  let  cordinates = {}
  if (x && y && z) {
    cordinates = calculateSquare(x,y,z)
  }
  const recordQuery = () => {
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
       "records._id": { $in: records}
      } 
      },
      {
        "$sort": { "records.batch": 1, "records.id": 1 }
      },
      {"$limit": (PAGE+1)*PAGESIZE},
      {"$skip": PAGE*PAGESIZE},
      { "$group": {
        "_id": "$_id",
        "records": { "$push": "$records" }
      }}
    ])
    .exec()
    .then(result => {
      return result
    })
  }

  const resultQueryXYZcount = (x,y,z) => {
    return recordQueryXYZ(x,y,z).then(result => {
      if(!result[0]){
        return 0
      }
      else {
        return result[0]['records'].length
      }
    })
  }

  const recordQueryXYZ = (x,y,z) => {
    console.log(x,y,z)
    console.log(records)
    cor = calculateSquare(x,y,z)
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
      }},
      {
        "$sort": { "records.batch": 1, "records.id": 1 }
      },
      {"$limit": (PAGE+1)*PAGESIZE},
      {"$skip": PAGE*PAGESIZE},
      { "$group": {
        "_id": "$_id",
        "records": { "$push": "$records" }
      }}
    ])
    .exec()
    .then(result => {
      console.log(result)
      return result
    })
  }
  const query = (x && y && z) ? recordQueryXYZ(x,y,z) : recordQuery()
  return query.then(result => {
      // "tags" is now filtered by condition and "joined"
      let erecords = []
      if(result[0]){
        erecords = result[0]['records']
      }
      const { context } = model
      const recordDict = {}
      erecords.forEach((r) => {
        const { id, content, batch } = r
        const pcontent = JSON.parse(content)
        pcontent.recordid = id
        if(!recordDict[batch]){
          recordDict[batch] = []
        }
        recordDict[batch].push(pcontent)
      })
      const dataDict = {}
      Object.keys(recordDict).forEach(key => {
        dataDict[key] = {
          ...header,
          'records': recordDict[key]
        }
      })

      const traverseNodeIdBase = base + '/api/data/' + collection._id + '/stream/'
      const metaPromiseQueue = []
      if(xyz){
        metaPromiseQueue.push(resultQueryXYZcount(x-1,y,z))
        metaPromiseQueue.push(resultQueryXYZcount(x+1,y,z))
        metaPromiseQueue.push(resultQueryXYZcount(x,y+1,z))
        metaPromiseQueue.push(resultQueryXYZcount(x,y-1,z))
      }
      return Promise.all(metaPromiseQueue).then(result => {
        console.log(result)
        let meta = {}
        if(xyz) {
        meta = {
          'xyz': [x,y,z],
          'tree:relation' : [
          {
              "@type": "tree:LessThanRelation",
              "tree:node": traverseNodeIdBase + z + '/' + (x-1) + '/' + y,
              "sh:path": "pathToLocationLon",
              "tree:value": cordinates['00'][0],
              "tree:remainingItems": result[0]
          },
          {
              "@type": "tree:GreaterThanRelation",
              "tree:node": traverseNodeIdBase + z + '/' + (x+1) + '/' + y,
              "sh:path": "pathToLocationLon",
              "tree:value": cordinates['10'][0],
              "tree:remainingItems": result[1]
          },
          {
              "@type": "tree:LessThanRelation",
              "tree:node": traverseNodeIdBase + z + '/' + x + '/' + (y+1),
              "sh:path": "pathToLocationLat",
              "tree:value": cordinates['00'][1],
              "tree:remainingItems": result[2]
          },
          {
              "@type": "tree:GreaterThanRelation",
              "tree:node": traverseNodeIdBase + z + '/' + x + '/' + (y-1),
              "sh:path": "pathToLocationLat",
              "tree:value": cordinates['01'][1],
              "tree:remainingItems": result[3]
          }
        ]
        }
        }

        console.log(meta)
        return mapRMLsplit(dataDict, rml, rmlmapperPath, tempFolderPath, name).then((out) => {
          const outconcat = [].concat.apply([], out);
          if (EXPAND) {
            return transformStream(expandDepth(outconcat),collection,JSON.parse(context),meta).then(res=> {
              return res
            })
          }
          else {
            return transformStream(outconcat,collection,JSON.parse(context),meta).then(res=> {
              return res
            })
          }
        }) 
      })
   
    })
}

const getDeepKeys = (obj, suffix) => {
    var keys = [];
    for(var key in obj) {
      if(key==='@id'){
      if ((obj[key].slice(0, 2) === '_:')) {
          const newId = obj[key] + suffix
          obj[key] = newId
        }
      }
        keys.push(key);
        if(typeof obj[key] === "object") {
            var subkeys = getDeepKeys(obj[key], suffix);
            keys = keys.concat(subkeys.map(function(subkey) {
                return key + "." + subkey;
            }));
        }
    }
    return keys;
}

const mapRMLsplit = (dataDict,rml,rmlmapperPath,tempFolderPath,name) => {
  return Promise.all(Object.keys(dataDict).map(key => {
    const data = dataDict[key]
    return mapRML(data, rml, rmlmapperPath, tempFolderPath, name).then(out => {
      getDeepKeys(out,key)
      return out
    })
  }))
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
      const batch = Date.now()
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
          'id': recordid + '?generatedAtTime=' + new Date().toISOString(),
          'hash': recordHash,
          'content': JSON.stringify(record),
          'typeOf': recordid,
          batch,
          lat,
          lon,
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
