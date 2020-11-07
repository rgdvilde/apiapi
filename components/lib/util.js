import * as $rdf from 'rdflib'

function shrinkUri (node, namespaces) {
  let uri
  if (node.termType && node.termType === 'NamedNode') { uri = node.value } else if (typeof node === 'string') { uri = node } else { return null }

  for (const prefix in namespaces) {
    const prefixUrl = namespaces[prefix]
    if (uri.startsWith(prefixUrl)) { return prefix + ':' + uri.substr(prefixUrl.length) }
  }

  return uri
}

// From shacl-js/src/rdflib-graph.js
// Monkey Patching rdflib, Literals, BlankNodes and NamedNodes
const exLiteral = $rdf.literal('a', 'de')
Object.defineProperty(Object.getPrototypeOf(exLiteral), 'lex', { get () { return this.value } })
Object.getPrototypeOf(exLiteral).isBlankNode = function () { return false }
Object.getPrototypeOf(exLiteral).isLiteral = function () { return true }
Object.getPrototypeOf(exLiteral).isURI = function () { return false }

const exBlankNode = $rdf.blankNode()
Object.getPrototypeOf(exBlankNode).isBlankNode = function () { return true }
Object.getPrototypeOf(exBlankNode).isLiteral = function () { return false }
Object.getPrototypeOf(exBlankNode).isURI = function () { return false }

const exNamedNode = $rdf.namedNode('urn:x-dummy')
Object.getPrototypeOf(exNamedNode).isBlankNode = function () { return false }
Object.getPrototypeOf(exNamedNode).isLiteral = function () { return false }
Object.getPrototypeOf(exNamedNode).isURI = function () { return true }

export { shrinkUri }
