<template>
  <q-card class="q-mt-none full-width" :class="{ loading: advertiseStore.isLoading, 'not-loading': !advertiseStore.isLoading }">
    <q-form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" @submit.prevent="onSubmit()">
      <q-stepper alternative-labels animated color="primary" header-nav v-model="step">
        <q-step icon="settings" :name="1" :title="id ? 'Edit Advertise' : 'New Advertise'">
          <q-card-section>
            <q-input
              counter
              data-test="input-title"
              label="Title"
              maxlength="80"
              required
              v-model="advertise.title"
              :hint="!advertise.title ? '*Title is required' : ''"
            />
            <div class="q-py-md">
              <div class="flex items-center justify-between">
                <div>Select Add type :</div>
                <q-radio v-model="advertise.type" val="Banner" label="Banner" />
                <q-radio v-model="advertise.type" val="Text" label="Text" data-test="select-type-text" />
              </div>
            </div>
            <q-file
              v-if="advertise.type === 'Banner'"
              v-model="contentModel"
              counter
              class="q-mb-lg"
              data-test="file-image"
              :hint="!advertise.image ? '*Image is required. Max size is 2MB.' : fileErrorMessage"
              :label="advertise.type === 'Banner' ? 'Image' : 'Video'"
              :max-total-size="5242880"
              :required="!id"
              use-chips
              :accept="advertise.type === 'Banner' ? '.jpg, image/*' : '.mp4, .mkv'"
              @rejected="onRejected()"
              @update:model-value="uploadPhoto()"
            >
              <template v-slot:append>
                <q-icon :name="advertise.type === 'Banner' ? 'image' : 'videocam'" />
              </template>
            </q-file>
            <div v-if="advertise.type === 'Banner'" class="text-center">
              <q-img
                v-if="advertise.contentURL"
                class="q-mt-md"
                fit="contain"
                style="max-height: 40vh; max-width: 80vw"
                :src="advertise.contentURL"
              />
            </div>
            <q-field
              counter
              label="Description"
              maxlength="400"
              v-model="advertise.content"
              :hint="!advertise.content ? '*Description is required' : ''"
            >
              <template v-slot:control>
                <q-editor
                  class="q-mt-md"
                  data-test="input-description"
                  dense
                  flat
                  min-height="5rem"
                  ref="editorRef"
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
                  v-model="advertise.content"
                  @paste="onPaste($event)"
                />
              </template>
            </q-field>
            <q-input
              v-model="advertise.productLink"
              data-test="input-product-link"
              counter
              hide-hint
              class="q-mb-lg"
              label="Product URL"
              maxlength="80"
              :rules="[(url) => (url ? isUrlValid(url) : true) || 'Please enter a valid url']"
            />
            <q-input
              v-model="advertise.publishDate"
              filled
              readonly
              mask="date"
              label="Publish date"
              :rules="['date']"
              @click="openDatePicker"
              :hint="!advertise.publishDate ? '*Publish Date is required' : ''"
              data-test="date"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-model="datePickerVisible" cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="advertise.publishDate" :options="(date) => date >= getCurrentDate()">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              data-test="input-duration"
              v-model.number="advertise.duration"
              label="Duration(day's)"
              :hint="!advertise.duration ? '*Duration is required' : ''"
              class="q-mb-lg"
              type="number"
              :min="1"
              :rules="[(duration) => duration > 0 || 'Enter a positive number']"
            />
            <q-input
              v-if="!isEditing"
              v-model="usdAmount"
              data-test="input-budget"
              label="Price in USD"
              :hint="!usdAmount ? '*Minimum Price is required' : ''"
              mask="#.##"
              fill-mask="0"
              reverse-fill-mask
              :rules="[() => (usdAmount < 0.01 ? 'Minimum allowed budget is 3 USD' : true)]"
              @update:model-value="convertToMatic()"
            />
            <q-input
              v-if="!isEditing"
              v-model="advertise.budget"
              readonly
              label="Budget In POL"
              class="q-mb-lg"
              :rules="[(budget) => (budget ? budget >= 0 : true || 'Enter a positive number')]"
            />
          </q-card-section>
        </q-step>
        <template v-slot:navigation>
          <q-stepper-navigation class="flex justify-end q-gutter-md">
            <q-btn flat rounded label="Cancel" v-close-popup />
            <q-btn
              rounded
              type="submit"
              color="primary"
              data-test="button-submit"
              :disable="
                !advertise.title ||
                !advertise.content ||
                !advertise.duration ||
                !advertise.publishDate ||
                (advertise.type === 'Banner' && (fileError || (contentModel.length <= 0 && advertise.contentURL.length <= 0)))
              "
              :label="id ? 'Save Edits' : 'Submit '"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </q-form>
  </q-card>
</template>

<script setup>
import { db } from 'src/firebase'
import { collection, doc } from 'firebase/firestore'
import { useQuasar } from 'quasar'
import { useAdvertiseStore, useErrorStore, useStorageStore, useUserStore } from 'src/stores'
import { calculateEndDate, currentYearMonth, getCurrentDate } from 'src/utils/date'
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { contractCreateAdCampaign } from 'app/src/web3/adCampaignManager'
import { customWeb3modal } from 'app/src/web3/walletConnect'
import { fetchMaticRate } from 'app/src/web3/transfers.js'

const emit = defineEmits(['hideDialog'])
const props = defineProps([
  'author',
  'categories',
  'date',
  'content',
  'id',
  'title',
  'productLink',
  'publishDate',
  'type',
  'content',
  'duration',
  'status',
  'contentURL',
  'budget',
  'campaignCode'
])

