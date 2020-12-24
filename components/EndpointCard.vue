<template>
  <div>
    <v-btn
      @click="t_eventStream"
      outlined>
      <v-icon v-if="!b_eventStream">
        mdi-view-stream-outline
      </v-icon><v-icon v-if="b_eventStream">
        mdi-view-stream
      </v-icon>Event Stream
    </v-btn>
    <v-btn
      v-if="!b_eventStream"
      disabled>
      <v-icon>mdi-map-marker-off</v-icon>Location
    </v-btn>
    <v-btn
      v-if="b_eventStream"
      @click="t_location"
      outlined>
      <v-icon v-if="!b_location">
        mdi-map-marker-off
      </v-icon>
      <v-icon v-if="b_location">
        mdi-map-marker
      </v-icon>
      Location
    </v-btn>
    <v-text-field
      v-model="cardInfo.name"
      :label="'name'"
      @input="update"
      required />
    <v-text-field
      v-model="cardInfo.url"
      :label="'url'"
      @input="update"
      required />
    <fragment-component
      v-if="b_eventStream"
      :loc="b_location"
      @update="u_cardInfo" />
  </div>
</template>
<script>
import FragmentComponent from '~/components/FragmentComponent.vue'
export default {
  name: 'EndpointCard',
  components: {
    FragmentComponent
  },
  props: {},
  data () {
    return {
      name: '',
      value: '',
      b_eventStream: false,
      b_location: false,
      cardInfo: {}
    }
  },
  methods: {
    getHeader () {},
    t_eventStream () {
      this.b_eventStream = !this.b_eventStream
      this.b_location = false
      if (!this.b_eventStream) {
        this.cardInfo = {}
      }
    },
    t_location () {
      this.b_location = !this.b_location
      if (!this.b_location) {
        delete this.cardInfo.lat
        delete this.cardInfo.lon
      }
    },
    u_cardInfo (fragmentInfo) {
      const { lat, lon, basePath, recordId } = fragmentInfo
      this.cardInfo = {
        ...this.cardInfo,
        lat,
        lon,
        basePath,
        recordId
      }
      this.update()
    },
    update () {
      this.$emit('update', this.cardInfo)
    }
  }
}
</script>
