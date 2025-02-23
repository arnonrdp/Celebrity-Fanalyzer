<template>
  <q-card>
    <q-card-section class="row items-baseline no-wrap">
      <h2 class="q-my-none text-h6">{{ id ? 'Edit Entry' : 'New Entry' }}</h2>
      <q-space />
      <q-btn flat round icon="close" @click="handleDeleteImagesOnCancel" v-close-popup data-test="close-button" />
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-form @submit.prevent="onSubmit()">
        <q-stepper alternative-labels animated color="primary" header-nav v-model="step">
          <q-step icon="settings" :name="1" :title="id ? 'Edit Entry' : 'New Entry'">
            <q-select data-test="select-author" disable label="Author" v-model="entry.author" />
            <q-select
              behavior="menu"
              counter
              data-test="select-prompt"
              :disable="Boolean(entry.id)"
              :hint="entry.image ? 'Image is attached to this prompt' : ''"
              label="Prompt"
              :options="promptOptions"
              use-chips
              :rules="[(val) => val || 'Please select the related prompt']"
              v-model="entry.prompt"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">No results</q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-input
              counter
              data-test="input-title"
              label="Title"
              maxlength="80"
              required
              v-model="entry.title"
              :disable="!entry.prompt"
              :hint="!entry.prompt ? 'Select prompt first' : !entry.title ? '*Title is required' : ''"
            />
            <q-field
              counter
              label="Description"
              maxlength="400"
              v-model="entry.description"
              :hint="!entry.description ? '*Description is required' : ''"
            >
              <template v-slot:control>
                <q-editor
                  class="q-mt-md"
                  data-test="input-description"
                  dense
                  flat
                  min-height="5rem"
                  ref="editorRef"
                  style="width: 100%"
                  :toolbar="[
                    [
                      {
                        icon: $q.iconSet.editor.align,
                        options: ['left', 'center', 'right', 'justify']
                      },
                      {
                        icon: $q.iconSet.editor.fontSize,
                        list: 'no-icons',
                        options: ['size-1', 'size-2', 'size-3', 'size-4', 'size-5', 'size-6', 'size-7']
                      },
                      {
                        icon: $q.iconSet.editor.formatting,
                        options: ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript', 'quote', 'unordered', 'ordered']
                      },
                      ['link']
                    ],
                    ['undo', 'redo']
                  ]"
                  v-model="entry.description"
                  @paste="onPaste($event)"
                />
              </template>
            </q-field>

            <div class="flex justify-between items-center">
              <div class="">
                <q-file
                  accept=".jpg, image/*"
                  counter
                  data-test="file-image"
                  :disable="!entry.prompt"
                  :hint="!entry.prompt ? 'Select prompt first' : !entry.image ? '*Image is required. Max size is 2MB.' : ''"
                  label="Image"
                  :max-total-size="2097152"
                  :required="!id"
                  use-chips
                  v-model="imageModel"
                  @rejected="onRejected()"
                  @update:model-value="uploadPhoto()"
                >
                  <template v-slot:append>
                    <q-icon name="image" />
                  </template>
                </q-file>
              </div>
              <q-btn
                style="max-height: 20px"
                :disable="!entry.prompt"
                color="primary"
                icon="add_a_photo"
                label="Capture Image"
                @click="openCamera = true"
              ></q-btn>
            </div>
            <div class="text-center">
              <q-img v-if="entry.image" class="q-mt-md" :src="entry.image" fit="contain" style="max-height: 40vh; max-width: 80vw" />
            </div>
          </q-step>
          <q-step caption="Optional" :done="step > 2" icon="create_new_folder" :name="2" title="Artist Carousel">
            <ShowcaseCard
              collectionName="entry"
              :date="todayDate"
              v-model:arts="entry.showcase.arts"
              v-model:artist="entry.showcase.artist"
              @updateRecentUploads="updateRecentUploadsRef"
              @updateRecentArtistImage="updateRecentArtistImageRef"
            />
          </q-step>

          <template v-slot:navigation>
            <q-stepper-navigation class="flex justify-end q-gutter-md">
              <template v-if="promptStore.isLoading">
                <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 100px" />
                <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 120px" />
              </template>
              <template v-else>
                <q-btn
                  flat
                  rounded
                  label="Cancel"
                  @click="handleDeleteImagesOnCancel"
                  v-close-popup
                  :disable="promptStore.isLoading"
                  data-test="cancel-button"
                />
                <q-btn
                  color="primary"
                  data-test="button-submit"
                  :disable="!entry.title || !entry.description || !entry.image || entryStore.isLoading"
                  :label="id ? 'Save Edits' : 'Submit Entry'"
                  :loading="entryStore.isLoading || entryStore.isLoading"
                  rounded
                  type="submit"
                />
                <q-tooltip
                  v-if="!entry.title || !entry.description || !entry.prompt || !entry.image"
                  class="text-center"
                  style="white-space: pre-line"
                >
                  {{
                    !entry.title || !entry.description
                      ? 'Please make sure you have a title and description'
                      : !entry.prompt
                        ? 'Please select a prompt'
                        : !entry.image
                          ? 'Please select an image'
                          : 'Please make sure all fields are filled'
                  }}
                </q-tooltip>
              </template>
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-form>
    </q-card-section>
  </q-card>
  <q-dialog v-model="openCamera" persistent>
    <CaptureCamera @onCapture="captureCamera" />
  </q-dialog>
  <q-dialog></q-dialog>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useEntryStore, useErrorStore, usePromptStore, useStorageStore, useUserStore } from 'src/stores'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { uploadAndSetImage } from 'src/utils/imageConvertor'
