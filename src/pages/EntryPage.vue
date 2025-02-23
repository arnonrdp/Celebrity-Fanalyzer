<template>
  <q-tabs
    active-color="primary"
    class="bg-white fixed-bottom tab-selector q-pb-xs"
    dense
    indicator-color="transparent"
    v-model="tab"
    data-test="tabs-selector"
  >
    <q-tab content-class="q-ml-auto q-pb-md" icon="fiber_manual_record" name="post" :ripple="false" data-test="tab-post" />
    <q-tab content-class="q-pb-md" icon="fiber_manual_record" name="stats" :ripple="false" data-test="tab-stats" />
    <q-tab content-class="q-mr-auto q-pb-md" icon="fiber_manual_record" name="comments" :ripple="false" data-test="tab-comments" />
  </q-tabs>

  <q-spinner v-if="entryStore.isLoading" class="absolute-center" color="primary" size="3em" />

  <q-tab-panels v-else-if="entry" animated class="bg-transparent col-grow" swipeable v-model="tab" data-test="tab-panels">
    <!-- Panel 1: Entry -->
    <q-tab-panel name="post" style="padding: 0" data-test="entry-page">
      <ThePost
        collectionName="entries"
        :post="entry"
        title="Entry Page"
        style="padding-bottom: 7rem"
        :isEntry="true"
        :showEdit="!prompt?.hasWinner && userStore.getUserId === entry.author.uid"
        @clickComments="tab = 'comments'"
        @openEntryDialog="openEntryDialog"
      />
    </q-tab-panel>
    <!-- Panel 2: Anthrogram -->
    <q-tab-panel name="stats" class="bg-white" data-test="tab-panel-stats">
      <TheAnthrogram :post="entry" collectionName="entries" />
    </q-tab-panel>
    <!-- Panel 3: Comments -->
    <q-tab-panel name="comments" class="bg-white" data-test="tab-panel-comments">
      <TheComments v-if="entry" collectionName="entries" :post="entry" />
    </q-tab-panel>
  </q-tab-panels>
  <q-dialog
    full-width
    position="bottom"
    v-model="editEntry.dialog"
    no-backdrop-dismiss
    no-refocus
    no-esc-dismiss
    data-test="edit-entry-dialog"
  >
    <EntryCard v-bind="editEntry" @hideDialog="closeEntryDialog" />
  </q-dialog>
</template>

<script setup>
import TheAnthrogram from 'src/components/Posts/TheAnthrogram.vue'
import TheComments from 'src/components/Posts/TheComments.vue'
import ThePost from 'src/components/Posts/ThePost.vue'
import EntryCard from '../components/Admin/EntryCard.vue'
import {
  useCommentStore,
  useEntryStore,
  useErrorStore,
  useLikeStore,
  useShareStore,
  useStatStore,
  usePromptStore,
  useUserStore
} from 'src/stores'
import { startTracking, stopTracking } from 'src/utils/activityTracker'
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const entryStore = useEntryStore()
const errorStore = useErrorStore()
const likeStore = useLikeStore()
const shareStore = useShareStore()
const statStore = useStatStore()
const commentStore = useCommentStore()
const promptStore = usePromptStore()
const userStore = useUserStore()
const tab = ref(entryStore.tab)
const editEntry = ref({})
const prompt = ref({})

let entryId
let entryAuthor
const entry = computed(() => {
  return entryStore.getEntries?.find(
    (entry) =>
      router.currentRoute.value.href === entry.slug ||
      router.currentRoute.value.href.slice(1, -3).replace('/', '-').replace('/', '') === entry.id
  )
})
watchEffect(async () => {
  if (entry.value?.author?.uid) {
    await statStore.getUserRating(entry.value?.author?.uid)
  }
  if (entry.value?.prompt?.id) {
    prompt.value = (await promptStore.fetchPromptById(entry.value.prompt.id))[0]
  }
  if (entry.value?.id) {
    entryId = entry.value.id
    entryAuthor = entry.value?.author?.uid
    await likeStore.getAllLikesDislikes('entries', entryId).catch((error) => errorStore.throwError(error))
    await shareStore.fetchSharesCount('entries', entryId).catch((error) => errorStore.throwError(error))
    await commentStore.getTotalComments('entries', entryId)
  }
})

onMounted(async () => {
  startTracking()
})

onUnmounted(async () => {
  const stats = stopTracking()
  try {
    await statStore.addStats(entryId, entryAuthor, stats, 'article')
  } catch (e) {
    console.error('Error adding stats:', e)
  } finally {
    await commentStore.resetComments()
    statStore.resetStats()
    entryStore.setTab('post')
  }
})

async function openEntryDialog() {
  editEntry.value = entry.value
  editEntry.value.prompt = prompt
  editEntry.value.dialog = true
}

function closeEntryDialog(slug) {
  editEntry.value = {}
  router.push(slug)
}
</script>

<style scoped lang="scss">
.tab-selector {
  margin-bottom: 3.5rem;
  z-index: 4;
}
</style>
