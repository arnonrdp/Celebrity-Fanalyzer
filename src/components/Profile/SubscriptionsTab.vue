<template>
  <q-table :columns="columns" flat hide-bottom :pagination="pagination" :rows="filteredPrompts ?? []" title="Prompts" class="prompts-table">
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn color="primary" flat icon="unsubscribe" round data-test="prompt-unsubscribe" @click="unsubscribe('prompts', props.row.id)">
          <q-tooltip>Unsubscribe</q-tooltip>
        </q-btn>
      </q-td>
    </template>
  </q-table>
  <q-separator spaced="xl" />
  <q-table :columns="columns" flat hide-bottom :pagination="pagination" :rows="filteredEntries ?? []" title="Entries" class="entries-table">
    <template v-slot:body-cell-actions="props">
      <q-td :props="props">
        <q-btn color="primary" flat icon="unsubscribe" data-test="entrie-unsubscribe" round @click="unsubscribe('entries', props.row.id)">
          <q-tooltip>Unsubscribe</q-tooltip>
        </q-btn>
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
import { useEntryStore, useNotificationStore, usePromptStore, useUserStore } from 'app/src/stores'
import { computed } from 'vue'

const entryStore = useEntryStore()
const notificationStore = useNotificationStore()
const promptStore = usePromptStore()
const userStore = useUserStore()

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions' }
]
const pagination = { sortBy: 'date', descending: true, rowsPerPage: 0 }

const filteredPrompts = computed(() => promptStore.getPrompts?.filter((prompt) => userStore.getSubscriptions?.includes(prompt.id)))
const filteredEntries = computed(() => entryStore.getEntries?.filter((entry) => userStore.getSubscriptions?.includes(entry.id)))

function unsubscribe(collectionName, documentId) {
  notificationStore.toggleSubscription(collectionName, documentId)
}
</script>
