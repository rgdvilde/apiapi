<template>
  <div class="contexteditor">
    <v-text-field
      v-model="lonS"
      label="Lon" />
    <v-text-field
      v-model="latS"
      label="Lat" />
    <v-textarea
      @change="setlContext"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter local context" />
    <v-textarea
      @change="setgContext"
      name="input-7-1"
      label="Default style"
      value=""
      hint="Enter global context" />
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
      globalContext: '[]',
      localContext: '[]',
      latS: '',
      lonS: ''
    }
  },
  methods: {
    complete () {
      this.$emit('complete', {
        localContext: this.localContext,
        globalContext: this.globalContext,
        latPath: this.latS,
        lonPath: this.lonS
      })
    },
    setlContext (localContext) {
      if (this.localContext !== localContext) {
        this.localContext = localContext
      }
    },
    setgContext (globalContext) {
      if (this.globalContext !== globalContext) {
        this.globalContext = globalContext
      }
    }

  }
}
</script>
