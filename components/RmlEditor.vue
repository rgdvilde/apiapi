<template>
  <div class="rmleditor">
    <v-textarea
      @change="complete"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter RML" />
  </div>
</template>
<script>

export default {
  name: 'RmlEditor',
  methods: {
    complete (rml) {
      console.log(this.rml)
      this.$emit('complete', rml)
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
