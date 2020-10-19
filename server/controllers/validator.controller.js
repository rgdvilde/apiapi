const SHACLValidator = require('shacl-js')

module.exports = {
  validate (req, res, next) {
    const { data, shapes } = req.body
    const validator = new SHACLValidator()
    validator.validate(data, 'application/ld+json', shapes, 'text/turtle', function (e, report) {
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
  }
}
