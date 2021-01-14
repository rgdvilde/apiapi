<template>
  <div>
    <v-card
      v-for="violationPath in Object.keys(ReportDict)"
      :key="violationPath"
      class="mx-auto"
      max-width="800"
      color="grey lighten-3">
      <v-card-text>
        <b>{{ violationPath }}</b>
        <v-card
          v-for="constraintsComponent in Object.keys(ReportDict[violationPath])"
          @click="expandViolation(constraintsComponent + violationPath)"
          :key="constraintsComponent + violationPath"
          class="mx-auto"
          max-width="750">
          <v-card-text>
            <v-container v-if="!isOpen[constraintsComponent + violationPath]">
              <v-row>
                <v-col
                  cols="9">
                  {{ constraintsComponent }}
                </v-col>
                <v-col
                  cols="3">
                  {{ ReportDict[violationPath][constraintsComponent].length }}
                </v-col>
              </v-row>
            </v-container>
            <v-container v-if="isOpen[constraintsComponent + violationPath]">
              <v-row>
                {{ constraintsComponent }}
              </v-row>
              <v-row v-for="violation in ReportDict[violationPath][constraintsComponent]">
                <v-col
                  cols="6">
                  {{ violation.resultNode }}
                </v-col>
                <v-col
                  cols="6">
                  {{ violation.resultMessage }}
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import hash from 'object-hash'
export default {
  name: 'ValidationReport',
  props: {
    validationReport: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      clickedOpenList: [],
      clickedOpen: {}
    }
  },
  computed: {
    ReportDict () {
      const reportDict = {}
      console.log(this.validationReport)
      JSON.parse(this.validationReport).forEach((r) => {
        const resultPath = r.resultNode['http://www.w3.org/ns/shacl#resultPath'][0]['@id']
        const sourceConstraintComponent = r.resultNode['http://www.w3.org/ns/shacl#sourceConstraintComponent'][0]['@id']
        const resultMessage = r.resultNode['http://www.w3.org/ns/shacl#resultMessage'][0]['@value']
        const resultNode = r.resultNode['http://www.w3.org/ns/shacl#focusNode'][0]['@id']
        if (!(resultPath in reportDict)) {
          reportDict[resultPath] = {}
        }
        if (!(sourceConstraintComponent in reportDict[resultPath])) {
          reportDict[resultPath][sourceConstraintComponent] = []
        }
        reportDict[resultPath][sourceConstraintComponent].push({
          resultNode,
          resultMessage,
          resultPath,
          sourceConstraintComponent
        })
      })
      return reportDict
    },
    isOpen () {
      const r = {}
      this.clickedOpenList.forEach((el) => {
        r[el.name] = el.value
      })
      return r
    },
    hashDict () {
      return hash(this.clickedOpen)
    }
  },
  watch: {
    clickedOpen: {
      handler (newVal) {
        console.log('property updated', newVal)
      },
      deep: true
    }
  },
  methods: {
    expandViolation (path) {
      let set = false
      this.clickedOpenList.forEach((el) => {
        if (el.name === path) {
          el.value = !el.value
          set = true
        }
      })
      if (!set) {
        this.clickedOpenList.push({
          'name': path,
          'value': true
        })
      }
    }
  }
}
</script>
