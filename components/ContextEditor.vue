<template>
  <div class="contexteditor">
    <v-textarea
      @change="setContext"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter Shacl" />
    <v-btn
      @click="complete"
      color="success lighten-1"
      class="mr-4">
      {{ $t('actions.submitContext') }}
    </v-btn>
  </div>
</template>
<script>

export default {
  name: 'ContextEditor',
  methods: {
    complete () {
      console.log(this.context)
      this.$emit('complete', this.context)
    },
    setContext (context) {
      if (this.context !== context) {
        console.log(context)
        this.context = context
      }
    }

  }
}
</script>
