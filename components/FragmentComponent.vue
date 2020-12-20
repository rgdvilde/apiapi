<template>
  <div class="fragmentComponent">
    <v-text-field
      v-model="basePath"
      @input="update"
      label="BasePath" />
    <v-text-field
      v-model="recordId"
      @input="update"
      label="RecordId" />
    <v-text-field
      v-if="loc"
      v-model="lat"
      @input="update"
      label="Lat" />
    <v-text-field
      v-if="loc"
      v-model="lon"
      @input="update"
      label="Lon" />
  </div>
</template>
<script>

export default {
  name: 'FragmentComponent',
  props: {
    loc: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data () {
    return {
      basePath: '',
      recordId: '',
      lat: '',
      lon: ''
    }
  },
  methods: {
    update () {
      const { basePath, recordId, lat, lon } = this
      this.$emit('update', {
        basePath,
        recordId,
        lat,
        lon
      })
    }
  }
}
</script>
