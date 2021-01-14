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
    </v-btn>
    <v-dialog
      v-model="dialog"
      max-width="600px">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          outlined>
          <v-icon>
            mdi-lock
          </v-icon>
          Request Parameters
        </v-btn>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">Request Parameters</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row v-for="(req_param,index) in cardInfo.req_params"
                   v-bind:key="index">
              <v-col
                cols="2">
                <v-btn
                  @click="cardInfo.req_params.splice(index,1)"
                  icon>
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-col>
              </v-btn>
              <v-col
                cols="5">
                <v-text-field
                  v-model="req_param['key']"
                  label="Key"
                  hide-details="auto" />
              </v-col>
              <v-col
                cols="5">
                <v-text-field
                  v-model="req_param['value']"
                  label="Value"
                  hide-details="auto" />
              </v-col>
            </v-row>
            <!--     <v-sheet v-for="label in keys"
             :key="label">
      <v-textarea
        :label="label"
        v-model="apimodel[label]"
        flat
        filled
        dense
        auto-grow />
    </v-sheet> -->
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="cardInfo.req_params.push({'key':'','value':''})"
            color="blue darken-1"
            text>
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      cardInfo: { 'req_params': [] },
      dialog: false
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
