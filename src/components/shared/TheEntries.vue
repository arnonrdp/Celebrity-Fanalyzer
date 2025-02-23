<template>
  <section
    class="bg-white q-mb-xl q-pa-md q-page-container entries-page-container"
    :data-test="props.entries ? 'entries' : ''"
    style="padding-bottom: 7rem"
  >
    <div class="flex items-center">
      <h2 class="q-my-auto text-bold text-h5 q-pa-md">Entries</h2>
      <q-btn v-if="showAddEntry" color="primary" dense icon="add" outline round data-test="create-entry" @click="openEntryDialog">
        <q-tooltip>Create entry</q-tooltip>
      </q-btn>
    </div>
    <div class="card-items-wrapper">
      <ItemCard v-for="entry in entries" :item="entry" :key="entry?.id" :link="entry.slug" data-test="entry" />
    </div>
    <q-spinner v-if="entryStore.isLoading" color="primary" size="3em" class="block q-mx-auto q-my-xl" />
    <h6 v-else-if="!entries?.length" class="text-center">NO ENTRIES</h6>
  </section>
  <q-dialog full-width position="bottom" v-model="entry.dialog" no-backdrop-dismiss no-refocus no-esc-dismiss data-test="entry-dialog">
    <EntryCard v-bind="entry" @hideDialog="entry = {}" :selectedPromptDate="promptDate" />
  </q-dialog>
</template>

<script setup>
import ItemCard from 'src/components/shared/ItemCard.vue'
import EntryCard from 'src/components/Admin/EntryCard.vue'
import { useEntryStore, useUserStore } from 'src/stores'
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const props = defineProps(['entries', 'promptDate', 'hasWinner'])

const entryStore = useEntryStore()
const userStore = useUserStore()
const router = useRouter()
const entry = ref({})
const $q = useQuasar()

const showAddEntry = computed(() => {
  const entry = props.entries?.find((e) => e.author.uid === userStore.getUserId)
  return !entry && !props.hasWinner
})

async function openEntryDialog() {
  if (userStore.isAuthenticated) {
    entry.value = {}
    entry.value.dialog = true
  } else {
    await router.push('/profile')
    $q.notify({
      type: 'info',
      message: 'Please log in to create a new entry'
    })
  }
}
</script>

<style lang="scss" scoped>
.entries-page-container {
  max-width: 100%;
}

.card-items-wrapper {
  display: grid;
  margin: 0;
  justify-items: center;
  row-gap: 16px;
  column-gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(619px, 1fr));

  @media (max-width: 1440px) {
    grid-template-columns: repeat(auto-fill, minmax(590px, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(470px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(361px, 1fr));
  }

  @media (max-width: 425px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>
