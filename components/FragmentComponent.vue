<template>
  <div class="fragmentComponent">
    <v-text-field
      v-model="basePath"
      label="BasePath" />
    <v-text-field
      v-model="recordId"
      label="RecordId" />
    <v-text-field
      v-model="lat"
      label="Lat" />
    <v-text-field
      v-model="lon"
      label="Lon" />
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      Submit
    </v-btn>
  </div>
</template>
<script>

export default {
  name: 'FragmentComponent',
  data () {
    return {
      basePath: '',
      recordId: '',
      lat: '',
      lon: ''
    }
  },
  methods: {
    complete () {
      const { basePath, recordId, lat, lon } = this
      const r = {
        basePath,
        recordId,
        lat,
        lon
      }
      this.$emit('complete', r)
    }
  }
}
</script>
