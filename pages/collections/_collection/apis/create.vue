<template>
  <v-container fluid>
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-text-box-outline</v-icon>
            Basic Information
            <v-dialog
              v-model="d_basicInfo"
              width="500">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  icon>
                  <v-icon>mdi-information</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  Basic Information
                </v-card-title>

                <v-card-text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </v-card-text>

                <v-divider />
              </v-card>
            </v-dialog>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-row>
            <v-text-field
              :label="$t('formLabels.name')"
              v-model="name" />
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-text-box-outline</v-icon>
            Endpoints
            <v-dialog
              v-model="d_endpointInfo"
              width="500">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  icon>
                  <v-icon>mdi-information</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  Endpoints
                </v-card-title>

                <v-card-text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </v-card-text>

                <v-divider />
              </v-card>
            </v-dialog>
            <v-btn
              @click="validate(true)"
              v-if="!validated"
              v-on:click.stop
              icon>
              <v-icon>mdi-check-circle-outline</v-icon>
            </v-btn>
            <v-icon v-if="validated">
              mdi-check-circle
            </v-icon>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <endpoint-cards
            @update="updateEndpointCards"
            @validated="validate" />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!next_step">
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-text-box-outline</v-icon>
            Mapping
            <v-dialog
              v-model="d_mappingInfo"
              width="500">
              <template v-slot:activator="{ on, attrs }">
                <span>
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    icon>
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                </span>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  Mapping
                </v-card-title>

                <v-card-text>
                  Information about mapping
                </v-card-text>

                <v-divider />
              </v-card>
            </v-dialog>
            <v-dialog
              v-model="d_mappingSelect"
              width="800">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  icon>
                  <v-icon>mdi-map-outline</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  Mapping
                </v-card-title>

                <v-card-text>
                  <v-row>
                    <v-col>
                      <v-card @click="setMapMode('RML')">
                        <v-img
                          lazy-src="https://picsum.photos/150/150"
                          max-height="150"
                          max-width="150"
                          src="https://picsum.photos/150/150" />
                      </v-card>
                    </v-col>
                    <v-col>
                      <v-card @click="setMapMode('YARRRML')">
                        <v-img
                          lazy-src="https://picsum.photos/150/150"
                          max-height="150"
                          max-width="150"
                          src="https://picsum.photos/150/150" />
                      </v-card>
                    </v-col>
                    <v-col>
                      <v-card @click="setMapMode('RMLMapper')">
                        <v-img
                          lazy-src="https://picsum.photos/150/150"
                          max-height="150"
                          max-width="150"
                          src="https://picsum.photos/150/150" />
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-dialog>
            <v-btn
              @click="checkConstraints()"
              v-if="!constraintsValidated"
              v-on:click.stop
              icon>
              <v-icon>mdi-check-circle-outline</v-icon>
            </v-btn>
            <v-icon v-if="constraintsValidated">
              mdi-check-circle
            </v-icon>
            <v-dialog
              v-if="!constraintsValidated && mapValidation != ''"
              v-model="d_mapValidation"
              width="800">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  icon>
                  <v-icon>mdi-alert-circle-check</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  Mapping
                </v-card-title>

                <v-card-text>
                  <validation-report :validationReport="mapValidation" />
                </v-card-text>
              </v-card>
            </v-dialog>
          </div>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <rml-editor
            v-if="mapMode === 'RML'"
            @complete="setRML" />
          <shacl-mapper-wrapper v-if="mapMode === 'RMLMapper'"
                                :model="collection.model"
                                :endpointData="endpointData"
                                @complete="setRML"
                                :style="btnStyles" />
          <yarrrml-editor
            v-if="mapMode === 'YARRRML'"
            @complete="setYARRRML" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-btn
      :disabled="!validated || !constraintsValidated"
      @click="submitted(true)"
      color="primary"
      class="mr-4">
      Submit
    </v-btn>
  </v-container>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { get as getProp } from 'lodash'
