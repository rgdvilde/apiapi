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
            <v-col lg="12">
              <v-text-field
                :label="'Model Name'"
                v-model="modelName" />
            </v-col>
            <v-col lg="12">
              <v-textarea
                :label="'Model Description'"
                v-model="modelDescription" />
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-alpha-s-box</v-icon>
            SHACL
            <v-dialog
              v-model="d_SHACL"
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
                  SHACL
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
            <v-col lg="12">
              <shacl-editor
                @complete="shaclCompleted" />
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-translate</v-icon>
            Event Stream Context
            <v-dialog
              v-model="d_context"
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
                  Event Stream Context
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
            <v-col lg="12">
              <context-editor
                @complete="contextCompleted" />
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          <div>
            <v-icon>mdi-map-marker</v-icon>
            Event Stream Location
            <v-dialog
              v-model="d_location"
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
                  Event Stream Location
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
          <v-text-field
            v-model="lonS"
            label="Lon"
            prepend-icon="mdi-map-marker" />
          <v-text-field
            v-model="latS"
            label="Lat"
            prepend-icon="mdi-map-marker" />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-row>
        <v-col lg="1">
          <v-btn v-t="'actions.save'"
                 @click="savePaths"
                 color="success lighten-1"
                 class="text--primary font-weight-black" />
        </v-col>
      </v-row>
    </v-expansion-panels>
  </v-container>
</template>

<script>
import { mapActions } from 'vuex'
import ShaclEditor from '../../components/ShaclEditor'
import ContextEditor from '../../components/ContextEditor'
import { actionTypes } from '../../store/models/types'
import page from '~/mixins/page'

export default {
  name: 'ModelCreate',
  components: { ShaclEditor, ContextEditor },
  mixins: [page],
  data () {
    return {
      model: {
        'id': '102e6ee90544a3d00943de5fa7b9b3c094e95a12',
        'title': 'Real Time data MUV Monitoring Stations',
        'category': 'Sensor',
        'type': 'Meteo',
        'dataowner': 'Stad Gent - Dienst Data & Informatie',
        'dataprocessing': '',
        'link': '',
        'retention': '2 weken',
        'longitude': 3.704006,
        'latitude': 51.050938
      },
      shacl: '',
      dataPaths: [],
      modelName: '',
      modelDescription: '',
      localContext: '[]',
      globalContext: '[]',
      lonS: '',
      latS: '',
      d_SHACL: false,
      d_context: false,
      d_location: false,
      d_basicInfo: false
    }
  },
  computed: {
    latPath () {
      return this.latS.split(' ')
    },
    lonPath () {
      return this.lonS.split(' ')
    }
  },
  mounted () {
    this.setCrumbs([
      { label: this.$t('nav.home'), route: { name: 'index' } },
      { label: this.$t('nav.models'), route: { name: 'models' } },
      { label: this.$t('nav.createModel'), route: { name: 'models-create' } }
    ])
  },
  methods: {
    updateDataPaths (paths) {
      this.dataPaths = paths
    },
    shaclCompleted (shacl) {
      this.shacl = shacl
    },
    contextCompleted (result) {
      const { localContext, globalContext } = result
      console.log(localContext)
      console.log(globalContext)
      this.localContext = localContext
      this.globalContext = globalContext
    },
    savePaths () {
      const modelcreated = {
        paths: this.dataPaths,
        name: this.modelName,
        description: this.modelDescription,
        shacl: this.shacl,
        localContext: this.localContext,
        globalContext: this.globalContext,
        latPath: this.latPath,
        lonPath: this.lonPath
      }
      console.log(modelcreated)
      this.saveDataPaths({
        paths: this.dataPaths,
        name: this.modelName,
        description: this.modelDescription,
        shacl: this.shacl,
        localContext: this.localContext,
        globalContext: this.globalContext,
        latPath: this.latPath,
        lonPath: this.lonPath
      }).then(() => {
        this.$router.push({ name: 'index' })
      })
    },
    ...mapActions('models', { saveDataPaths: actionTypes.SAVE_MODEL })
  }
}
</script>

<style scoped>

</style>
