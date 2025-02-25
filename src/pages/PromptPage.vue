<template>
  <q-tabs active-color="primary" class="bg-white fixed-bottom tab-selector" dense indicator-color="transparent" v-model="tab">
    <q-tab content-class="q-ml-auto q-py-sm" data-test="prompt-tab" icon="fiber_manual_record" name="post" :ripple="false" />
    <q-tab content-class="q-py-sm" data-test="graph-tab" icon="fiber_manual_record" name="anthrogram" :ripple="false" />
    <q-tab content-class="q-mr-auto q-py-sm" data-test="comments-tab" icon="fiber_manual_record" name="comments" :ripple="false" />
  </q-tabs>
  <q-tab-panels v-if="prompt" animated class="bg-transparent col-grow" swipeable v-model="tab">
    <!-- Panel 1: Prompt -->
    <q-tab-panel name="post" style="padding: 0">
      <ThePost
        collectionName="prompts"
        :post="prompt"
        title="Prompt Page"
        :showEdit="userStore.getUserId === prompt.author?.uid && !prompt?.hasWinner"
        @clickComments="tab = 'comments'"
        @openPromptDialog="openPromptDialog"
      />
      <TheEntries :entries="entries" ref="entriesRef" :promptDate="prompt?.date" :has-winner="prompt?.hasWinner" />
    </q-tab-panel>
    <!-- Panel 2: Anthrogram -->
    <q-tab-panel name="anthrogram" class="bg-white">
      <TheAnthrogram collectionName="prompts" :post="prompt" />
    </q-tab-panel>
    <!-- Panel 3: Comments -->
    <q-tab-panel name="comments" class="bg-white" v-if="prompt">
      <TheComments collectionName="prompts" :post="prompt" />
    </q-tab-panel>
  </q-tab-panels>

  <q-spinner v-else class="absolute-center" color="primary" size="3em" />
  <q-dialog full-width position="bottom" v-model="editPrompt.dialog">
    <PromptCard v-bind="editPrompt" @hideDialog="closePromptDialog" />
  </q-dialog>
</template>

<script setup>
import TheAnthrogram from 'src/components/Posts/TheAnthrogram.vue'
import TheComments from 'src/components/Posts/TheComments.vue'
import ThePost from 'src/components/Posts/ThePost.vue'
import TheEntries from 'src/components/shared/TheEntries.vue'
import PromptCard from '../components/Admin/PromptCard.vue'
import { startTracking, stopTracking } from 'src/utils/activityTracker'
import { useEntryStore, useErrorStore, useLikeStore, usePromptStore, useShareStore, useStatStore, useUserStore } from 'src/stores'
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { onBeforeRouteLeave, useRouter, useRoute } from 'vue-router'

const router = useRouter()
const entryStore = useEntryStore()
const errorStore = useErrorStore()
const likeStore = useLikeStore()
const promptStore = usePromptStore()
const shareStore = useShareStore()
const statStore = useStatStore()
const userStore = useUserStore()
const route = useRoute()
let promptId
let authorId
let stats

const entriesRef = ref(null)
const tab = ref(promptStore.tab)
const shareIsLoading = ref(false)
const shareIsLoaded = ref(false)
const editPrompt = ref({})

const params = computed(() => router.currentRoute.value?.params)
const prompt = computed(() => {
  if (route.name === 'month') {
    return promptStore.getMonthPrompt?.[0]
  }

  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  return promptStore.getPrompts
    ?.sort((a, b) => a.id - b.id)
    ?.find((prompt) => {
      switch (route.name) {
        case 'year-month':
          return prompt.date === params.value.year + '-' + params.value.month
        case 'slug':
          return prompt.slug?.includes(params.value.slug)
        default:
          return false
      }
    })
})

const entries = computed(() => {
  return entryStore.getEntries?.filter((entry) => entry.prompt?.id === prompt.value?.id)
})

const onScroll = () => {
  if (entriesRef.value) {
    const marginTop = entriesRef.value?.getBoundingClientRect().top
    const windowsHeight = window.innerHeight
    if ((!entries.value?.length || entries.value === undefined) && marginTop - windowsHeight < -50) {
      entryStore.fetchPromptsEntries(prompt.value.entries).catch((error) => errorStore.throwError(error))
    }
  }
}

watchEffect(() => {
  if (prompt.value?.id) {
    promptId = prompt.value?.id
    authorId = prompt.value?.author?.uid
  }
})

watchEffect(async () => {
  // if (prompt?.value?.author?.uid) {
  //   await statStore.getUserRating(prompt?.value?.author?.uid)
  // }

  if (prompt.value?.id) {
    await likeStore.getAllLikesDislikes('prompts', promptId).catch((error) => errorStore.throwError(error))

    shareIsLoading.value = true
    await shareStore
      .fetchSharesCount('prompts', promptId)
      .catch((error) => errorStore.throwError(error))
      .finally(() => {
        shareIsLoading.value = false
        shareIsLoaded.value = true
      })
  }
})

onMounted(async () => {
  if (route.name === 'month') {
    await promptStore.fetchMonthsPrompt()
  }

  entriesRef.value = document.querySelector('.entries-page-container')
  window.addEventListener('scroll', onScroll)
  await entryStore.resetEntries
  startTracking()
})

watch(entriesRef, (newVal) => {
  if (entriesRef.value) {
    if (newVal) {
      entriesRef.value = document.querySelector('.entries-page-container')
    } else {
      console.error('EntriesRef error')
    }
  }
})
function closePromptDialog(slug) {
  editPrompt.value = {}
  if (route.name === 'slug') {
    router.push(slug)
  }
}
function openPromptDialog() {
  editPrompt.value = prompt.value
  editPrompt.value.dialog = true
}
onBeforeRouteLeave(async () => {
  stats = stopTracking()
})

onUnmounted(async () => {
  try {
    await statStore.addStats(promptId, authorId, stats, 'topic')
  } catch (e) {
    console.error('Error adding stats:', e)
  } finally {
    statStore.resetStats()
    // statStore.resetUserRating()
    statStore.resetPostImpressions()
  }

  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped lang="scss">
.tab-selector {
  margin-bottom: 4rem;
  z-index: 4;
}
</style>