import { useRouter } from 'vue-router'
import CaptureCamera from '../shared/CameraCapture.vue'
import ShowcaseCard from 'components/Admin/ShowcaseCard.vue'

const emit = defineEmits(['hideDialog'])
const props = defineProps(['author', 'created', 'description', 'id', 'image', 'prompt', 'slug', 'title', 'selectedPromptDate', 'showcase'])

const $q = useQuasar()
const entryStore = useEntryStore()
const errorStore = useErrorStore()
const promptStore = usePromptStore()
const storageStore = useStorageStore()
const userStore = useUserStore()
const router = useRouter()
const { href } = router.currentRoute.value
const step = ref(1)
const editorRef = ref(null)
const entry = reactive({
  author: { label: userStore.getUser.displayName, value: userStore.getUser.uid },
  description: '',
  image: '',
  showcase: { arts: [], artist: { info: '', photo: '' } },
  title: ''
})

const imageModel = ref([])
const openCamera = ref(false)
const todayDate = new Date().toISOString().replace(/[.:-]/g, '')
const uploadedImages = ref([])
const recentUploadsRef = ref([])
const recentArtistImage = ref('')

watch(
  () => entry.showcase.arts,
  (newArts) => {
    uploadedImages.value = newArts.map((art) => art.image)
  },
  { deep: true }
)

const promptOptions = computed(
  () =>
    promptStore._activePrompts
      ?.map((prompt) => ({ label: `${prompt.date} – ${prompt.title}`, value: prompt.date, escrowId: prompt.escrowId }))
      .reverse() || []
)

onMounted(() => {
  promptStore.fetchActivePrompts()
  if (props.id) {
    entry.author = { label: props.author?.displayName, value: props.author?.uid }
    entry.description = props.description
    entry.image = props.image
    entry.prompt = { label: `${props.prompt.date} – ${props.prompt.title}`, value: props.prompt.date }
    entry.title = props.title
    entry.showcase = props.showcase
  } else if (props.selectedPromptDate) {
    entry.prompt = promptOptions.value.find((prompt) => prompt.value === props.selectedPromptDate)
  }
})

