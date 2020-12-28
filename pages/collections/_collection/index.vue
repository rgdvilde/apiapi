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
        <v-btn
          @click="startSampling"
          text
          class="mr-4">
          {{ $t('actions.reset') }}
        </v-btn>
        <v-btn
          @click="stopSampling"
          text
          class="mr-4">
          Stop
        </v-btn>
        <v-btn
          @click="clearSampling"
          text
          class="mr-4">
          Clear
        </v-btn>
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
        <v-text-field
          v-model="maxCacheAge"
          class="mt-0 pt-0"
          hide-details
          single-line
          type="number"
          style="width: 60px" />
        <api-list :collection-id="collection._id"
                  :apis="collection.apis"
                  :uploads="collection.uploads" />
        </v-slider>
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
      maxCacheAge: 300
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
      const samplePayload = JSON.stringify({
        'sampleRate': this.sampleRate,
        'maxCacheAge': this.maxCacheAge
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
