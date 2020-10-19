const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper')
const axios = require('axios')
const SHACLValidator = require('shacl-js')

const rmlmapperPath = './rmlmapper.jar'
const tempFolderPath = './tmp'

module.exports = {
  map (req, res) {
    const { url, rml } = req.body
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
  },
  mapValidate (req, res) {
    const { url, rml, shacl: shapes } = req.body
    console.log(url)
    console.log(rml)
    console.log(shapes)
    const wrapper = new RMLMapperWrapper(rmlmapperPath, tempFolderPath, true)
    axios.get(url)
      .then((response) => {
        const sources = {
          'data.json': JSON.stringify(response.data)
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
              res.json(report.conforms())
            }
          })
        })
      })
      .catch((error) => {
        console.log(error)
      })
  }
}
