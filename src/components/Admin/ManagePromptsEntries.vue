<template>
  <q-table
    v-if="prompts && userStore.isEditorOrAbove"
    flat
    bordered
    hide-bottom
    class="q-ma-md custom-table"
    title="Manage Prompts & Entries"
    :columns="columns"
    :filter="filter"
    :loading="promptStore.isLoading"
    no-data-label="No prompts found."
    :pagination="pagination"
    :rows="prompts"
  >
    <template v-slot:top-right>
      <q-input :data-test="isLoading ? '' : 'input-search'" debounce="300" dense placeholder="Search" v-model="filter">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </template>
    <template v-slot:body="props">
      <q-tr class="new" data-test="item-card" :props="props" id="item-card">
        <q-td auto-width>
          <q-btn
            dense
            flat
            round
            color="red"
            data-test="button-expand"
            :disable="isLoading"
            :icon="props.expand ? 'expand_less' : 'expand_more'"
            @click="toggleExpand(props)"
          >
            <q-tooltip>
              {{ props.expand ? 'Collapse' : 'Expand' }}
            </q-tooltip>
          </q-btn>
        </q-td>

        <q-td class="text-center" auto-width style="width: 101px">
          <div style="width: 69px">
            {{ props.row.date }}
          </div>
        </q-td>
        <q-td class="authorRef text-center">
          <a
            :href="`/fan/${props.row?.author?.uid}`"
            class="q-mr-sm"
            data-test="author-name"
            @click.prevent="router.push(`/fan/${props.row?.author?.uid}`)"
          >
            {{ props.row.author?.displayName }}
          </a>
        </q-td>
        <q-td>
          <a :href="props.row?.slug" class="q-mr-sm" data-test="prompt-title" @click.prevent="router.push(props.row?.slug)">
            {{ props.row.title }}
          </a>
        </q-td>
        <q-td class="text-right">
          <span v-if="!props.row?.escrowId">
            <q-btn
              v-if="userStore.isEditorOrAbove"
              flat
              round
              color="green"
              data-test="button-deposit"
              icon="payment"
              size="sm"
              :disable="promptStore.isLoading"
              @click="onProceedDepositFundDialog(props.row)"
            >
              <q-tooltip>Deposit escrow fund</q-tooltip>
            </q-btn>
          </span>
          <q-btn
            v-if="userStore.isEditorOrAbove"
            flat
            round
            color="warning"
            data-test="button-edit"
            icon="edit"
            size="sm"
            :disable="promptStore.isLoading"
            @click="$emit('openPromptDialog', props.row)"
          >
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn
            v-if="userStore.isEditorOrAbove"
            flat
            round
            color="negative"
            data-test="button-delete-prompt"
            size="sm"
            icon="delete"
            :disable="promptStore.isLoading"
            @click="openDeleteDialog(props.row)"
          >
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
          <ShareComponent dense :label="''" :link="getOrigin(props.row.slug)" @share="share($event, 'prompts', props.row.id)" />
        </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%" style="padding: 0 !important" :data-test="props.row.entries ? 'entriesFetched' : ''">
          <p v-if="!entryStore.isLoading && !props.row.entries?.length" class="q-ma-sm text-body1">NO ENTRIES</p>
          <TableEntry
            v-else
            :rows="getEntriesForPrompt(props.row.id).sort((a, b) => new Date(b.created?.seconds) - new Date(a.created?.seconds))"
            :currentPrompt="props.row"
            :loaded-entries="entryStore._loadedEntries"
            @update-entry="handleUpdateEntry"
            @delete-entry="handleDeleteEntry"
            :maxWidth="maxWidth"
          />
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <TableEntry
    v-else
    :filter="filter"
    :rows="entryStore.getUserRelatedEntries?.sort((a, b) => new Date(b.created?.seconds) - new Date(a.created?.seconds))"
  />
  <div class="row justify-center q-mr-md float-right">
    <q-spinner v-if="promptStore.isLoading && promptStore.getPrompts?.length" color="primary" size="30px" :thickness="5" />
    <q-btn
      v-else
      @click="loadMorePrompts"
      label="Load More"
      color="primary"
      :disable="!promptStore._hasMore || promptStore.isLoading"
      data-test="load-more-btn"
    />
  </div>
  <q-dialog v-model="deleteDialog.show">
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Delete Prompt?</h6>
      </q-card-section>
      <q-card-section>
        <span class="q-ml-sm">
          Are you sure you want to delete the prompt:
          <b>{{ deleteDialog.prompt.title }}</b>
          ?
        </span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" flat label="Cancel" v-close-popup />
        <q-btn color="negative" data-test="confirm-delete-prompt" flat label="Delete" @click="onDeletePrompt(deleteDialog.prompt.id)" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="proceedDepositFundDialog.show">
    <q-card style="width: 400px; max-width: 60vw">
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Escrow fund deposit</h6>
      </q-card-section>
      <FundDepositCard
        :walletAddress="proceedDepositFundDialog.walletAddress"
        :prompt="proceedDepositFundDialog.prompt"
        @hideDialog="proceedDepositFundDialog.show = false"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'
