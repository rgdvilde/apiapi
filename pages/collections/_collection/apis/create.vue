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
                  Provide the name for this Api
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
            <v-icon>mdi-sitemap</v-icon>
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
                  Register all the endpoints of this Api.<br>
                  Any number of Apis can be registered. Add the paths to the id and location by expanding the input fields by pressing the corresponding icons. Id path will enable event stream creation, location paths will enable spatial fragmentation. Mapping cannot be done until the endpoints are verified<br>
                  <v-icon>mdi-check-circle-outline</v-icon> Fetch the endpoint data and validate the URLS<br>
                  <v-icon>mdi-check-circle</v-icon> Data is successfully fetched<br>
                  <v-icon>mdi-view-stream-outline</v-icon> Open event stream fields<br>
                  <v-icon>mdi-map-marker</v-icon> Open spatial fragmenting fields<br>
                  <v-icon>mdi-lock</v-icon> Add request parameters<br>
                  <v-icon>mdi-file-document-outline</v-icon> See response data<br>
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
            @validated="validate"
            :endpointInformation="endpoints" />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel :disabled="!next_step">
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-translate</v-icon>
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
                  Create the mapping<br>
                  Select the RML via text, YARRRML via text or RML via form method. When using the former to provide the mapping via text. When using the latter provide the paths to the corresponding properties in your data<br>
                  <v-icon>mdi-map-outline</v-icon> Select mapping method<br>
                  <v-icon>mdi-check-circle-outline</v-icon> Validate mapping<br>
                  <v-icon>mdi-check-circle</v-icon> Mapping is successfully validated<br>
                  <v-icon>mdi-alert-circle-check</v-icon> Mappings is not successfully validated, press to see validation report<br>
                  <v-icon>mdi-alpha-s-box</v-icon> See SHACL shape<br>
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
                        RML via text
                      </v-card>
                    </v-col>
                    <v-col>
                      <v-card @click="setMapMode('YARRRML')">
                        YARRRML via text
                      </v-card>
                    </v-col>
                    <v-col>
                      <v-card @click="setMapMode('RMLMapper')">
                        RML via form
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
                  Validation Report
                </v-card-title>

                <v-card-text class="grey lighten-2">
                  <validation-report :validationReport="mapValidation" />
                </v-card-text>
              </v-card>
            </v-dialog>
            <v-dialog
              v-model="d_shaclView"
              width="2000">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  icon>
                  <v-icon>mdi-alpha-s-box</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="headline grey lighten-2">
                  SHACL
                </v-card-title>

                <v-card-text>
                  <pre>{{ this.collection.model.shacl }}</pre>
                </v-card-text>

                <v-divider />
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
          <v-card v-if="mapMode !== 'RML' && mapMode != 'YARRRML' && mapMode != 'RMLMapper' ">
            <v-card-title class="headline grey lighten-2">
              Mapping
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col>
                  <v-card @click="setMapMode('RML')">
                    <b>{{ $t('titles.RMLviaText') }}</b>
                    <p>{{ $t('info.RMLviaText') }}</p>
                  </v-card>
                </v-col>
                <v-col>
                  <v-card @click="setMapMode('YARRRML')">
                    <b>{{ $t('titles.YARRRMLviaText') }}</b>
                    <p>{{ $t('info.YARRRMLviaText') }}</p>
                  </v-card>
                </v-col>
                <v-col>
                  <v-card @click="setMapMode('RMLMapper')">
                    <b>{{ $t('titles.RMLviaForm') }}</b>
                    <p>{{ $t('info.RMLviaForm') }}</p>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
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
      name: '',
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
      d_shaclView: false,
      constraintsValidated: false,
      d_mapValidation: false,
      endpointResp: {}
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
          recordId: card.recordId,
          lat: card.lat ? card.lat : '',
          lon: card.lon ? card.lon : '',
          req_params: card.req_params ? card.req_params : [],
          data: card.data
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
          const { req_params: reqParams, url } = endpoint
          const transformedparams = {}
          // {key: param_key, value: param.value}
          reqParams.forEach((param) => {
            transformedparams[param.key] = param.value
          })
          const resp = await axios.get(url, {
            params: transformedparams
          })
          console.log(resp)
          const { data } = resp
          if (ind === 0) { this.endpointData = data }
          if (ind === this.endpoints.length - 1) { this.validated = true }
          this.endpoints[ind].data = JSON.stringify(data)
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
        const data = { 'shacl': this.collection.model.shacl, 'rml': this.rml, 'url': this.url, 'mapmode': 'rml', 'endpoints': this.endpoints }
        console.log(data)
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
        const data = { 'shacl': this.collection.model.shacl, 'yarrrml': this.yarrrml, 'url': this.url, 'mapmode': 'yarrrml', 'endpointResp': this.endpointResp }
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
