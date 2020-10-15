<template>
  <div class="rmleditor">
    <v-textarea
      @change="setRML"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter RML" />
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      {{ $t('actions.submitRML') }}
    </v-btn>
  </div>
</template>
<script>

export default {
  name: 'RmlEditor',
  methods: {
    complete () {
      console.log(this.rml)
      this.$emit('complete', this.rml)
    },
    setRML (rml) {
      if (this.rml !== rml) {
        console.log(rml)
        this.rml = rml
      }
    }

  }
}
</script>
