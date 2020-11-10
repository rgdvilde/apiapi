const fs = require('fs')
const N3 = require('n3')
const mongoose = require('mongoose')
const { get: getProp, set: setProp } = require('lodash')
const $rdf = require('rdflib')
const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const yarrrmlParser = require('@rmlio/yarrrml-parser/lib/rml-generator')
const RedisService = require('../../services/redis.service')
const HttpService = require('../../services/http.service')

const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'
// const rml = fs.readFileSync('./ngsimapping.ttl', 'utf-8')

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
      const { rml, yarrrml } = this
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
        RedisService.setData(this.name, JSON.stringify(allData))
        return allData
      } else if (yarrrml == '') {
        const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
        const sources = {
          'data.json': JSON.stringify(data)
        }
        return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
          RedisService.setData(this.name, result.output)
          return JSON.parse(result.output)
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
            RedisService.setData(this.name, resp.output)
            return JSON.parse(resp.output)
          })
        })
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
      console.log(response)
      function lon2tile (lon, zoom) { return (Math.floor((lon + 180) / 360 * 2 ** zoom)) }
      function lat2tile (lat, zoom) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * 2 ** zoom)) }
      const filterTile = (data) => {
        return data.filter((dp) => {
          if (!dp['https://uri.fiware.org/ns/data-models#lat'][0]['@value']) {
            return false
          }
          if (!dp['https://uri.fiware.org/ns/data-models#lon'][0]['@value']) {
            return false
          }
          const t1 = lon2tile(parseFloat(dp['https://uri.fiware.org/ns/data-models#lon'][0]['@value']), parseFloat(zoom))
          const t2 = lat2tile(parseFloat(dp['https://uri.fiware.org/ns/data-models#lat'][0]['@value']), parseFloat(zoom))
          return t1 === parseInt(x) && t2 === parseInt(y)
        })
      }
      const data = !this.dataPath ? response : getProp(response, this.dataPath)
      const { rml, yarrrml } = this
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
            const slippyout = filterTile(JSON.parse(result.output))
            RedisService.setData(this.name + ':' + zoom + ':' + x + ':' + y, JSON.stringify(slippyout))
            return slippyout
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
