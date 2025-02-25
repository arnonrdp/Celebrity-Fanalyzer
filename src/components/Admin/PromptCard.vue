<template>
  <q-card class="q-mt-none" :class="{ loading: promptStore.isLoading, 'not-loading': !promptStore.isLoading }">
    <q-form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" @submit.prevent="onSubmit()">
      <q-stepper alternative-labels animated color="primary" header-nav v-model="step">
        <q-step icon="settings" :name="1" :title="id ? 'Edit Prompt' : 'New Prompt'">
          <q-card-section>
            <template v-if="promptStore.isLoading">
              <div class="skeleton-loading">
                <q-skeleton type="text" class="skeleton-title" style="height: 32px; width: 200px" />
                <q-skeleton type="text" class="skeleton-input" style="max-width: 5rem; height: 40px" />
                <q-skeleton type="text" class="skeleton-select" style="height: 40px; width: 100%" />
                <q-skeleton type="text" class="skeleton-input" style="height: 40px; width: 100%" />
                <q-skeleton type="text" class="skeleton-textarea" style="height: 120px; width: 100%" />
                <div class="row">
                  <div class="col-8">
                    <q-skeleton type="text" class="skeleton-file" style="height: 40px; width: 100%" />
                  </div>
                  <div class="col-1 flex justify-center items-center">
                    <q-skeleton type="text" class="skeleton-or" style="height: 40px; width: 40px" />
                  </div>
                  <q-skeleton type="text" class="skeleton-button" style="height: 40px; width: 120px" />
                </div>
                <q-skeleton type="text" class="skeleton-select" style="height: 40px; width: 100%" />
                <q-skeleton type="text" class="skeleton-image-preview" style="height: 200px; width: 100%" />
              </div>
            </template>
            <template v-else>
              <div class="row items-baseline no-wrap">
                <h2 class="q-my-none text-h6">Competition</h2>
                <span>&nbsp; for &nbsp;</span>
                <q-input
                  borderless
                  dense
                  :disable="Boolean(id)"
                  readonly
                  :rules="[(val) => val?.length > 0 || 'Date is required']"
                  style="max-width: 5.5rem"
                  v-model="prompt.date"
                  data-test="date"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer" data-test="date-picker">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale" data-test="month-picker-popup">
                        <MonthPicker
                          v-model="prompt.date"
                          mask="YYYY-MM"
                          navigation-min-year-month="2023-11"
                          :options="unavailablePromptsMonth"
                          data-test="month-picker"
                        >
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat data-test="close-btn" />
                          </div>
                        </MonthPicker>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <q-select data-test="select-author" disable label="Author" :options="authorOptions" v-model="prompt.author" />
              <q-input
                counter
                data-test="input-title"
                label="Title"
                maxlength="80"
                required
                v-model="prompt.title"
                :hint="!prompt.title ? '*Title is required' : ''"
              />
              <q-field
                counter
                label="Description"
                maxlength="400"
                v-model="prompt.description"
                :hint="!prompt.description ? '*Description is required' : ''"
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
                    v-model="prompt.description"
                    @paste="onPaste($event)"
                  />
                </template>
              </q-field>
              <div class="row">
                <div class="col-8">
                  <q-file
                    accept=".jpg, image/*"
                    counter
                    data-test="file-image"
                    :hint="!prompt.image ? '*Image is required. Max size is 2MB.' : ''"
                    label="Choose File"
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
                <div class="col-1 flex justify-center items-center"><p>or</p></div>
                <q-btn
                  color="primary"
                  icon="add_a_photo"
                  class="self-center"
                  label="Capture Image"
                  data-test="button-camera-capture"
                  @click="openCamera = true"
                ></q-btn>
              </div>
              <q-select
                behavior="menu"
                counter
                data-test="select-categories"
                hide-dropdown-icon
                :hint="!prompt.categories ? 'Category is required. Click Enter ↵ to add a new category' : ''"
                input-debounce="0"
                label="Categories"
                multiple
                new-value-mode="add-unique"
                use-input
                use-chips
                :rules="[(val) => val?.length > 0 || 'Please select at least one category']"
                v-model="prompt.categories"
              />
              <div class="text-center">
                <q-img v-if="prompt.image" class="q-mt-md" :src="prompt.image" fit="contain" style="max-height: 40vh; max-width: 80vw" />
              </div>
            </template>
          </q-card-section>
        </q-step>
        <q-step caption="Optional" :done="step > 2" icon="create_new_folder" :name="2" title="Artist Carousel">
          <ShowcaseCard
            collectionName="prompt"
            :date="prompt.date"
            v-model:arts="prompt.showcase.arts"
            v-model:artist="prompt.showcase.artist"
          />
        </q-step>
        <template v-slot:navigation>
          <q-stepper-navigation class="flex justify-end q-gutter-md">
            <template v-if="promptStore.isLoading">
              <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 100px" />
              <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 120px" />
            </template>
            <template v-else>
              <q-btn flat rounded label="Cancel" v-close-popup :disable="promptStore.isLoading" data-test="button-cancel" />
              <q-btn
                color="primary"
                data-test="button-submit"
                :disable="
                  !prompt.date ||
                  !prompt.title ||
                  !prompt.description ||
                  !prompt.categories?.length ||
                  !prompt.image ||
                  promptStore.isLoading
                "
                :label="id ? 'Save Edits' : 'Submit Prompt'"
                :loading="promptStore.isLoading || storageStore.isLoading"
                rounded
                type="submit"
              />
            </template>
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </q-form>
    <q-dialog v-model="openCamera" persistent>
      <CaptureCamera @onCapture="captureCamera" />
    </q-dialog>
  </q-card>
