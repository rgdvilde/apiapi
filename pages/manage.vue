<template>
  <v-container>
    <v-row align="center">
      <v-btn
        @click="flushCache"
        :loading="loadingFlushBtn"
        color="danger"
        class="mr-4">
        {{ $t('actions.flushCache') }}
      </v-btn>
      <span v-if="flushMessage"
            :class="flushTextColor">
        {{ $t(flushMessage) }}
      </span>
    </v-row>
  </v-container>
</template>
<script>
import { mapActions } from 'vuex'
import { actionTypes } from '~/store/api'

export default {
  name: 'ServerManagement',
  data () {
    return {
      loadingFlushBtn: false,
      flushMessage: '',
      flushSuccess: true
    }
  },
  computed: {
    flushTextColor () {
      return this.flushSuccess ? 'green--text text--lighten-1' : 'red--text text--lighten-1'
    }
  },
  methods: {
    ...mapActions({ flush: 'api/' + actionTypes.FLUSH_CACHE }),
    async flushCache () {
      this.loadingFlushBtn = true
      this.flushSuccess = await this.flush()
      if (this.flushSuccess) {
        this.flushMessage = 'notifications.cacheFlushed'
      } else {
        this.flushMessage = 'notifications.cacheNotFlushed'
      }
      this.loadingFlushBtn = false
    }
  }
}
</script>
