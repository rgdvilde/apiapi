<template>
  <div class="constraintsvalidator">
    <v-textarea
      :value="output"
      name="input-7-1"
      label="Default style"
      hint="Enter Shacl" />
  </div>
</template>
<script>
export default {
  name: 'ConstraintsValidator',
  props: {
    output: {
      type: String,
      required: false,
      default: ''
    }
  }
}
</script>
