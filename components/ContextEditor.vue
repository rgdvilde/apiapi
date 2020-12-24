<template>
  <div class="contexteditor">
    <v-row>
      <v-col>
        <v-card
          elevation="2">
          <v-card-title>Root context</v-card-title>
          <vue-json-editor
            v-model="globalContext"
            :style="btnStyles"
            :show-btns="false"
            :expandedOnStart="false"
            @json-change="complete"
            :mode="'code'" />
        </v-card>
      </v-col>
      </v-card>
      <v-col>
        <v-card
          elevation="2">
          <v-card-title>Data point context</v-card-title>
          <v-card-text>
            <vue-json-editor
              v-model="localContext"
              :show-btns="false"
              :style="btnStyles"
              :expandedOnStart="true"
              @json-change="complete"
              :mode="'code'" />
          </v-card-text>
        </v-card>
      </v-col>
      </v-card>
    </v-row>
  </div>
</template>
<script>
import vueJsonEditor from 'vue-json-editor'
export default {
  name: 'ContextEditor',
  components: {
    vueJsonEditor
  },
  data () {
    return {
      globalContext: [],
      localContext: []
    }
  },
  computed: {
    btnStyles () {
      return {
        'min-height': '300px',
        'display': 'grid'
      }
    },
    s_globalContext () {
      return JSON.stringify(this.globalContext)
    },
    s_localContext () {
      return JSON.stringify(this.localContext)
    }
  },
  methods: {
    complete () {
      this.$emit('complete', {
        localContext: this.s_localContext,
        globalContext: this.s_globalContext
      })
    }
  }
}
</script>
