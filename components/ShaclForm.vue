<template>
  <div>
    <v-form>
      <v-container>
        <v-row>
          <v-text-field
            v-model="subjectUri"
            label="Subject URI" />
        </v-row>
        <v-row>
          <v-text-field
            v-model="subjectTemplate"
            @input="onUpdate"
            label="Subject Template" />
        </v-row>
      </v-container>
      <form-group
        :subject="subject"
        :shape="shape"
        :shapes-store="shapesStore"
        v-if="shape"
        v-model="quads"
        @input="onUpdate" />
    </v-form>
  </div>
</template>

<script>
import merge from 'merge'
import * as $rdf from 'rdflib'
import SHACLValidator from 'shacl'

import FormGroup from './FormGroup.vue'
import defaultOptions from './lib/options'

const RR = new $rdf.Namespace('http://www.w3.org/ns/r2rml#')
// const NGSI = new $rdf.Namespace('https://uri.fiware.org/ns/data-models#')
const RML = new $rdf.Namespace('http://semweb.mmlab.be/ns/rml#')
// const RL = new $rdf.Namespace('http://example.org/rules/')
const QL = new $rdf.Namespace('http://semweb.mmlab.be/ns/ql#')
const RDF = new $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

export default {
  name: 'ShaclForm',
  components: {
    FormGroup
  },
  props: {
    shapesGraph: {
      type: Object
    },
    shapesGraphText: {
      type: String,
      default: ''
    },
    targetClass: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default () {
        return {}
      }
    },
    endpointData: {
      type: Object,
      default () {
        return {}
      }
    },
    iteratorText: {
      type: String,
      default: ''
    },
    filetype: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      subjectUri: null,
      quads: [],
      mergedOptions: defaultOptions,
      validator: new SHACLValidator(),
      validationResults: [],
      subjectTemplate: ''
    }
  },
  provide () {
    return {
      shapesGraph: this.validator.shapesGraph,
      validationResults: this.validationResults,
      options: this.mergedOptions
    }
  },
  computed: {
    subject () {
      try {
        return $rdf.namedNode(this.subjectUri)
      } catch (e) {
        return null
      }
    },
    currentNodeShape () {
      return null
    },
    shapeNode () {
      return this.targetClass ? $rdf.namedNode(this.targetClass) : null
    },
    shape () {
      return this.shapeNode ? this.validator.shapesGraph.getShape(this.shapeNode) : null
    },
    keys () {
      return Object.keys(this.endpointData)
    },
    defaultHeaders () {
      const r = []
      const blankNode4 = $rdf.blankNode()
      const blankNode5 = $rdf.blankNode()
      const blankNode6 = $rdf.blankNode()
      const blankNode8 = $rdf.blankNode()
      r.push($rdf.quad(this.subject, RML('logicalSource'), blankNode4))
      r.push($rdf.quad(blankNode4, RML('source'), $rdf.literal('data.json')))
      switch (this.filetype) {
        case 'json':
          r.push($rdf.quad(blankNode4, RML('referenceFormulation'), QL('JSONPath')))
          break
        default:
          r.push($rdf.quad(blankNode4, RML('referenceFormulation'), QL('JSONPath')))
      }
      r.push($rdf.quad(blankNode4, RML('iterator'), $rdf.literal(this.iteratorText)))
      r.push($rdf.quad(this.subject, RR('subjectMap'), blankNode5))
      r.push($rdf.quad(blankNode5, RR('template'), $rdf.literal(this.subjectTemplate)))
      r.push($rdf.quad(this.subject, RR('predicateObjectMap'), blankNode6))
      r.push($rdf.quad(blankNode6, RR('predicate'), RDF('type')))
      r.push($rdf.quad(blankNode6, RR('objectMap'), blankNode8))
      r.push($rdf.quad(blankNode8, RR('constant'), this.targetClass))
      return r
    },
    shapesStore () {
      const uri = 'https://example.org/resource.ttl'
      const mimeType = 'text/turtle'
      const store = $rdf.graph()
      try {
        $rdf.parse(this.shapesGraphText, store, uri, mimeType)
      } catch (err) {
        console.log(err)
      }
      return store
    }
  },
  watch: {
    shapesGraphText: {
      immediate: true,
      handler (newValue) {
        this.validator.updateShapesGraph(newValue, this.mergedOptions.format, () => {
          this.onLoad()
        })
      }
    },
    shapesGraph: {
      deep: true,
      handler (newValue) {
        this.validator.updateShapesGraphRdfModel(newValue, () => {
          this.onLoad()
        })
      }
    },
    options: {
      deep: true,
      immediate: true,
      handler (newOptions) {
        merge.recursive(defaultOptions, newOptions)
      }
    },
    targetClass: {
      deep: true,
      immediate: true,
      handler () {
        this.quads = []
        this.onUpdate()
      }
    }
  },
  methods: {
    onUpdate () {
      const graph = $rdf.graph()
      if (this.subject) {
        graph.namespaces = Object.assign({}, this.validator.$shapes.store.namespaces)
        graph.addAll(this.defaultHeaders)
        graph.addAll(this.quads)
      }
      this.$emit('update', graph)
    },
    onLoad () {
      const shapes = this.validator.shapesGraph.getShapesWithTarget().filter((shape) => {
        const uri = shape.shapeNode.value
        return !uri.startsWith('http://datashapes.org/dash#') && !uri.startsWith('http://www.w3.org/ns/shacl#')
      }).map((shape) => {
        return shape.shapeNode.value
      })
      this.$emit('load', shapes)
    },
    validate () {
      return new Promise((resolve, reject) => {
        const graph = $rdf.graph()
        graph.addAll(this.quads)
        this.validator.updateDataGraphRdfModel(graph, (err, report) => {
          if (err) {
            reject(err)
          } else {
            this.validationResults.splice(0, this.validationResults.length)
            this.validationResults.push(...report.results())
            resolve(report.results())
          }
        })
      })
    }
  }
}
</script>

<style scoped>

</style>
