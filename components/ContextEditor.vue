<template>
  <div class="contexteditor">
    <v-text-field
      v-model="lonS"
      label="Lon" />
    <v-text-field
      v-model="latS"
      label="Lat" />
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
  data () {
    return {
      context: '',
      latS: '',
      lonS: ''
    }
  },
  methods: {
    complete () {
      this.$emit('complete', {
        context: this.context,
        latPath: this.latS,
        lonPath: this.lonS
      })
    },
    setContext (context) {
      if (this.context !== context) {
        this.context = context
      }
    }

  }
}
</script>
