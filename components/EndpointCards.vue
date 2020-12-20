<template>
  <div>
    <v-btn
      @click="addEndpoint">
      Add
    </v-btn>
    <v-tabs v-model="tab">
      <v-tab
        v-for="(name) in cards"
        :key="name.name">
        {{ name.name }}
      </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item
        v-for="(name) in cards"
        :key="name.name">
        <v-card flat>
          <endpoint-card
            :text="name"
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
  props: {},
  data () {
    return {
      tab: null,
      cards: [{ name: 'Endpoint 1' }],
      endpoints: [{}]
    }
  },
  methods: {
    addEndpoint () {
      this.cards.push({
        name: 'Endpoint ' + (this.cards.length + 1)
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
      const { tab, endpoints } = this
      endpoints[tab] = endpoint
      this.$emit('update', this.endpoints)
    }

  }
}
</script>
