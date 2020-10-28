const fs = require('fs')
const N3 = require('n3')
const mongoose = require('mongoose')
const { get: getProp, set: setProp } = require('lodash')
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
    // if (cachedResponse) {
    //   return JSON.parse(cachedResponse)
    // }
    const client = new HttpService(this.url, this.customHeaders)
    const prom = this.requestMethod === 'get'
      ? client.get()
      : client.post(this.requestData)

    return prom.then(({ data: response }) => {
      const data = !this.dataPath ? response : getProp(response, this.dataPath)
      const { rml, yarrrml } = this
      console.log(this)
      console.log(rml)
      console.log(yarrrml)
      if (rml == '' && yarrrml == '') {
        console.log('MAPPING NON RML')
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
        return allData
      } else if (yarrrml == '') {
        console.log('MAPPING RML')
        const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
        const sources = {
          'data.json': JSON.stringify(data)
        }
        return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((result) => {
          return JSON.parse(result.output)
        })
      } else {
        console.log('Mapping YARRRML')
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
          console.log(data)
          return wrapper.execute(result, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
            console.log(resp.output)
            return JSON.parse(resp.output)
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
