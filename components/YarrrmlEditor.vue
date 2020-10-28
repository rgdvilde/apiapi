<template>
  <div class="yarrrmleditor">
    <v-textarea
      @change="setYARRRML"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter RML" />
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      {{ $t('actions.submitYARRRML') }}
    </v-btn>
  </div>
</template>
<script>

export default {
  name: 'YarrrmlEditor',
  methods: {
    complete () {
      console.log(this.yarrrml)
      this.$emit('complete', this.yarrrml)
    },
    setYARRRML (yarrrml) {
      if (this.yarrrml !== yarrrml) {
        console.log(yarrrml)
        this.yarrrml = yarrrml
      }
    }

  }
}
</script>
