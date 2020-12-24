<template>
  <div>
    <div v-if="inputType === 'radio'" />
    <v-text-field
      :minlength="minlength"
      :maxlength="maxlength"
      v-model="value"
      @input="onInput"
      label="Main input"
      hide-details="auto" />
  </div>
</template>

<script>
import * as $rdf from 'rdflib'

const XSD = new $rdf.Namespace('http://www.w3.org/2001/XMLSchema#')

export default {
  name: 'TypedInput',
  props: {
    constraints: {
      type: Object,
      default () {
        return {}
      }
    },
    value: {
      type: String
    },
    isValid: {
      type: Boolean,
      default () {
        return false
      }
    },
    constant: {
      type: Boolean,
      default () {
        return false
      }
    }
  },
  data () {
    return {
      'id': null
    }
  },
  inject: [
    'options'
  ],
  computed: {
    inputType () {
      if (this.constant === false) {
        return 'text'
      } else {
        switch (!this.constraints.datatype || this.constraints.datatype.value) {
          case XSD('date').value:
            return 'date'
          case XSD('time').value:
            return 'time'
          case XSD('dateTime').value:
          case XSD('dateTimeStamp').value:
            return 'datetime-local'
          case XSD('integer').value:
          case XSD('decimal').value:
            return 'number'
          case XSD('boolean').value:
            return 'radio'
          default:
            return 'text'
        }
      }
    },
    minlength () {
      return this.constraints.minLength ? this.constraints.minLength : null
    },
    maxlength () {
      return this.constraints.maxLength ? this.constraints.maxLength : null
    }
  },
  mounted () {
    this.id = this._uid
  },
  methods: {
    onInput () {
      console.log(this.value)
      this.$emit('input', this.value)
    }
  }
}
</script>

<style scoped>

</style>
