<template>
  <q-card class="q-mt-none" :class="{ loading: promptStore.isLoading, 'not-loading': !promptStore.isLoading }">
    <q-form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false" @submit.prevent="onSubmit()">
      <q-stepper alternative-labels animated color="primary" ref="stepper" header-nav v-model="step">
        <q-step icon="settings" :name="1" :done="step > 1" :title="id ? 'Edit Prompt' : 'New Prompt'">
          <q-card-section style="height: 65vh">
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
              <q-card class="q-pa-md header-card q-mb-lg" flat bordered>
                <div class="row items-center">
                  <q-icon name="star" color="primary" class="text-h4 q-mr-sm" />
                  <div class="q-my-none text-subtitle1 q-mt-xs text-primary">Competition</div>

                  <div class="row items-center justify-end q-ml-auto no-wrap">
                    <q-icon name="info" class="cursor-pointer q-mr-sm" color="primary">
                      <q-tooltip v-if="!disablePublicationDate">
                        You can select a Publication Date from the Creation Date up to 6 months in the future.
                      </q-tooltip>
                      <q-tooltip v-else>This prompt is now published, and the Publication Date is locked</q-tooltip>
                    </q-icon>

                    <q-input
                      borderless
                      label="Publication Date"
                      readonly
                      :model-value="prompt.publicationDate || 'YYYY-MM-DD'"
                      data-test="input-publication-date"
                      :rules="[(val) => val?.length > 0 || 'Publication Date is required']"
                      style="max-width: 10rem"
                      class="q-pb-none date-input"
                      :disable="disablePublicationDate"
                      required
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer q-ml-none" color="primary" data-test="date-picker">
                          <q-popup-proxy>
                            <q-date
                              mask="YYYY-MM-DD"
                              minimal
                              v-model="prompt.publicationDate"
                              :options="dateOptions"
                              @update:model-value="updateEndDate"
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat data-test="close" />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>

                    <div class="q-mx-lg text-h5">-</div>
                    <q-icon name="info" class="cursor-pointer q-mr-sm" color="primary">
                      <q-tooltip v-if="!disableEndDate">
                        Select an End Date after the Publication Date and within the allowed range.
                      </q-tooltip>
                      <q-tooltip v-else>This prompt's competition has ended.</q-tooltip>
                    </q-icon>
                    <q-input
                      readonly
                      borderless
                      label="End Date"
                      data-test="input-end-date"
                      class="q-pb-none date-input"
                      type="text"
                      required
                      :disable="!prompt.publicationDate || disableEndDate"
                      :model-value="prompt.endDate || 'YYYY-MM-DD'"
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer q-ml-none" color="primary" data-test="date-picker">
                          <q-popup-proxy>
                            <q-date mask="YYYY-MM-DD" minimal v-model="prompt.endDate" :options="endDateOptions">
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Close" color="primary" flat data-test="close" />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </q-card>
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

        <q-step
          caption="Optional"
          icon="create_new_folder"
          :name="2"
          :done="step > 2"
          :disable="isNextStepDisabled"
          title="Artist Carousel"
        >
          <q-card-section class="q-mt-md q-pt-none" style="height: 65vh">
            <div class="q-my-lg">
              <ShowcaseCard
                collectionName="prompt"
                :date="prompt.date"
                v-model:arts="prompt.showcase.arts"
                v-model:artist="prompt.showcase.artist"
              />
            </div>
          </q-card-section>
        </q-step>
        <q-step icon="payments" :name="3" :done="step > 3" :disable="isNextStepDisabled" title="Deposit">
          <q-card-section class="q-mt-md q-pt-none column justify-start items-center" style="height: 65vh">
            <div class="text-h4 text-primary font-weight-bold text-center">Winner Prize Deposit Escrow Fund</div>

            <div class="q-mt-xs text-subtitle1 text-center q-mt-sm q-mb-lg">
              You can deposit funds to secure the prize for the winner. Please select either "Pay now" or "Pay later".
            </div>

            <q-btn
              class="deposite-button"
              :disable="!!prompt.rewardAmount"
              :color="
                prompt.paymentStatus === 'Pay later' ? 'orange' : prompt.paymentStatus === 'Payment successful' ? 'positive' : 'secondary'
              "
              :label="
                prompt.paymentStatus === 'Pay later'
                  ? 'Pay later'
                  : prompt.paymentStatus === 'Payment successful'
                    ? `${prompt.rewardAmount}$ Deposited`
                    : 'Deposit Funds'
              "
              :icon="
                prompt.paymentStatus === 'Pay later'
                  ? 'schedule'
                  : prompt.paymentStatus === 'Payment successful'
                    ? 'check_circle'
                    : 'account_balance_wallet'
              "
            >
              <q-menu class="deposite-menu">
                <div class="row items-center q-gutter-xs" style="margin-top: 1px">
                  <q-btn color="orange" label="Pay later" v-close-popup @click="updatepaymentStatus('Pay later')" />
                  <q-btn label="Pay now" color="green" v-close-popup @click="onProceedDepositFundDialog" />
                </div>
              </q-menu>
            </q-btn>

            <q-dialog v-model="proceedDepositFundDialog.show" persistent>
              <q-card style="width: 400px; max-width: 60vw">
                <q-card-section class="q-pb-none">
                  <h6 class="q-my-sm">Escrow Fund Deposit</h6>
                </q-card-section>
                <FundDepositCard
                  :walletAddress="proceedDepositFundDialog.walletAddress"
                  promptCardUsed
                  @paymentDetails="updatePaymentDetails($event)"
                  @hideDialog="proceedDepositFundDialog.show = false"
                />
              </q-card>
            </q-dialog>
          </q-card-section>
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation class="flex justify-end q-gutter-md">
            <template v-if="promptStore.isLoading">
              <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 100px" />
              <q-skeleton type="rect" class="q-mr-md" style="height: 40px; width: 120px" />
            </template>
            <template v-else>
              <q-btn v-if="step < 2" flat rounded label="Cancel" v-close-popup :disable="promptStore.isLoading" data-test="button-cancel" />
              <q-btn v-if="step > 1" flat rounded @click="$refs.stepper.previous()" label="Back" :disable="promptStore.isLoading" />

              <q-btn
                v-if="step === 3"
                color="primary"
                data-test="button-submit"
                :disable="isNextStepDisabled || !prompt.paymentStatus"
                label="Submit Prompt"
                :loading="promptStore.isLoading || storageStore.isLoading"
                rounded
                type="submit"
              />

              <q-btn
                v-if="step < 3"
                color="primary"
                :disable="isNextStepDisabled"
                label="Continue"
                :loading="promptStore.isLoading || storageStore.isLoading"
                rounded
                @click="$refs.stepper.next()"
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
import { useQuasar, date as dateUtils } from 'quasar'
import ShowcaseCard from 'src/components/Admin/ShowcaseCard.vue'
import { useErrorStore, usePromptStore, useStorageStore, useUserStore } from 'src/stores'
import { onMounted, reactive, ref, watchEffect, computed } from 'vue'
import { uploadAndSetImage } from 'src/utils/imageConvertor'
import CaptureCamera from '../shared/CameraCapture.vue'
import FundDepositCard from './FundDepositCard.vue'
import { customWeb3modal } from 'app/src/web3/walletConnect'
import { collection, doc } from 'firebase/firestore'
import { db } from 'src/firebase'

