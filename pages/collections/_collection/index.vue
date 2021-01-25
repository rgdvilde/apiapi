<template>
  <v-container fluid>
    <h1 v-text="collection.name"
        class="mb-5" />
    <p v-text="collection.description" />
    <p>
      This collection maps to <router-link :to="{ name: 'models-model', params: { model: collection.model._id } }">
        {{ collection.model.name }}
      </router-link>
    </p>
    <v-row>
      <v-col lg="8">
        <v-toolbar>
          Sampling
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
                Sampling
              </v-card-title>

              <v-card-text>
                Configure, start, pause and remove the sampling process from here. Reconfiguring the sampling process is done by removing and restarting one.<br>
                <v-icon>mdi-play-circle-outline</v-icon> Configure sampling process<br>
                <v-icon>mdi-pause-circle</v-icon> Pause sampling process<br>
                <v-icon>mdi-play-circle</v-icon> Restart sampling process<br>
                <v-icon>mdi-delete</v-icon> Remove sampling process<br>
              </v-card-text>

              <v-divider />
            </v-card>
          </v-dialog>
          <v-dialog
            v-model="dialog"
            v-if="!created"
            max-width="600px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                icon>
                <v-icon>mdi-play-circle-outline</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">Configure sampling process</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col
                      cols="6">
                      Sample rate (seconds)
                    </v-col>
                    <v-col
                      cols="12">
                      <v-slider
                        v-model="sampleRate"
                        :max="1000"
                        :min="1"
                        class="align-center"
                        hide-details>
                        <template v-slot:append>
                          <v-text-field
                            v-model="sampleRate"
                            class="mt-0 pt-0"
                            hide-details
                            single-line
                            type="number"
                            style="width: 60px" />
                        </template>
                      </v-slider>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="6">
                      Local cache time (seconds)
                    </v-col>
                    <v-col
                      cols="12">
                      <v-text-field
                        v-model="localCacheTime"
                        class="mt-0 pt-0"
                        hide-details
                        single-line
                        type="number"
                        style="width: 60px" />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col
                      cols="6">
                      Max cache age in response (seconds)
                    </v-col>
                    <v-col
                      cols="12">
                      <v-text-field
                        v-model="maxCacheAge"
                        class="mt-0 pt-0"
                        hide-details
                        single-line
                        type="number"
                        style="width: 60px" />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  @click="dialog = false"
                  color="blue darken-1"
                  text>
                  Close
                </v-btn>
                <v-btn
                  @click="dialog = false;created=true;startSampling()"
                  color="blue darken-1"
                  text>
                  Save and start
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-btn
            v-bind="attrs"
            v-on="on"
            v-if="started && created"
            @click="stopSampling"
            icon>
            <v-icon>mdi-pause-circle</v-icon>
          </v-btn>
          <v-btn
            v-bind="attrs"
            v-on="on"
            v-if="!started && created"
            @click="startSampling"
            icon>
            <v-icon>mdi-play-circle</v-icon>
          </v-btn>
          <v-btn
            v-bind="attrs"
            v-on="on"
            v-if="!started && created"
            @click="clearSampling"
            icon>
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-toolbar>
        <api-list :collection-id="collection._id"
                  :apis="collection.apis"
                  :uploads="collection.uploads" />
        </v-slider>
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex'
import page from '~/mixins/page'
import ApiList from '~/components/organisms/ApiList.vue'
import { actionTypes, getterTypes } from '~/store/collections'

export default {
  name: 'CollectionDetail',
  components: { ApiList },
  mixins: [page],
  head () {
    return {
      title: this.collection.name
    }
  },
  data () {
    return {
      id: this.$route.params.collection,
      sampleRate: 300,
      maxCacheAge: 300,
      localCacheTime: 300,
      started: false,
      dialog: false,
      created: false
    }
  },
  computed: {
    ...mapGetters('collections', {
      collectionById: getterTypes.COLLECTION_BY_ID
    }),
    collection () {
      return this.collectionById(this.id)
    }
  },
  watch: {
    collection: {
      handler (value) {
        this.sampleRate = value.sampleRate
      },
      immediate: true
    }
  },
  async fetch ({ store, params }) {
    await store.dispatch('collections/' + actionTypes.FETCH_COLLECTION_BY_ID, params.collection)
  },
  mounted () {
    this.setCrumbs([{ label: this.$t('nav.home'), route: { name: 'index' } }, { label: this.collection.name }])
  },
  methods: {
    startSampling () {
      this.started = true
      const samplePayload = JSON.stringify({
        'sampleRate': this.sampleRate,
        'maxCacheAge': this.maxCacheAge,
        'localCacheTime': this.localCacheTime
      })
      fetch(`${process.env.baseUrl}/api/collection/${this.collection._id}/update`, {
        method: 'PUT',
        body: samplePayload,
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
      const payload = JSON.stringify({
        'collectionId': this.collection._id,
        'base': process.env.baseUrl,
        'sampleRate': this.sampleRate
      })
      fetch(`${process.env.baseUrl}/api/server/sample/start`, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
      console.log(this.sampleRate)
    },
    stopSampling () {
      this.started = false
      const payload = JSON.stringify({
        'collectionId': this.collection._id
      })
      fetch(`${process.env.baseUrl}/api/server/sample/stop`, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
    },
    clearSampling () {
      this.started = false
      this.created = false
      this.sampleRate = 300
      this.maxCacheAge = 300
      this.localCacheTime = 300
      const payload = JSON.stringify({
        'collectionId': this.collection._id
      })
      fetch(`${process.env.baseUrl}/api/server/sample/clear`, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        }
      })
    }
  }
}
</script>
