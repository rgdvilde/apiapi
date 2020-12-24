<template>
  <div class="shacleditor">
    <v-textarea
      @change="setShacl"
      rows="16"
      name="input-7-1"
      label="SHACL shape"
      value=""
      hint="Enter Shacl" />
  </div>
</template>
<script>

export default {
  name: 'ShaclEditor',
  methods: {
    setShacl (shacl) {
      if (this.shacl !== shacl) {
        this.shacl = shacl
        this.$emit('complete', this.shacl)
      }
    }

  }
}
</script>
