<template>
  <div class="shacleditor">
    <v-textarea
      @change="setShacl"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter Shacl" />
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      {{ $t('actions.submitShacl') }}
    </v-btn>
  </div>
</template>
<script>

export default {
  name: 'ShaclEditor',
  methods: {
    complete () {
      console.log(this.shacl)
      this.$emit('complete', this.shacl)
    },
    setShacl (shacl) {
      if (this.shacl !== shacl) {
        console.log(shacl)
        this.shacl = shacl
      }
    }

  }
}
</script>
