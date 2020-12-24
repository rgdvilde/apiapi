<template>
  <div id="ShaclMapper">
    <div class="container">
      <v-row>
        <v-col
          cols="12"
          md="12">
          <v-form>
            <v-container>
              <v-row>
                <v-select
                  v-model="filetype"
                  :items="filetypes"
                  label="FileType" />
              </v-row>
              <v-row>
                <v-select
                  v-model="targetClass"
                  :items="targetShapes"
                  item-text="uri"
                  label="Target" />
              </v-row>
              <v-row>
                <v-text-field
                  v-model="iteratorText"
                  label="Iterator" />
              </v-row>
              <v-row>
                <v-switch
                  v-model="toggleEndpoint"
                  :label="`toggleEndpoint`" />
              </v-row>
            </v-container>
          </v-form>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-if="toggleEndpoint"
          cols="12"
          md="5">
          <vue-json-pretty
            :path="'res'"
            :data="endpointData" />
        </v-col>
        <hr>
        <v-col
          cols="12"
          md="5">
          <v-tabs
            v-model="tab"
            align-with-title>
            <v-tab
              :key="'form'">
              form
            </v-tab>
            <v-tab
              :key="'shapes'">
              shapes
            </v-tab>
            <v-tab
              :key="'data'">
              data
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item
              :key="'form'">
              <shacl-form
                ref="shaclForm"
                :shapes-graph-text="shapesGraphText"
                :target-class="targetClass"
                :target-shapes="targetShapes"
                :options="options"
                :endpoint-data="endpointdata"
                :iterator-text="iteratorText"
                :filetype="filetype"
                @update="onUpdate"
                @load="onLoad" />
            </v-tab-item>
            <v-tab-item
              :key="'shapes'">
              <pre v-text="shapesGraphText" />
            </v-tab-item>
            <v-tab-item
              :key="'data'">
              <pre v-text="dataText" />
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import * as $rdf from 'rdflib'
import SHACLValidator from 'shacl'
import VueJsonPretty from 'vue-json-pretty'
import ShaclForm from './ShaclForm'
import 'vue-json-pretty/lib/styles.css'
import defaultOptions from './lib/options'

export default {
  name: 'ShaclMapper',
  components: {
    ShaclForm,
    VueJsonPretty
  },
  props: {
    shapesGraphText: {
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
    }
  },
  data () {
    return {
      shapeFileUri: document.location.origin + '/ngsi.ttl',
      mergedOptions: defaultOptions,
      targetClass: '',
      dataText: '',
      iteratorText: '$',
      filetype: 'json',
      shapesGraph: $rdf.graph(),
      targetShapes: [],
      endpointdata: {},
      url: 'https://data.stad.gent/api/records/1.0/search/?dataset=donkey-republic-deelfietsen-stations-locaties&q=',
      toggleEndpoint: true,
      filetypes: ['json'],
      tab: 'form',
      validator: new SHACLValidator()
    }
  },
  mounted () {
  },
  methods: {
    validate () {
      this.$refs.shaclForm.validate()
    },
    onUpdate (graph) {
      const serializer = $rdf.Serializer(graph)
      this.dataText = serializer.statementsToN3(graph.statements)
      this.$emit('complete', this.dataText)
    },
    onLoad (shapes) {
      this.targetShapes = shapes
    },
    complete () {
      this.$emit('complete', this.dataText)
    }

  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}
</style>
