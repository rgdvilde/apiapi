<template>
  <div id="app">
    <shacl-mapper
      :shapesGraphText="model.shacl"
      :endpointData="endpointData"
      @complete="complete" />
  </div>
</template>

<script>
import ShaclMapper from './ShaclMapper.vue'
export default {
  name: 'ShaclMapperWrapper',
  components: {
    'shacl-mapper': ShaclMapper
  },
  props: {
    model: {
      type: Object,
      required: true
    },
    endpointData: {
      type: Object,
      required: true
    }
  },
  methods: {
    complete (rml) {
      this.$emit('complete', rml)
    }
  }
}
</script>