</template>

<script setup>
import { useQuasar, date as qDate } from 'quasar'
import ShowcaseCard from 'src/components/Admin/ShowcaseCard.vue'
import { useErrorStore, usePromptStore, useStorageStore, useUserStore } from 'src/stores'
import { currentYearMonth } from 'src/utils/date'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { uploadAndSetImage } from 'src/utils/imageConvertor'
import CaptureCamera from '../shared/CameraCapture.vue'
import MonthPicker from '../date/MonthPicker.vue'

const emit = defineEmits(['hideDialog'])
const props = defineProps(['author', 'categories', 'created', 'date', 'description', 'id', 'image', 'showcase', 'slug', 'title'])

const $q = useQuasar()
const errorStore = useErrorStore()
const promptStore = usePromptStore()
const storageStore = useStorageStore()
const userStore = useUserStore()

const authorOptions = reactive([])
const prompt = reactive({
  description: '',
  image: '',
  showcase: { arts: [], artist: { info: '', photo: '' } },
  title: ''
})
const step = ref(1)
const imageModel = ref(null)
const imagePreview = ref(null)
const editorRef = ref(null)
const openCamera = ref(false)
const unavailablePromptsMonth = ref([])

watchEffect(() => {
  if (props.id) {
    prompt.author = { label: props.author.displayName, value: props.author.uid }
    prompt.categories = props.categories
    prompt.date = props.date
    prompt.description = props.description
    prompt.id = props.id
    prompt.image = props.image
    prompt.showcase = props.showcase
    prompt.title = props.title
    if (props.image) {
      imagePreview.value = props.image
    }
  } else {
    prompt.author = userStore.isAuthenticated ? { label: userStore.getUser.displayName, value: userStore.getUser.uid } : null
    prompt.categories = null
  }
})

onMounted(async () => {
  userStore.getAdminsAndEditors.forEach((user) => authorOptions.push({ label: user.displayName, value: user.uid }))

  if (!props.id) {
    const promptDates = await promptStore.getPromptDates()
    unavailablePromptsMonth.value = promptDates
    const currentMonth = currentYearMonth()

    if (unavailablePromptsMonth.value.includes(currentMonth)) {
      const dateObj = new Date()
      while (true) {
        dateObj.setMonth(dateObj.getMonth() + 1)
        const monthToCheck = qDate.formatDate(dateObj, 'YYYY-MM')

        if (!unavailablePromptsMonth.value.includes(monthToCheck)) {
          prompt.date = monthToCheck
          break
        }
      }
    } else {
      prompt.date = currentMonth
    }
  }
})

function uploadPhoto() {
  prompt.image = ''
  if (!imageModel.value) {
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(imageModel.value)
  reader.onload = () => (prompt.image = reader.result)
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
  prompt.slug = '/' + prompt.title.toLowerCase().replace(/[^0-9a-z]+/g, '-')

  if (!props.id && promptStore.getPrompts?.find((p) => p.date === prompt.date)) {
    $q.notify({ type: 'negative', message: 'Choose another month for this prompt.' })
    return
  }
  if (!promptStore.getPrompts) {
    const hasPrompt = await promptStore.hasPrompt(prompt.date, prompt.title, prompt.slug, !!props.id)
    if (hasPrompt) {
      return
    }
  } else if (
    promptStore.getPrompts?.find((p) => p.title.toLowerCase() === prompt.title.toLowerCase() && p.id !== prompt.id) ||
    prompt.title.toLowerCase() === 'month'
  ) {
    $q.notify({ type: 'negative', message: 'Prompt with this title already exists. Please choose another title.' })
    return
  }

  if (imageModel.value) {
    prompt.image = await uploadAndSetImage(imageModel.value, `images/prompt-${prompt.date}`)
  }

  try {
    if (props.id) {
      await promptStore.editPrompt(prompt)
      $q.notify({ type: 'info', message: 'Prompt successfully edited' })
    } else {
      await promptStore.addPrompt(prompt)
      $q.notify({ type: 'positive', message: 'Prompt successfully submitted. Please make sure to fund it.' })
    }

    emit('hideDialog', prompt.slug)
  } catch (error) {
    errorStore.throwError(error, props.id ? 'Prompt edit failed' : 'Prompt submission failed')
  }
}

function onRejected() {
  $q.notify({ type: 'negative', message: 'File size is too big. Max file size is 2MB.' })
}

function captureCamera(imageBlob) {
  imageModel.value = imageBlob
  uploadPhoto()
}
</script>
