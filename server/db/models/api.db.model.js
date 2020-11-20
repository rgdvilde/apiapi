const fs = require('fs')
const N3 = require('n3')
const mongoose = require('mongoose')
const { get: getProp, set: setProp } = require('lodash')
const $rdf = require('rdflib')
const jsonld = require('jsonld')
const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const yarrrmlParser = require('@rmlio/yarrrml-parser/lib/rml-generator')
const RedisService = require('../../services/redis.service')
const HttpService = require('../../services/http.service')

const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'
// const rml = fs.readFileSync('./ngsimapping.ttl', 'utf-8')

var mimeType = 'text/turtle'


const PATH_TYPES = {
  PATH: 'path',
  CONSTANT: 'constant'
}

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
  slippy: {
    type: Boolean,
    default: false
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
  meta: { type: Object, default: {} },
  index: { type: Object, default: {} },
  categories: { type: Array, default: [] },
  types: { type: Array, default: [] }
})

const calcObjects = (doc, zoom,x,y,index) => {
  const filteredIDs = filterIDs(zoom,x,y,index)
  return doc.filter(it => {
    return filteredIDs.includes(it['@id'])
  })
}

const filterIDs = (zoom,x,y,index) => {
  function lon2tile (lon, zoom) { return (Math.floor((lon + 180) / 360 * 2 ** zoom)) }
  function lat2tile (lat, zoom) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** zoom)) }
  return Object.keys(index).filter(key => {
    const t1 = lon2tile(parseFloat(index[key]['lon']), parseFloat(zoom))
    const t2 = lat2tile(parseFloat(index[key]['lat']), parseFloat(zoom))
    // console.log(index[key]['lon'])
    // console.log(t1)
    // console.log(parseInt(x))
    // console.log(t2)
    // console.log(parseInt(y))
    return t1 === parseFloat(x) && t2 === parseFloat(y)
  })
}

const getIndex = (doc, query, redis, name) => {
  return new Promise(function(myResolve, myReject) {
    // "Producing Code" (May take some time)
  return redis.getData(name + ':::index').then((cachedResponse) => {
    if (cachedResponse) {
      myResolve(JSON.parse(cachedResponse))
    }
    else{
      myResolve(calcIndex(doc,query, redis, name))
    }
  }); 
})
}

const calcIndex = (doc, query, redis, name) => {
  return new Promise(function(myResolve, myReject) {
    // "Producing Code" (May take some time)
    const index = {}
    var uri = 'https://data.vlaanderen.be/shacl/examplegraph'
    var store = $rdf.graph()
    jsonld.toRDF(JSON.parse(doc), {format: 'application/n-quads'}).then(data => {
      try {
          $rdf.parse(data, store, uri, mimeType)
      } catch (err) {
          myReject(err)
      }

      let count = 0
      var eq = $rdf.SPARQLToQuery(query,false,store)
      var onresult = function(result) {
        let {'?id': recordidNode, '?lat': latNode, '?lon': lonNode} = result
        if (recordidNode && latNode && lonNode) {
          let {value: id} = recordidNode
          let {value: lat} = latNode
          let {value: lon} = lonNode
          index[id] = {}
          index[id]['lat'] = lat
          index[id]['lon'] = lon
          count = count + 1
        }
      }
      var onDone  = function() {
        console.log('INDEX')
        redis.setData(name + ':::index', JSON.stringify(index))
        myResolve(index)
      }
      store.query(eq,onresult,undefined,onDone)
    })
    .catch(err => {
      myReject(err)
    })
  }); 
}

const mapRML = (data, rml, rmlmapperPath, tempFolderPath, name, redis) => {
  return new Promise(function(myResolve, myReject) {
    // "Producing Code" (May take some time)
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    const sources = {
      'data.json': JSON.stringify(data)
    }
    return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
      redis.setData(name, result.output)
      myResolve(JSON.parse(result.output))
    })
  }); 
}

const mapYARRRML = (data, yarrrml, rmlmapperPath, tempFolderPath, name, redis) => {
  return new Promise(function(myResolve, myReject) {
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
        redis.setData(name, resp.output)
        myResolve(JSON.parse(resp.output))
      })
    })
  }); 
}

const mapDef = (data, paths, name, redis) => {
  return new Promise(function(myResolve, myReject) {
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
   redis.setData(name, JSON.stringify(allData))
   myResolve(allData)
  }); 
}

ApiSchema.methods.raw = async function getRawData () {
  const client = new HttpService(this.url, this.customHeaders)
  const { data } = this.requestMethod === 'get'
    ? await client.get()
    : await client.post(this.requestData)
  return data
}