const emit = defineEmits(['hideDialog'])
const props = defineProps([
  'author',
  'categories',
  'created',
  'date',
  'description',
  'id',
  'image',
  'showcase',
  'slug',
  'title',
  'creationDate',
  'publicationDate',
  'endDate',
  'paymentStatus',
  'rewardAmount'
])

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
  title: '',
  publicationDate: '',
  endDate: '',
  creationDate: new Date().toISOString().split('T')[0],
  paymentStatus: '',
  rewardAmount: null
})

const proceedDepositFundDialog = ref({})
const step = ref(1)
const imageModel = ref(null)
const imagePreview = ref(null)
const editorRef = ref(null)
const openCamera = ref(false)

function dateOptions(currentDate, creationDate = prompt.creationDate) {
  const timestamp = dateUtils.startOfDate(creationDate, 'day').getTime()
  const today = new Date()
  const todayTimestamp = dateUtils.startOfDate(today, 'day').getTime()
  const dateObj = dateUtils.extractDate(currentDate, 'YYYY/MM/DD')
  const limitObj = dateUtils.addToDate(timestamp, { months: 6 })
  return todayTimestamp <= dateObj.getTime() && dateObj.getTime() <= limitObj.getTime()
}

function endDateOptions(currentDate) {
  const publicationDate = dateUtils.addToDate(new Date(prompt.publicationDate), { days: 1 })
  const timestamp = dateUtils.startOfDate(publicationDate, 'day').getTime()
  const dateObj = dateUtils.extractDate(currentDate, 'YYYY/MM/DD')
  const limitObj = dateUtils.addToDate(timestamp, { months: 6 })
  return timestamp <= dateObj.getTime() && dateObj.getTime() <= limitObj.getTime()
}

