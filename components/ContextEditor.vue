<template>
  <div class="contexteditor">
    <v-row>
      <v-col>
        <v-card
          elevation="2">
          <v-card-title>Fragment Context</v-card-title>
          <vue-json-editor
            v-model="globalContext"
            :style="btnStyles"
            :show-btns="false"
            :expandedOnStart="false"
            @json-change="complete_g"
            :mode="'code'" />
        </v-card>
      </v-col>
      </v-card>
      <v-col>
        <v-card
          elevation="2">
          <v-card-title>Data Point Context</v-card-title>
          <v-card-text>
            <vue-json-editor
              v-model="localContext"
              :show-btns="false"
              :style="btnStyles"
              :expandedOnStart="true"
              @json-change="complete_l"
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
    complete_g (json) {
      this.$emit('complete', {
        localContext: this.s_localContext,
        globalContext: JSON.stringify(json)
      })
    },
    complete_l (json) {
      this.$emit('complete', {
        localContext: JSON.stringify(json),
        globalContext: this.s_globalContext
      })
    }
  }
}
</script>