import TableEntry from 'src/components/Admin/TableEntry.vue'
import { useEntryStore, useErrorStore, usePromptStore, useUserStore, useShareStore } from 'src/stores'
import { computed, onBeforeUnmount, onMounted, watchEffect, ref, watch } from 'vue'
import FundDepositCard from './FundDepositCard.vue'

import { customWeb3modal } from 'app/src/web3/walletConnect'

import { useRouter } from 'vue-router'
import ShareComponent from 'src/components/Posts/ShareComponent.vue'
import TheHeader from 'components/shared/TheHeader.vue'
const $q = useQuasar()
const entryStore = useEntryStore()
const errorStore = useErrorStore()
const promptStore = usePromptStore()
const userStore = useUserStore()
const router = useRouter()
const shareStore = useShareStore()
defineEmits(['openPromptDialog'])

const columns = [
  {},
  { name: 'date', align: 'center', label: 'Date', field: (row) => row.date, sortable: true },
  { name: 'author', align: 'center', label: 'Author', field: (row) => row.author?.displayName, sortable: true },
  { name: 'title', align: 'left', label: 'Title', field: 'title', sortable: true },
  {}
]
const deleteDialog = ref({})
const filter = ref('')
const pagination = { sortBy: 'date', descending: true, rowsPerPage: 0 }
const maxWidth = ref(0)

const prompts = ref([])
const proceedDepositFundDialog = ref({})

onMounted(async () => {
  if (userStore.isEditorOrAbove) {
    entryStore._loadedEntries = []
    if (!promptStore.getPrompts?.length || promptStore.getPrompts?.length < 5) await promptStore.fetchPrompts()
  } else {
    await entryStore.fetchUserRelatedEntries(userStore.getUserId)
  }
  window.addEventListener('resize', updateMaxWidth)
  updateMaxWidth()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMaxWidth)
})

const isLoaded = computed(() => promptStore.getPrompts)
const isLoading = computed(() => promptStore.isLoading || (entryStore.isLoading && !isLoaded.value))

watchEffect(async () => {
  prompts.value = promptStore.getPrompts
})

function updateMaxWidth() {
  const documents = document.getElementsByClassName('authorRef')
  const docs = [...documents]
  if (docs?.length) {
    const width = docs.map((el) => el.clientWidth)
    maxWidth.value = Math.max(...width)
  }
}

function openDeleteDialog(prompt) {
  deleteDialog.value.show = true
  deleteDialog.value.prompt = prompt
}

function onDeletePrompt(id) {
  promptStore
    .deletePrompt(id)
    .then(() => $q.notify({ type: 'positive', message: 'Prompt successfully deleted' }))
    .catch((error) => errorStore.throwError(error, 'Prompt deletion failed'))

  deleteDialog.value.show = false
  deleteDialog.value.prompt = {}
}