ApiSchema.methods.invoke = function invokeApi (model) {
  return RedisService.getData(this.name).then((cachedResponse) => {
    if (cachedResponse) {
      return JSON.parse(cachedResponse)
    }
    const client = new HttpService(this.url, this.customHeaders)
    const prom = this.requestMethod === 'get'
      ? client.get()
      : client.post(this.requestData)

    return prom.then(({ data: response }) => {
      const data = !this.dataPath ? response : getProp(response, this.dataPath)
      const { rml, yarrrml, paths, name } = this
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      console.log('MAPPING ' + name)
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      if (rml == '' && yarrrml == '') {
        return mapDef(data, paths, name, redis)
      } else if (yarrrml == '') {
        return mapRML(data, rml, rmlmapperPath, tempFolderPath, name, RedisService).then(out => {
          return out
        })
      } else {
        return mapYARRRML(data, yarrrml, rmlmapperPath, tempFolderPath, name, RedisService)
      }
    })
  })
}

ApiSchema.methods.invokeSlippy = function invokeApiSlippy (model, zoom, x, y) {
  return RedisService.getData(this.name + ':' + zoom + ':' + x + ':' + y).then((cachedResponse) => {
    if (cachedResponse) {
      console.log('cachedSlippy')
      return JSON.parse(cachedResponse)
    }
    let prom = ''
    if (this.slippy) {
      const client = new HttpService(this.url + '/' + zoom + '/' + x + '/' + y, this.customHeaders)
      prom = this.requestMethod === 'get'
        ? client.get()
        : client.post(this.requestData)
    } else {
      const client = new HttpService(this.url, this.customHeaders)
      prom = this.requestMethod === 'get'
        ? client.get()
        : client.post(this.requestData)
    }

    return prom.then(({ data: response }) => {
      const data = !this.dataPath ? response : getProp(response, this.dataPath)
      const { rml, yarrrml, paths, name } = this
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      console.log('MAPPING ' + name)
      console.log('±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±±')
      if (rml == '' && yarrrml == '') {
        const allData = data.map((rawDataElement) => {
          // rawDataElement = data element coming from api
          // should be mapped to an object which paths come from model

          return this.paths.reduce((acc, { toPath: pathName, value: pathValue, type: pathType }) => {
            if (pathType === PATH_TYPES.CONSTANT) {
              setProp(acc, pathName, pathValue)
            } else if (pathType === PATH_TYPES.PATH) {
              const fetchedData = getProp(rawDataElement, pathValue)
              setProp(acc, pathName, fetchedData)
            }
            return acc
          }, {})
        })
        if (this.slippy) {
          RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, allData)
          return allData
        } else {
          RedisService.setData(this.name, JSON.stringify(allData))
          const slippyout = filterTile(allData)
          RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, JSON.stringify(slippyout))
          return slippyout
        }
      } else if (yarrrml == '') {
        const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
        const sources = {
          'data.json': JSON.stringify(data)
        }
        return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
          if (this.slippy) {
            RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, result.output)
            return JSON.parse(result.output)
          } else {

            RedisService.setData(this.name, result.output)
            query = `PREFIX sh:  <http://www.w3.org/ns/shacl#>
     oslo: <https://data.vlaanderen.be/shacl/mobiliteit-trips-en-aanbod-ap#>
     rml: <http://semweb.mmlab.be/ns/rml#>
     rr: <http://www.w3.org/ns/r2rml#>
     ql: <http://semweb.mmlab.be/ns/ql#>
     rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
     rl: <http://example.org/rules/>
     ngsic: <https://uri.etsi.org/ngsi-ld/> 
     geojson: <https://purl.org/geojson/vocab#> 
SELECT ?id, ?lat, ?lon
WHERE {
    ?var <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://purl.org/geojson/vocab#Point> .
    ?var  <https://uri.etsi.org/ngsi-ld/lat> ?lat .
    ?var  <https://uri.etsi.org/ngsi-ld/lon> ?lon .
    ?geo <https://uri.etsi.org/ngsi-ld/hasValue> ?var .
    ?geo <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://uri.etsi.org/ngsi-ld/GeoProperty> .
    ?id <https://uri.etsi.org/ngsi-ld/location> ?geo .
    }`
            return getIndex(result.output,query, RedisService, this.name).then((ind) => {
              const slippyout =  calcObjects(JSON.parse(result.output),zoom,x,y,ind)
              console.log(slippyout)
              RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, JSON.stringify(slippyout))
              return slippyout
            })
          }
        })
      } else {
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
            if (this.slippy) {
              RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, resp.output)
              return JSON.parse(resp.output)
            } else {
              RedisService.setData(this.name, resp.output)
              const slippyout = filterTile(JSON.parse(resp.output))
              RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, JSON.stringify(slippyout))
              return slippyout
            }
          })
        })
      }
    })
  })
}

const ApiModel = mongoose.model('Api', ApiSchema)
ApiModel.getAll = () => ApiModel.find({})
ApiModel.addApi = api => api.save()

module.exports = ApiModel
