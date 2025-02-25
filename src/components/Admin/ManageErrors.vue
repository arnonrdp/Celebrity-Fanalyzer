<template>
  <h5 v-if="errorStore.isLoaded && errorStore.getErrors.length === 0" class="text-center">Nothing is wrong! 🎉</h5>
  <q-table
    v-if="!errorStore.isLoaded || (errorStore.isLoaded && errorStore.getErrors.length > 0)"
    :columns="columns"
    bordered
    flat
    virtual-scroll
    hide-pagination
    :rows-per-page-options="[0]"
    :loading="!errorStore.isLoaded || errorStore.isLoading"
    :rows="errorStore.getErrors"
    title="Manage Errors"
    class="q-ma-md errors-table"
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="createdAt" :props="props">{{ shortMonthDayTime(props.row.createdAt) }}</q-td>
        <q-td key="user" :props="props">{{ props.row.user?.displayName || props.row.user }}</q-td>
        <q-td key="error" :props="props">
          {{ props.row.error?.split('\n')[0] || '' }}
        </q-td>
        <q-td key="action" :props="props">
          <q-btn
            color="negative"
            :disable="errorStore.isLoading"
            flat
            icon="delete"
            round
            size="sm"
            @click="confirmDelete(props.row)"
            data-test="delete-button"
          />
        </q-td>
        <q-tooltip style="font-size: 0.8rem; white-space: pre">
          {{ props.row.error }}
        </q-tooltip>
      </q-tr>
    </template>
  </q-table>

  <q-dialog v-model="deleteDialog.show" persistent>
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Delete Error?</h6>
      </q-card-section>
      <q-card-section>Are you sure you want to delete this error?</q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup data-test="cancel-delete-button" />
        <q-btn flat label="Delete" color="negative" @click="onDeleteError(deleteDialog.id)" data-test="confirm-delete-button" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-btn
    v-if="errors.value?.length !== errorStore?.totalErrors"
    :loading="errorStore.isLoading"
    @click="fetchMoreErrors"
    label="Load More"
    color="primary"
    class="q-mr-md float-right"
    data-test="load-more-button"
  />
</template>

<script setup>
import { useErrorStore } from 'src/stores'
import { shortMonthDayTime } from 'src/utils/date'
import { onMounted, ref, watchEffect } from 'vue'

const errorStore = useErrorStore()

const columns = [
  { name: 'createdAt', align: 'left', label: 'Created At', field: 'createdAt', sortable: true },
  { name: 'user', align: 'left', label: 'User', field: 'user', sortable: true },
  { name: 'error', align: 'left', label: 'Error', field: 'error', sortable: true },
  { name: 'action', label: 'Action', field: 'action' }
]
const deleteDialog = ref({})
const errors = ref([])
console.log(errorStore.getErrors)
onMounted(async () => {
  await errorStore.fetchErrors()
  await errorStore.fetchErrorsCount()
})

watchEffect(() => {
  if (errorStore.getErrors) {
    errors.value = errorStore.getErrors
  }
})

function confirmDelete(error) {
  deleteDialog.value.show = true
  deleteDialog.value.id = error.id
}

function onDeleteError(id) {
  errorStore.deleteError(id).catch((error) => errorStore.throwError(error, 'Failed to delete error'))
  deleteDialog.value.show = false
}

function fetchMoreErrors() {
  errorStore.fetchErrors({ loadMore: true })
}
</script>

<style scoped>
.errors-table {
  left: 0;
  right: 0;
  max-height: calc(100vh - 300px);
}

.errors-table .q-table__middle > .q-table > thead > tr {
  background-color: white !important;
  position: sticky !important;
  top: 0;
  z-index: 1 !important;
}
</style>
