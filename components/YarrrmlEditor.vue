<template>
  <div class="yarrrmleditor">
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
  name: 'YarrrmlEditor',
  methods: {
    complete (yarrrml) {
      console.log(this.yarrrml)
      this.$emit('complete', yarrrml)
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