async function onProceedDepositFundDialog() {
  if (!customWeb3modal.getAddress()) {
    $q.notify({ type: 'negative', message: 'Please connect your wallet and try again' })
    customWeb3modal.open()
  } else {
    proceedDepositFundDialog.value.show = true
    proceedDepositFundDialog.value.walletAddress = customWeb3modal.getAddress()
  }
}

watchEffect(() => {
  if (props.id) {
    prompt.author = { label: props.author.displayName, value: props.author.uid }
    prompt.categories = props.categories
    prompt.creationDate = props.creationDate
    prompt.publicationDate = props.publicationDate
    prompt.endDate = props.endDate
    prompt.description = props.description
    prompt.id = props.id
    prompt.image = props.image
    prompt.showcase = props.showcase
    prompt.title = props.title
    prompt.paymentStatus = props.paymentStatus
    prompt.rewardAmount = props.rewardAmount
    if (props.image) {
      imagePreview.value = props.image
    }
  } else {
    const collectionRef = collection(db, 'prompts')
    const docRef = doc(collectionRef)
    prompt.author = userStore.isAuthenticated ? { label: userStore.getUser.displayName, value: userStore.getUser.uid } : null
    prompt.categories = null
    prompt.id = docRef.id
  }
})

onMounted(() => {
  userStore.getAdminsAndEditors.forEach((user) => authorOptions.push({ label: user.displayName, value: user.uid }))

  if (!props.id) {
    prompt.publicationDate = ''
  }
})
const disablePublicationDate = computed(() => {
  if (!props.id) return false
  const publicationDateData = new Date(props.publicationDate).getTime()
  return Date.now() >= publicationDateData
})

const disableEndDate = computed(() => {
  if (!props.id) return false
  const endDateData = new Date(props.endDate).getTime()
  return Date.now() >= endDateData
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

  if (!prompt.publicationDate) {
    $q.notify({ type: 'negative', message: 'Publication Date is required.' })
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
    const id = `${prompt.id}`
    prompt.image = await uploadAndSetImage(imageModel.value, `images/prompt-${id}`)
  }

  try {
    if (props.id) {
      await promptStore.editPrompt(prompt)
      $q.notify({ type: 'info', message: 'Prompt successfully edited' })
    } else {
      await promptStore.addPrompt(prompt)
      if (prompt.paymentStatus === 'Payment successful') {
        $q.notify({ type: 'positive', message: 'Prompt successfully submitted.' })
      } else {
        $q.notify({ type: 'positive', message: 'Prompt successfully submitted. Please make sure to fund it.' })
      }
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

function updatepaymentStatus(data) {
  prompt.paymentStatus = data
}

async function updatePaymentDetails(data) {
  prompt.escrowId = data.escrowId
  prompt.paymentStatus = data.paymentStatus
  prompt.rewardAmount = data.rewardAmount

  onSubmit()
}

const isNextStepDisabled = computed(() => {
  return (
    !prompt.title ||
    !prompt.description ||
    !prompt.categories?.length ||
    !prompt.image ||
    promptStore.isLoading ||
    !prompt.publicationDate ||
    !prompt.endDate
  )
})
</script>

<style scoped lang="scss">
.header-card {
  background-color: #f0f4ff;
  border-left: 5px solid var(--q-primary);
  border-radius: 8px;
}
.text-primary {
  color: var(--q-primary);
}
.q-ml-none {
  margin-left: 0 !important;
}
.date-input {
  ::v-deep(.q-field__native) {
    width: 94px !important;
  }
}
.deposite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 8px;
  width: 200px;
  border: none;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &--positive {
    background-color: #21ba45;
    color: #ffffff;
  }

  &--secondary {
    background-color: #36454f;
    color: #ffffff;
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}
</style>