const loadMorePrompts = async () => {
  if (!promptStore.isLoading && promptStore._hasMore) {
    try {
      await promptStore.fetchPrompts(true, 5)
    } catch (error) {
      await errorStore.throwError(error, 'Error loading more prompts')
    }
  }
}

async function handleUpdateEntry({ _entry, _prompt }) {
  const promptId = _prompt.id
  const entryId = _entry.id

  // Destructure properties from _prompt excluding entries
  const { entries: _entries, ...restOfPrompt } = _prompt
  // Destructure properties from _prompt excluding entries
  const { author, ...restOfEntry } = _entry

  // Update entryStore._loadedEntries
  entryStore._loadedEntries = entryStore._loadedEntries.map((prompt) => {
    if (prompt?.promptId === promptId) {
      return {
        ...prompt,
        ...restOfPrompt,
        entries: prompt.entries.map((entry) => (entry.id === entryId ? { ...entry, ...restOfEntry } : entry))
      }
    }
    return prompt
  })

  // Update prompts.value
  prompts.value = prompts.value.map((prompt) => {
    if (prompt.id === promptId) {
      return {
        ...prompt,
        ...restOfPrompt,
        entries: prompt.entries.map((entry) => (entry.id === entryId ? { ...entry, ...restOfEntry } : entry))
      }
    }
    return prompt
  })

  // Fetch updated prompts
  await promptStore.fetchPrompts()
}

async function share(socialNetwork, collectionName, id) {
  await shareStore.addShare(collectionName, id, socialNetwork).catch((error) => errorStore.throwError(error))
}

function toggleExpand(props) {
  props.expand = !props?.expand
  if (props.expand && !entryStore._loadedEntries.some((el) => el?.promptId === props?.row?.id)) {
    fetchEntriesForPrompt(props.row.entries, props.row.id)
  }
}

async function fetchEntriesForPrompt(entriesIds, promptId) {
  try {
    const res = await entryStore.fetchPromptsEntries(entriesIds)
    entryStore._loadedEntries.push({ promptId, entries: res })
  } catch (error) {
    await errorStore.throwError(error, 'Failed to fetch entries')
  }
}

function getEntriesForPrompt(promptId) {
  const loadedPrompt = entryStore._loadedEntries.find((el) => el?.promptId === promptId)
  return loadedPrompt ? loadedPrompt?.entries : []
}

function handleDeleteEntry(entryId, promptId) {
  entryStore._loadedEntries = entryStore._loadedEntries.map((prompt) => {
    if (prompt?.promptId === promptId) {
      return {
        ...prompt,
        entries: prompt?.entries.filter((entry) => entry.id !== entryId)
      }
    }
    return prompt
  })

  prompts.value = prompts.value.map((prompt) => {
    if (prompt.id === promptId) {
      return {
        ...prompt,
        entries: prompt?.entries.filter((entry) => entry.id !== entryId)
      }
    }
    return prompt
  })

  promptStore.fetchPrompts()
}

//proceed deposit funds.
async function onProceedDepositFundDialog(props) {
  //let's check if the entry already have valid payment..
  if (!customWeb3modal.getAddress()) {
    $q.notify({ type: 'negative', message: 'Please connect your wallet and try again' })
    customWeb3modal.open()
  } else {
    proceedDepositFundDialog.value.show = true
    proceedDepositFundDialog.value.walletAddress = customWeb3modal.getAddress()
    proceedDepositFundDialog.value.prompt = props
  }
}
function getOrigin(slug) {
  return window.origin + slug
}

// if (window.Cypress) {
//   console.log(window)
// }
watch(filter, async (newSearch) => {
  if (!promptStore.isLoading && promptStore._totalPrompts !== promptStore.getPrompts.length && promptStore.hasMore) {
    if (newSearch.trim()) {
      const promptsCount = promptStore._totalPrompts ? promptStore._totalPrompts : promptStore.getTotalPromptsCount
      await promptStore.fetchPrompts(true, promptsCount)
    }
  }
})
</script>
<style scoped>
.custom-table {
  left: 0;
  right: 0;
  max-height: calc(100vh - 300px);
}
</style>
