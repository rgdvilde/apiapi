<template>
  <div id="app">
    <div class="container">
      <h1>vue-shacl-form</h1>
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation>
        <v-select
          :items="targetShapes"
          v-model="targetClass"
          label="Standard" />
      </v-form>
      <v-card color="basil">
        <v-tabs>
          <v-tab href="#Form">
            Form
          </v-tab>
          <v-tab-item value="Form">
            <shacl-form ref="shaclForm"
                        :shapesGraphText="shapesText"
                        :targetClass="targetClass"
                        :options="options"
                        @update="onUpdate"
                        @load="onLoad" />
            <button @click.prevent="validate"
                    class="btn btn-warning">
              Validate
            </button>
          </v-tab-item>

          <v-tab href="#Shapes">
            Shapes
          </v-tab>
          <v-tab-item value="Shapes">
            <div class="card text-left">
              <div class="card-body">
                <pre v-text="shapesText" />
              </div>
            </div>
          </v-tab-item>

          <v-tab href="#Data">
            Data
          </v-tab>
          <v-tab-item value="Data">
            <div class="card text-left">
              <div class="card-body">
                <pre v-text="dataText" />
              </div>
            </div>
          </v-tab-item>
        </v-tabs>
      </v-card>
      <hr>
    </div>
  </div>
</template>

<script>
import VueShaclForm from 'vue-shacl-form'
import * as $rdf from 'rdflib'

export default {
  name: 'ShaclMapper',
  components: {
    'shacl-form': VueShaclForm
  },
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      text: 'lorem ipsum',
      items: ['Form', 'Shapes', 'Data'],
      shapeFileUri: document.location.origin + '/ngsi.ttl',
      targetClass: '',
      shapesText: this.model.shacl,
      dataText: '',
      shapesGraph: $rdf.graph(),
      targetShapes: [],
      options: {}
    }
  },
  mounted () {
    this.load()
  },
  methods: {
    load () {
      console.log(this.model)
    },
    onUpdate (graph) {
      const serializer = $rdf.Serializer(graph)
      this.dataText = serializer.statementsToN3(graph.statements)
    },
    onLoad (shapes) {
      console.log(shapes)
      this.targetShapes = shapes
    },
    validate () {
      console.log(this.$refs)
      this.$refs.shaclForm.validate()
    },
    complete (data) {
      console.log(data)
    }
  }
}
</script>