import axios from 'axios'
import RmlEditor from '~/components/RmlEditor.vue'
import YarrrmlEditor from '~/components/YarrrmlEditor.vue'
import ShaclMapperWrapper from '~/components/ShaclMapperWrapper.vue'
import ValidationReport from '~/components/ValidationReport.vue'
import EndpointCards from '~/components/EndpointCards.vue'
import { mutationTypes, actionTypes, getterTypes as apiGetters } from '~/store/api'
import { getterTypes as collectionGetters, actionTypes as collectionActions } from '~/store/collections'
import page from '~/mixins/page'

export default {
  name: 'ApiCreate',
  components: {
    RmlEditor,
    YarrrmlEditor,
    ShaclMapperWrapper,
    EndpointCards,
    ValidationReport
  },
  mixins: [page],
  head () {
    return {
      title: this.$t('nav.createApi')
    }
  },
  data () {
    return {
      valid: true,
      nameRules: [v => !!v || 'Name is required'],
      name: 'Donkey Republic bike sharing',
      urlRules: [v => !!v || 'Url is required'],
      authMethodItems: [
        { text: 'Open', value: 'open' },
        { value: 'api_key', text: 'Api key' },
        { value: 'custom_headers', text: 'Custom headers' }
      ],
      authMethodRules: [v => !!v || 'Auth method is required'],
      authMethod: 'open',
      customHeaders: 1,
      apiKey: '',
      validated: false,
      loadingData: false,
      devicePaths: {},
      dialogVisible: false,
      mapMode: false,
      basePath: '',
      mapValidation: '',
      basePathSelectorVisible: false,
      forCollection: this.$route.params.collection,
      mappings: ['RMLMapper', 'RML', 'YARRRML'],
      endpointData: '',
      endpointCards: [],
      endpoints: [],
      loc: {},
      urls: [],
      d_basicInfo: false,
      d_mappingInfo: false,
      d_endpointInfo: false,
      d_mappingSelect: false,
      constraintsValidated: false,
      d_mapValidation: false
    }
  },
  computed: {
    apiData () {
      const data = {
        paths: this.devicePaths,
        name: this.name,
        authMethod: this.authMethod,
        forCollection: this.forCollection,
        rml: this.rml,
        yarrrml: this.yarrrml,
        loc: this.loc,
        endpoints: this.endpoints,
        urls: this.urls
      }
      return data
    },
    url () {
      if (this.endpoints.length > 0) {
        return this.endpoints[0].url
      } else {
        return ''
      }
    },
    btnStyles () {
      return {
        'min-height': '300px',
        'display': 'grid'
      }
    },
    next_step () { return this.validated },
    ...mapGetters('api', { rawData: apiGetters.SELECTED_API_DATA }),
    ...mapGetters('collections', { collectionById: collectionGetters.COLLECTION_BY_ID }),
    collection () {
      return this.collectionById(this.forCollection)
    }
  },
  async fetch ({ store, params }) {
    if (!store.getters['collections/' + collectionGetters.COLLECTION_BY_ID](params.collection)) {
      await store.dispatch('collections/' + collectionActions.FETCH_COLLECTION_BY_ID, params.collection)
    }
  },
  mounted () {
    this.setCrumbs([
      { label: this.$t('nav.home'), route: { name: 'index' } },
      { label: this.collection.name, route: { name: 'collections-collection', params: { collection: this.forCollection } } },
      { label: this.$t('nav.createApi') }])
  },
  methods: {
    ...mapActions({
      create: 'api/' + actionTypes.CREATE_API
    }),
    ...mapMutations({
      update: 'api/' + mutationTypes.UPDATE_SELECTED_API_DATA
    }),
    reset () {
      this.$refs.form.reset()
    },
    updateEndpointCards (endpointCards) {
      this.validated = false
      if (endpointCards.length > 1) {
        this.mappings = ['RML', 'YARRRML']
      } else {
        this.mappings = ['RMLMapper', 'RML', 'YARRRML']
      }
      this.endpointCards = endpointCards
      this.endpoints = endpointCards.map((card) => {
        return {
          name: card.name,
          url: card.url,
          basePath: card.basePath,
          recordId: card.recordId
        }
      })
      this.urls = []
      endpointCards.forEach((card) => {
        this.urls.push(card.url)
        if (card.lat && card.lon) {
          this.loc = {
            lat: card.lat,
            lon: card.lon,
            url: card.url
          }
        }
      })
    },
    async validate (valid) {
      // if (this.$refs.form.validate()) {
      //   this.loadingData = true
      //   fetch(`${process.env.baseUrl}/api/proxy/${btoa(this.url)}`)
      //     .then(data => data.json())
      //     .then((json) => {
      //       this.update(json)
      //       this.setData(json)
      //       this.loadingData = false
      //       this.validated = true
      //     })
      //     .catch(err => console.error(err))
      // }

      //         ...this.cardInfo,
      //   lat,
      //   lon,
      //   basePath,
      //   recordId
      // }
      console.log(this.collection.model)
      await this.endpoints.forEach(async (endpoint, ind) => {
        try {
          console.log('endpoint')
          const resp = await axios.get(this.url)
          console.log(resp)
          const { data } = resp
          if (ind === 0) { this.endpointData = data }
          if (ind === this.endpoints.length - 1) { this.validated = true }
        } catch (error) {
          this.validated = false
        }
      })
    },
    addHeader () {
      this.customHeaders += 1
    },
    removeHeader () {
      this.customHeaders -= 1
      if (this.customHeaders < 0) {
        this.customHeaders = 0
      }
    },
    selectMapper (input) {
      this.mapMode = input
    },
    pathsCompleted (paths) {
      this.devicePaths = paths
      this.dialogVisible = true
    },
    checkConstraints () {
      console.log(this.rml)
      if (this.mapMode === 'RML' || this.mapMode === 'RMLMapper') {
        this.rmlCompleted(this.rml)
      } else if (this.mapMode === 'YARRRML') {
        this.yarrrmlCompleted(this.yarrrml)
      }
    },
    rmlCompleted (rml) {
      console.log('validating RML')
      console.log(this.collection.model.shacl)
      if (this.collection.model.shacl) {
        console.log(this.url)
        const data = { 'shacl': this.collection.model.shacl, 'rml': this.rml, 'url': this.url, 'mapmode': 'rml' }
        fetch(`${process.env.baseUrl}/api/map/validate`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          }
        })
          .then(data => data.json())
          .then((json) => {
            console.log(json)
            if (JSON.stringify(json) === 'true') {
              console.log('truee')
              this.constraintsValidated = true
            } else {
              this.constraintsValidated = false
            }
            this.mapValidation = JSON.stringify(json)
            console.log(this.constraintsValidated)
          })
          .catch(err => console.error(err))
      } else {
        this.constraintsValidated = true
      }
    },
    yarrrmlCompleted (yarrrml) {
      this.yarrrml = yarrrml
      if (this.collection.model.shacl) {
        const data = { 'shacl': this.collection.model.shacl, 'yarrrml': this.yarrrml, 'url': this.url, 'mapmode': 'yarrrml' }
        fetch(`${process.env.baseUrl}/api/map/validate`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          }
        })
          .then(data => data.json())
          .then((json) => {
            if (JSON.stringify(json) === 'true') {
              this.constraintsValidated = true
            } else {
              this.constraintsValidated = false
            }
            this.mapValidation = JSON.stringify(json)
          })
          .catch(err => console.error(err))
      } else {
        this.constraintsValidated = true
      }
    },
    fragmentationInfoComplete (fragmentationInfo) {
      const { basePath, recordId, lat, lon } = fragmentationInfo
      this.basePath = basePath
      this.recordId = recordId
      this.lat = lat
      this.lon = lon
    },
    submitted (success) {
      if (!success) {
        this.dialogVisible = false
      } else {
        console.log(this.apiData)
        this.create(this.apiData).then((result) => {
          if (!result) {
            // TODO: handle error
          }
          this.dialogVisible = false
          /* params: { id: this.forCollection } */
          this.$router.push(`/collections/${this.forCollection}`)
        })
      }
    },
    setRML (rml) {
      this.rml = rml
    },
    setYARRRML (yarrrml) {
      this.yarrrml = yarrrml
    },
    setBasePath (path) {
      if (this.basePath !== path) {
        this.basePath = path
        const currentData = this.rawData
        const newData = getProp(currentData, path)
        this.update(newData)
      }
    },
    setData (json) {
      this.endpointData = json
    },
    setMapMode (mode) {
      this.mapMode = mode
      this.d_mappingSelect = false
    }
  }
}
</script>