const $q = useQuasar()
const errorStore = useErrorStore()
const advertiseStore = useAdvertiseStore()
const storageStore = useStorageStore()
const userStore = useUserStore()
const contentModel = ref([])
const datePickerVisible = ref(false)
const fileErrorMessage = ref('')
const fileError = ref(false)
const usdAmount = ref(0)
const maticRate = ref(0)
const isEditing = ref(false)
const editorRef = ref(null)

function openDatePicker() {
  datePickerVisible.value = true
}
onMounted(async () => {
  if (!customWeb3modal.getAddress()) {
    customWeb3modal.open()
    emit('hideDialog')
  }
  const maticRateResult = await fetchMaticRate()
  if (maticRateResult?.success) {
    maticRate.value = maticRateResult.maticRate
  } else {
    $q.notify({ type: 'negative', message: 'Failed to fetch Pol rate' })
  }
})

const advertise = reactive({
  content: '',
  title: '',
  productLink: '',
  contentURL: '',
  campaignCode: ''
})
const step = ref(1)

watchEffect(() => {
  if (props.id) {
    advertise.author = props.author
    advertise.categories = props.categories
    advertise.date = props.date
    advertise.content = props.content
    advertise.id = props.id
    advertise.title = props.title
    advertise.productLink = props.productLink
    advertise.publishDate = props.publishDate
    advertise.type = props.type
    advertise.duration = props.duration
    advertise.status = props.status
    advertise.contentURL = props.contentURL ?? ''
    ;(advertise.budget = props.budget), (advertise.type = props.type)
    isEditing.value = true
  } else {
    const collectionRef = collection(db, 'advertises')
    const docRef = doc(collectionRef)

    advertise.author = userStore.isAuthenticated ? { userName: userStore.getUser.displayName, uid: userStore.getUser.uid } : null
    advertise.categories = []
    advertise.type = 'Banner'
    advertise.date = currentYearMonth()
    advertise.status = 'Inactive'
    advertise.cost = 0
    advertise.id = docRef.id
    isEditing.value = false
  }
})

function uploadPhoto() {
  advertise.contentURL = ''
  const reader = new FileReader()
  reader.readAsDataURL(contentModel.value)
  reader.onload = () => (advertise.contentURL = reader.result)
  reader.onloadend = function (e) {
    const image = new Image()
    image.src = e.target.result
    image.onload = function () {
      if (image.width < 500 || image.height < 252) {
        $q.notify({ type: 'negative', message: `Please select an image with minimum 500px width & 252px height for better view` })
        fileErrorMessage.value = 'Select an image with minimum 500px width & 252px height '
        fileError.value = true
      } else fileError.value = false
    }
  }
}

function onRejected() {
  $q.notify({ type: 'negative', message: 'File size is too big. Max file size is 5MB.' })
  fileErrorMessage.value = 'Max file size is 5MB.'
  fileError.value = true
}

function isUrlValid(userInput = '') {
  const res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)
  return res !== null
}

async function createAdCampaign(payload) {
  return await contractCreateAdCampaign(payload)
}
function convertToMatic() {
  if (maticRate.value && usdAmount.value && maticRate.value) {
    advertise.budget = (usdAmount.value / maticRate.value).toFixed(6)
  }
}

function onPaste(evt) {
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
  try {
    if (!advertise.budget) advertise.budget = 0

    $q.loading.show()
    advertise.endDate = calculateEndDate(advertise.publishDate, advertise.duration)
    if (advertise.type === 'Text') advertise.contentURL = ''
    else if (Object.keys(contentModel.value).length && advertise.type === 'Banner') {
      await storageStore
        .uploadFile(contentModel.value, `advertise/content-${advertise.id}`)
        .then((url) => (advertise.contentURL = url))
        .catch((error) => errorStore.throwError(error))
    }

    if (props.id) {
      if (props.type === 'Banner' && advertise.type === 'Text') {
        const imagePath = `advertise/content-${advertise.id}`
        storageStore.deleteFile(imagePath).catch((error) => console.log(error))
        advertise.contentURL = ''
      }
      await advertiseStore
        .editAdvertise(advertise)
        .then(() => $q.notify({ type: 'info', message: 'Advertise successfully edited' }))
        .catch((error) => {
          errorStore.throwError(error, 'Advertise edit failed')
        })
        .finally(() => $q.loading.hide())
    } else {
      //call contract create function
      const result = await createAdCampaign({ budgetInMatic: advertise.budget })
      if (result.status.includes('success')) {
        advertise.campaignCode = result.events[0].args.campaignCode
        //save advertisement to database
        await advertiseStore
          .addAdvertise(advertise)
          .then(() => {
            $q.notify({ type: 'positive', message: 'Advertise successfully submitted' })
            emit('hideDialog')
          })
          .catch((error) => {
            console.log(error)
            errorStore.throwError(error, 'Advertise submission failed')
          })
          .finally(() => $q.loading.hide())
      } else {
        $q.notify({ message: result?.error?.message, type: 'negative' })
        $q.loading.hide()
      }
    }
    emit('hideDialog')
  } catch (error) {
    $q.notify({ message: 'Advertise submission failed', type: 'negative' })
    errorStore.throwError(error, 'Advertise submission failed')
    emit('hideDialog')
    $q.loading.hide()
  }
  emit('hideDialog')
}
</script>
