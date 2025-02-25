<template>
  <h5 v-if="!feedbackStore.getFeedbacks && feedbackStore.isLoaded" class="text-center" data-test="no-feedback-message">
    There are no feedbacks yet.
  </h5>
  <q-table
    v-else
    :columns="columns"
    data-test="feedback-table"
    grid
    hide-header
    :loading="!feedbackStore.isLoaded || feedbackStore.isLoading"
    :pagination="pagination"
    row-key="created"
    :rows="feedbackStore.getFeedbacks ?? []"
    style="left: 0; right: 0"
    title="Manage Feedbacks"
  >
    <template v-slot:item="props">
      <div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 col-xl-2 q-pa-sm" data-test="feedback-card">
        <q-card class="feedback">
          <q-card-section class="text-center">
            <div class="text-body1" data-test="user-div">{{ props.row.author.displayName }}</div>
            <q-btn color="negative" data-test="trash-button" icon="delete" round size="sm" @click="confirmDelete(props.row)" />
          </q-card-section>
          <q-separator />
          <q-card-section>
            <p class="text-body2 text-bold" data-test="feedback-subject">
              {{ shortMonthDayTime(props.row.created) }} ~ {{ props.row.subject }}
            </p>
            <span data-test="feedback-message" style="white-space: pre-line">
              {{ props.row.message }}
            </span>
          </q-card-section>
        </q-card>
      </div>
    </template>
  </q-table>

  <q-dialog v-model="deleteDialog.show" data-test="delete-dialog">
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Delete Feedback?</h6>
      </q-card-section>
      <q-card-section data-test="delete-dialog-message">
        Are you sure you want to delete this feedback from {{ deleteDialog.author.displayName }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup data-test="cancel-button" />
        <q-btn data-test="delete-button" flat label="Delete" color="negative" @click="onDeleteFeedback(deleteDialog.id)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useErrorStore, useFeedbackStore } from 'src/stores'
import { shortMonthDayTime } from 'src/utils/date'
import { onMounted, ref } from 'vue'

const $q = useQuasar()
const errorStore = useErrorStore()
const feedbackStore = useFeedbackStore()

const columns = [
  { name: 'created', align: 'left', label: 'Created At', field: 'created', sortable: true },
  { name: 'message', align: 'left', label: 'Feedback', field: 'message', sortable: true },
  { name: 'action', label: 'Action', field: 'action' }
]
const deleteDialog = ref({})
const pagination = { sortBy: 'created', descending: true, rowsPerPage: 0 }

onMounted(async () => {
  await feedbackStore.fetchFeedbacks()
})

function confirmDelete(feedback) {
  deleteDialog.value = feedback
  deleteDialog.value.show = true
}

function onDeleteFeedback(id) {
  feedbackStore
    .deleteFeedback(id)
    .then(() => $q.notify({ color: 'positive', message: 'Feedback deleted successfully' }))
    .catch((error) => errorStore.throwError(error, 'Failed to delete feedback'))
  deleteDialog.value.show = false
}
</script>

<style scoped>
.feedback .q-btn {
  opacity: 0;
  position: absolute;
  right: -0.8rem;
  top: -0.8rem;
  transition: all 0.2s ease;
  z-index: 1;
}
.feedback:hover .q-btn {
  opacity: 1;
}
</style>
