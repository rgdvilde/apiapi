<template>
  <div class="passtroughEditor">
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      {{ $t('actions.check') }}
    </v-btn>
    <vue-json-pretty
      :path="'res'"
      :data="endpointData" />
  </div>
</template>
<script>
import VueJsonPretty from 'vue-json-pretty'
export default {
  name: 'PasstroughEditor',
  components: {
    VueJsonPretty
  },
  props: {
    endpointData: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  methods: {
    complete () {
      this.$emit('complete')
    }
  }
}
</script>