function uploadPhoto() {
  entry.image = ''
  if (!imageModel.value) {
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(imageModel.value)
  reader.onload = () => (entry.image = reader.result)
}

function onRejected() {
  $q.notify({ type: 'negative', message: `Image did not pass validation constraints` })
}

function onPaste(evt) {
  // Let inputs do their thing, so we don't break pasting of links.
  if (evt.target.nodeName === 'INPUT') return
  let text, onPasteStripFormattingIEPaste
  evt.preventDefault()
  evt.stopPropagation()
  if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
    text = evt.originalEvent.clipboardData.getData('text/plain')
    editorRef.value.runCmd('insertText', text)
  } else if (evt.clipboardData && evt.clipboardData.getData) {
    text = evt.clipboardData.getData('text/plain')
    editorRef.value.runCmd('insertText', text)
  } else if (window.clipboardData && window.clipboardData.getData) {
    if (!onPasteStripFormattingIEPaste) {
      onPasteStripFormattingIEPaste = true
      editorRef.value.runCmd('ms-pasteTextOnly', text)
    }
    onPasteStripFormattingIEPaste = false
  }
}

async function onSubmit() {
  entry.title = entry.title.trim()
  const hasLoadedEntry = entryStore.checkPromptRelatedEntry(entry.prompt?.value)

  if (!hasLoadedEntry) {
    await entryStore.fetchEntryByPrompts(entry.prompt?.value)
  }

  const hasEntry = entryStore.hasEntry(entry.prompt?.value)

  if (!props.id && hasEntry) {
    $q.notify({
      type: 'info',
      message: 'You have already submitted an entry for this prompt. Please select another prompt'
    })
    return
  }

  const entryNameValidator = entryStore.entryNameValidator(props.id, entry.prompt?.value, entry.title, !!props.id)

  if (entryNameValidator) {
    $q.notify({ message: 'Entry with this title already exists. Please choose another title.', type: 'negative' })
    return
  }
  entry.slug = `/${entry.prompt.value.replace(/\-/g, '/')}/${entry.title.toLowerCase().replace(/[^0-9a-z]+/g, '-')}`
  entry.id = props.id || `${entry.prompt?.value}T${Date.now()}`

  if (Object.keys(imageModel.value ?? {}).length || imageModel.value?.type) {
    entry.image = await uploadAndSetImage(imageModel.value, `images/entry-${entry.id}`)
  } else {
    entry.image = props.image
  }

  const action = props.id ? entryStore.editEntry : entryStore.addEntry
  const successMessage = props.id ? 'Entry successfully edited' : 'Entry successfully submitted'
  const failureMessage = props.id ? 'Entry edit failed' : 'Entry submission failed'

  try {
    await action(entry)
    if (props.id) {
      await entryStore.fetchUserRelatedEntries(userStore.getUserId)
    }
    if (href.includes('/admin') && !userStore.isEditorOrAbove) {
      await entryStore.fetchUserRelatedEntries(userStore.getUserId)
    } else {
      const updatedPrompt = await promptStore.fetchPromptById(entry.prompt.value)
      const updatedList = updatedPrompt.find((prompt) => prompt.id === entry.prompt.value).entries
      const res = await entryStore.fetchPromptsEntries(updatedList)
      const loadedPrompt = entryStore._loadedEntries.find((el) => el.promptId === entry.prompt.value)

      if (loadedPrompt) {
        const emptyList = !loadedPrompt.entries.length
        loadedPrompt.entries = res
        emptyList && (await promptStore.fetchPrompts())
      }
    }
    $q.notify({ type: 'positive', message: successMessage })
  } catch (e) {
    await errorStore.throwError(e, failureMessage)
  }
  emit('hideDialog', entry.slug)
}

function captureCamera(imageBlob) {
  imageModel.value = imageBlob
  uploadPhoto()
}

function handleDeleteImagesOnCancel() {
  if (!!recentArtistImage.value.length) {
    storageStore.deleteFile(recentArtistImage.value)
    entry.showcase.artist.photo = null
  }

  storageStore.deleteMultipleFiles(entry.showcase.arts.length ? recentUploadsRef.value : entry.showcase.arts)
  entry.showcase.arts = entry.showcase.arts.filter((item) => {
    return !recentUploadsRef.value.includes(item)
  })
}

function updateRecentUploadsRef(updatedArts) {
  recentUploadsRef.value.push(updatedArts)
}
function updateRecentArtistImageRef(artistImage) {
  recentArtistImage.value = artistImage
}
</script>
