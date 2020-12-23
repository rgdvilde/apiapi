const fs = require('fs')
const N3 = require('n3')
const mongoose = require('mongoose')
const { get: getProp, set: setProp } = require('lodash')
const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const yarrrmlParser = require('@rmlio/yarrrml-parser/lib/rml-generator')
const axios = require('axios').default
const hash = require('object-hash')
const jsonld = require('jsonld')
const jp = require('jsonpath')
const HttpService = require('../../services/http.service')
const RedisService = require('../../services/redis.service')
const RecordModel = require('./record.db.model')
const Queries = require('../../queries')

const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'
// const rml = fs.readFileSync('./ngsimapping.ttl', 'utf-8')

const PATH_TYPES = {
  PATH: 'path',
  CONSTANT: 'constant'
}

const EXPAND = true
const COMPACT = true
const PAGESIZE = 5

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
  urls: [{ type: String }],
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
  loc: {
    type: Object,
    default: {}
  },
  endpoints: [{type: Object}],
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

const mapRML = (sources, rml, rmlmapperPath, tempFolderPath, name) => {
  return new Promise(function (myResolve, myReject) {
    // "Producing Code" (May take some time)
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
      myResolve(JSON.parse(result.output))
    })
  })
}

const mapYARRRML = (sources, yarrrml, rmlmapperPath, tempFolderPath, name) => {
  return new Promise(function (myResolve, myReject) {
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    const y2r = new yarrrmlParser()
    const triples = y2r.convert(yarrrml)
    const writer = new N3.Writer({})
    writer.addQuads(triples)
    return writer.end((error, result) => {
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
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

const notBlank = (obj) => {
  if ('@id' in obj) {
    const { '@id': id } = obj
    if (!(id.slice(0, 2) === '_:')) {
      return true
    }
  }
  return false
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

ApiSchema.methods.raw = async function getRawData () {
  const client = new HttpService(this.url, this.customHeaders)
  const { data } = this.requestMethod === 'get'
    ? await client.get()
    : await client.post(this.requestData)
  return data
}


ApiSchema.methods.getStream = async function getApiStream (collection, model, r) {
  const { records, rml, name, header, urls, endpoints } = this
  const { base } = collection

  const srecords = (records.map(e=>{return '' + e}))
  const int_records = srecords.filter(value => {return ( r.includes(value))})
  if(int_records.length===0) {
    return []
  }

  const query = Queries.q_getApiRecords(this._id,int_records.map(reco => {return mongoose.Types.ObjectId(reco)}))
  return query.then((result) => {
    // "tags" is now filtered by condition and "joined"
    // console.log(this.name + ' heeft ' + result[0].records.length + ' results')
    let erecords = []
    if (result.length === 0) {return []}
    if (result[0]) {
      erecords = result[0].records
    }
    const { localContext, globalContext, latPath: shaclLatPath, lonPath: shaclLonPath } = model
    const recordDict = {}
    erecords.forEach((r) => {
      const { id, contents, batch } = r
      const pcontent = contents
      Object.keys(pcontent).forEach(key => {
        const c = JSON.parse(pcontent[key]['content'])
        const idpath = pcontent[key]['idPath']

        jp.value(c, idpath,id)
        console.log('dit is het id path na mapping')
        console.log(jp.query(c, idpath))
        pcontent[key]['content'] = JSON.stringify(c)
      })
      if (!recordDict[batch]) {
        recordDict[batch] = {
          'entries': []
        }
      }
      recordDict[batch].entries.push(pcontent)
    })
    sourceDict = {}
    const urlDict = {}
    Object.keys(recordDict).forEach((key) => {
      if(!(key in sourceDict)){
        sourceDict[key] = {}
      }
      urls.forEach((url, urlind) => {
        const st = 'data' + (urlind + 1) + '.json'
        urlDict[url] = st
        sourceDict[key][st] = {}
      })
      recordDict[key].entries.forEach(rec => {
        Object.keys(rec).forEach((key2) => {
          if((typeof rec[key2] === 'object') && ('url' in rec[key2])){
            const {url, header, content} = rec[key2]
            if (Object.keys(sourceDict[key][urlDict[url]]).length===0){
              sourceDict[key][urlDict[url]] = JSON.parse(header)
            }
            sourceDict[key][urlDict[url]]['records'].push(JSON.parse(content))
          }
        })
      })
    })
      return mapRMLsplit(sourceDict, rml, rmlmapperPath, tempFolderPath, name, urls).then((out) => {
        const outconcat = [].concat.apply([], out)
        console.log('na mapping ziet de data van ' + this.name + 'er zo uit')
        console.log(outconcat)
        if (EXPAND) {
          return expandDepth(outconcat)
          return transformStream(expandDepth(outconcat), collection, localContext, globalContext, meta).then((res) => {
            return res
          })
        } else {
          return transformStream(outconcat, collection, localContext, globalContext, meta).then((res) => {
            RedisService.setData(cacheName, JSON.stringify(res))
            return res
          })
        }
      })
  })
}

const relabelBlankNodes = (obj, suffix) => {
  let keys = []
  for (var key in obj) {
    if (key === '@id') {
      if ((obj[key].slice(0, 2) === '_:')) {
        const newId = obj[key] + suffix
        obj[key] = newId
      }
    }
    keys.push(key)
    if (typeof obj[key] === 'object') {
      const subkeys = relabelBlankNodes(obj[key], suffix)
      keys = keys.concat(subkeys.map(function (subkey) {
        return key + '.' + subkey
      }))
    }
  }
  return keys
}

const mapRMLsplit = (sourceDict, rml, rmlmapperPath, tempFolderPath, name, urls) => {
  return Promise.all(Object.keys(sourceDict).map((key) => {
    const sources = sourceDict[key]
    Object.keys(sources).forEach(key2 => {
    sources[key2] = JSON.stringify(sources[key2])
  })
    tempFolderPath = tempFolderPath + '/' + hash(key)
    console.log('deze data wordt gemapped bij ' + name)
    console.log(sources)
    return mapRML(sources, rml, rmlmapperPath, tempFolderPath, name).then((out) => {
      relabelBlankNodes(out, key)
      return out
    })
  }))
}

ApiSchema.methods.invokeStream = function invokeApiStream (model) {
  const { changeHash, urls, rml, name, loc, endpoints } = this
  // loc
  // endpoints
  console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
  console.log('RECORDS')
  console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
  let newChangeHash = {}
  if (changeHash) {
    newChangeHash = changeHash
  }
  const promArray = endpoints.map(endpoint => {
    return axios.get(endpoint.url)
  })
  return Promise.all(promArray)
    .then((values) => {
      // handle success
      const batch = Date.now()
      const changedObjectsArray = []
      const changedObjects = []
      values.forEach((response, ind) => {
        const {basePath, recordId: idpath, url, name:endpointName} = endpoints[ind]
        const { data } = response
        let entries = data
        let strippedData = []
        if (basePath) {
          entries = jp.query(data, basePath)[0]
          strippedData = data
          // fix to work with all data paths
          strippedData[basePath] = []
        }
        entries.forEach((record) => {
          // update
          const recordid = jp.query(record, idpath)[0]
          const recordHash = hash(record)
          const hashId = recordid + "+" + url
          if (hashId in newChangeHash) {
            if (newChangeHash[hashId] === recordHash) {
              return
            }
          }
          const newid = recordid + '?generatedAtTime=' + new Date(batch).toISOString()
          if (!(newid in changedObjects)){
            changedObjects[newid] = {
              'typeOf': recordid,
              batch,
              contents: {}
            }
          }
          changedObjects[newid].contents[endpointName] = {
            url,
            header: JSON.stringify(strippedData),
            content: JSON.stringify(record),
            hash: recordHash,
            idPath: idpath
          }
          console.log('dit zijn de chagned objects of ' + this.name)
          console.log(changedObjects[newid]['contents'])
          console.log(JSON.stringify(changedObjects))
          if (url === loc.url){
            const latpath = loc.lat
            const lonpath = loc.lon
            const lat = jp.query(record, latpath)[0]
            const lon = jp.query(record, lonpath)[0]
            changedObjects[newid].lat = lat
            changedObjects[newid].lon = lon
          }
          // changedObjects.push({
          //   'id': recordid + '?generatedAtTime=' + new Date(batch).toISOString(),
          //   'content': JSON.stringify(record),
          //   'typeOf': recordid,
          //   batch,
          //   lat,
          //   lon,
          //   header: JSON.stringify(strippedData)
          // })
          newChangeHash[hashId] = recordHash
        })        
      })

  const locationQuery = (versionOf) => {
      return ApiModel.aggregate(
        [
          { '$lookup': {
            'from': RecordModel.collection.name,
            'localField': 'records',
            'foreignField': '_id',
            'as': 'records'
          } },
          { '$unwind': '$records' },
          { '$match': {
            'records.typeOf': versionOf
          } },
          {
            '$sort': { 'records.batch': -1  }
          },
          { '$limit': 1 },
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
  		const transformObjectWithLat = (key, changedObjects) => {
  			return new Promise((res,rej)=> {
        	let objt = {}
        	Object.keys(changedObjects[key]).forEach((key2) => {
        	  objt[key2] = changedObjects[key][key2]
        	});
        	objt['id'] = key
        	res(objt)
  			})
  		}

  		const tranformObjectWithoutLat = (key, changedObjects) => {
 				return new Promise((res,rej)=> {
        	let objt = {}
        	Object.keys(changedObjects[key]).forEach((key2) => {
        	  objt[key2] = changedObjects[key][key2]
        	});
        	objt['id'] = key
        	locationQuery(objt['typeOf']).then(result => {
        		// console.log(result['records'].length)
        	  if(result.length > 0 && 'records' in result[0] && (result[0]['records'].length > 0)){
        	    if ('lat' in result[0]['records'][0]){
        	      const {lat, lon} = result[0]['records'][0]
        	      objt['lat'] = lat
        	      objt['lon'] = lon
        	    }
        	  }
        	  res(objt)
        	})		
 				})
  		}

  		const transformQ = Object.keys(changedObjects).map(key=> {
  			if ('lat' in changedObjects[key]){
  				return transformObjectWithLat(key,changedObjects)
  			}
  			else {
  				return tranformObjectWithoutLat(key,changedObjects)
  			}
  		})

  		return Promise.all(transformQ).then(changedObjectsA => {
  			return {
  				changeHash: newChangeHash,
  				changedObjectsArray: changedObjectsA
  			}
  		})
      // Object.keys(changedObjects).forEach((key) => {
      //   let objt = {}
      //   Object.keys(changedObjects[key]).forEach((key2) => {
      //     objt[key2] = changedObjects[key][key2]
      //   });
      //   objt['id'] = key
      //   if ('lat' in objt){
      //     changedObjectsArray.push(objt)
      //   }
      //   else {
      //     locationQuery(objt['typeOf']).then(result => {
      //       console.log(JSON.stringify(result))
      //       if('records' in result && (result['records'].length > 0)){
      //         if ('lat' in result['records'][0]){
      //           const {lat, lon} = result['records'][0]
      //           objt['lat'] = lat
      //           objt['lon'] = lon
      //           console.log(lat)
      //         }
      //       }
      //       changedObjectsArray.push(objt)
      //     })
      //   }
        
      // });
      // console.log(changedObjectsArray.length)
      // return {
      //   changeHash: newChangeHash,
      //   changedObjectsArray,
      // }
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
    const promArray = this.endpoints.map(endpoint => {
      const client = new HttpService(endpoint.url)
      return client.get()
    })
    return Promise.all(promArray).then((values) => {
      let ind = 0
      const sourcesMap = values.map(value => {
        ind = ind + 1
        return {
          name: 'data' + (ind === 1 ? '' : ind) + '.json',
          data: value.data
        }
      })
      const sources = {}
      sourcesMap.forEach(el => {
        sources[el.name] = JSON.stringify(el.data)
      })
      const { rml, yarrrml, paths, name } = this
      // let data = response
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      console.log('MAPPING ' + name)
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      if (rml == '' && yarrrml == '') {
        // data = !this.dataPath ? response : getProp(response, this.dataPath)
        // return mapDef(data, paths, name)
      } else if (yarrrml == '') {
        return mapRML(sources, rml, rmlmapperPath, tempFolderPath, name).then((out) => {
          return EXPAND ? expandDepth(out) : out
        })
      } else {
        return mapYARRRML(sources, yarrrml, rmlmapperPath, tempFolderPath, name).then((out) => {
          return EXPAND ? expandDepth(out) : out
        })
      }
    })
  })
}

const ApiModel = mongoose.model('Api', ApiSchema)
Queries.loadApi(ApiModel)
ApiModel.getAll = () => ApiModel.find({})
ApiModel.addApi = api => api.save()

module.exports = ApiModel
