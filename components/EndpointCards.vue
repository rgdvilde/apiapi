<template>
  <div>
    <v-tabs v-model="tab">
      <v-tab
        v-for="(name) in cards"
        :key="name.name">
        {{ name.name }}
      </v-tab>
      <v-btn
        @click="addEndpoint"
        icon>
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item
        v-for="(name,index) in cards"
        :key="name.name">
        <v-card flat>
          <endpoint-card
            :text="name"
            :endpointData="endpointData[index]"
            @update="update" />
          <v-btn
            @click="removeEndpoint">
            Remove
          </v-btn>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>
<script>
import EndpointCard from '~/components/EndpointCard.vue'
export default {
  name: 'EndpointCards',
  components: {
    EndpointCard
  },
  props: {
    endpointInformation: {
      type: Array,
      default () {
        return []
      }
    }
  },
  data () {
    return {
      tab: null,
      cards: [{ name: 'Endpoint 1', data: '{}' }],
      endpoints: [{}],
      edit: null
    }
  },
  computed: {
    endpointData () {
      const { endpointInformation } = this
      const endpointD = []
      endpointInformation.forEach((t) => {
        endpointD.push(t.data)
      })
      return endpointD
    }
  },
  methods: {
    addEndpoint () {
      this.cards.push({
        name: 'Endpoint ' + (this.cards.length + 1),
        data: ''
      })
      this.endpoints.push({})
      this.$emit('update', this.endpoints)
    },
    removeEndpoint () {
      this.cards.splice(this.tab, 1)
      this.cards.forEach((card, index) => {
        card.name = 'Endpoint ' + (index + 1)
      })
      this.endpoints.splice(this.tab, 1)
      this.$emit('update', this.endpoints)
    },
    update (endpoint) {
      console.log(this.endpointInformation)
      const { tab, endpoints } = this
      endpoints[tab] = endpoint
      this.$emit('update', this.endpoints)
    },
    validateEndpoints () {
      this.$emit('validated', true)
    }

  }
}
</script>
