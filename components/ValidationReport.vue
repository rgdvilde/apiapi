<template>
  <div>
    <v-card
      v-for="violationPath in Object.keys(ReportDict)"
      :key="violationPath"
      class="mx-auto"
      max-width="344">
      <v-card-text>
        <v-card
          v-for="violationRep in ReportDict[violationPath]"
          :key="violationRep.resultNode + violationPath"
          class="mx-auto"
          max-width="344">
          <v-card-text>
            {{ violationRep }}
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'ValidationReport',
  props: {
    validationReport: {
      type: String,
      required: true
    }
  },
  computed: {
    ReportDict () {
      const reportDict = {}
      console.log(this.validationReport)
      JSON.parse(this.validationReport).forEach((r) => {
        const resultPath = r.resultNode['http://www.w3.org/ns/shacl#resultPath']
        const sourceConstraintComponent = r.resultNode['http://www.w3.org/ns/shacl#sourceConstraintComponent']
        const resultMessage = r.resultNode['http://www.w3.org/ns/shacl#resultMessage']
        const resultNode = r.resultNode['http://www.w3.org/ns/shacl#focusNode']
        if (!(resultPath in reportDict)) {
          reportDict[resultPath] = []
        }
        reportDict[resultPath].push({
          resultNode,
          resultMessage,
          resultPath,
          sourceConstraintComponent
        })
      })
      return reportDict
    }
  }
}
</script>
