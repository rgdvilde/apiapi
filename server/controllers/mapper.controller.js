const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const axios = require('axios')
const SHACLValidator = require('shacl-js')
const yarrrmlParser = require('@rmlio/yarrrml-parser/lib/rml-generator')
const N3 = require('n3')
const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'

module.exports = {
  map (req, res) {
    console.log(req)
    const { url, rml, yarrrml } = req.body
    const { mapmode } = req.params
    if (mapmode === 'rml') {
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
      axios.get(url)
        .then((response) => {
          const sources = {
            'data.json': JSON.stringify(response.data)
          }
          return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
            res.json(resp.output)
          })
        })
        .catch((error) => {
          console.log(error)
        })
    } else if (mapmode === 'yarrml') {
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
      const y2r = new yarrrmlParser()
      const triples = y2r.convert(yarrrml)
      const writer = new N3.Writer({})
      axios.get(url)
        .then((response) => {
          writer.addQuads(triples)
          writer.end((error, result) => {
            const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
            const sources = {
              'data.json': JSON.stringify(response.data)
            }
            return wrapper.execute(result, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
              res.json(resp.output)
            })
          })
        })
        .catch((error) => {
          console.log(error)
        })
    }
  },

  mapValidate (req, res) {
    const { url, rml, yarrrml, mapmode, shacl: shapes } = req.body
    if (mapmode === 'rml') {
      console.log('validating rml')
      console.log(req)
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
      axios.get(url)
        .then((response) => {
          const sources = {
            'data1.json': JSON.stringify(response.data)
          }
          return wrapper.execute(rml, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
            const validator = new SHACLValidator()
            validator.validate(resp.output, 'application/ld+json', shapes, 'text/turtle', function (e, report) {
              console.log('Conforms? ' + report.conforms())
              if (report.conforms() === false) {
                report.results().forEach(function (result) {
                  console.log(' - Severity: ' + result.severity() + ' for ' + result.sourceConstraintComponent())
                })
                res.json(report.results())
              } else {
                console.log(report.conforms())
                res.json(report.conforms())
              }
            })
          })
        })
        .catch((error) => {
          console.log(error)
        })
    } else if (mapmode === 'yarrrml') {
      const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
      const y2r = new yarrrmlParser()
      const triples = y2r.convert(yarrrml)
      const writer = new N3.Writer({})
      axios.get(url)
        .then((response) => {
          writer.addQuads(triples)
          writer.end((error, result) => {
            const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
            const sources = {
              'data.json': JSON.stringify(response.data)
            }
            return wrapper.execute(result, { sources, generateMetadata: false, serialization: 'jsonld' }).then((resp) => {
              const validator = new SHACLValidator()
              validator.validate(resp.output, 'application/ld+json', shapes, 'text/turtle', function (e, report) {
                console.log('Conforms? ' + report.conforms())
                if (report.conforms() === false) {
                  report.results().forEach(function (shaclresult) {
                    console.log(' - Severity: ' + shaclresult.severity() + ' for ' + shaclresult.sourceConstraintComponent())
                  })
                  res.json(report.results())
                } else {
                  res.json(report.conforms())
                }
              })
            })
          })
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
