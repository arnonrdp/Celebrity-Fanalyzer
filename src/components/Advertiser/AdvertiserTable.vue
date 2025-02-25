<template>
  <div>
    <div class="q-pa-md">
      <q-table
        flat
        class="custom-table"
        bordered
        virtual-scroll
        :hide-bottom="!!advertises.length && !filter.length"
        title="Manage Advertisements"
        row-key="name"
        no-data-label="No advertisements found."
        no-results-label="No advertisements found for your search."
        :filter="filter"
        :rows="localAdvertises"
        :columns="advertises.length > 0 ? columns : []"
        :loading="advertiseStore.isLoading"
        :rows-per-page-options="[0]"
      >
        <template v-slot:top-right>
          <div class="flex no-wrap">
            <q-input v-model="filter" debounce="300" dense placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-select
              v-model="selectedDataType"
              :options="dataOptions"
              label="Filter By Status"
              outlined
              dense
              @update:model-value="onUpdate"
              class="q-ml-lg ads-select"
            />
          </div>
        </template>
        <template #body-cell-action="props">
          <q-td :props="props">
            <q-icon
              v-if="
                userStore.getUser.role === 'Admin' &&
                props.row.campaignCode?.length > 5 &&
                props.row.status !== 'Inactive' &&
                props.row.status !== 'Complete'
              "
              flat
              color="green"
              name="payment"
              size="18px"
              label=""
              class="q-mr-sm cursor-pointer"
              :disable="userStore.getUser.role !== 'Admin'"
              @click="onwithdrawAmountSpentDialog(props.row)"
            >
              <q-tooltip class="positive" :offset="[10, 10]">withdraw amount spent!</q-tooltip>
            </q-icon>
            <q-icon
              v-if="
                userStore.getUser.uid === props.row.author.id &&
                props.row.campaignCode?.length > 5 &&
                props.row.status !== 'Inactive' &&
                props.row.status !== 'Complete'
              "
              flat
              color="primary"
              name="free_cancellation"
              size="18px"
              label=""
              class="q-mr-sm cursor-pointer"
              :disable="userStore.getUser.role !== 'Advertiser' && userStore.getUser.email !== props.row.author.email"
              @click="onWithdrawRemainingBudgetDialog(props.row)"
            >
              <q-tooltip class="positive" :offset="[10, 10]">withdraw remaining budget!</q-tooltip>
            </q-icon>
            <q-icon
              v-if="props.row.campaignCode?.length > 5"
              flat
              color="dark"
              name="receipt_long"
              size="18px"
              label=""
              class="q-mr-sm cursor-pointer"
              @click="_getEventsForCampaign(props.row)"
            >
              <q-tooltip class="positive" :offset="[10, 10]">view events!</q-tooltip>
            </q-icon>

            <q-icon
              v-if="userStore.isAdmin && !props.row.isApproved"
              name="done_outline"
              color="green"
              size="18px"
              class="cursor-pointer q-mr-sm"
              @click="openApprovalDialog(props.row)"
            >
              <q-tooltip>Approve</q-tooltip>
            </q-icon>
            <q-icon
              v-if="computedDuration(props.row.endDate) >= 0"
              name="edit"
              color="blue"
              size="18px"
              class="cursor-pointer q-mr-sm"
              @click="$emit('openAdvertiseDialog', props.row)"
            >
              <q-tooltip>Edit</q-tooltip>
            </q-icon>
            <q-icon name="delete" color="red" size="18px" @click="openDeleteDialog(props.row.id, props.row.type)" class="cursor-pointer">
              <q-tooltip>Delete</q-tooltip>
            </q-icon>
          </q-td>
        </template>
        <template #body-cell-expiry_status="props">
          <q-td class="text-right">
            {{ formatExpiryStatus(computedDuration(props.row.endDate)) }}
            <q-tooltip>{{ props.row.publishDate }} to {{ props.row.endDate }}</q-tooltip>
          </q-td>
        </template>
        <template #body-cell-status="props">
          <q-td class="text-right items-center" style="display: flex; gap: 10px">
            <q-icon v-if="!props.row.isApproved" name="schedule" size="18px" color="blue">
              <q-tooltip>Waiting for the approval</q-tooltip>
            </q-icon>
            <q-icon v-else-if="props.row.status === 'Budget Crossed'" name="close" size="18px" color="primary" />
            <q-icon v-else-if="props.row.status === 'Complete'" name="task_alt" size="18px" color="green" />
            <q-icon
              v-else-if="props.row.status === 'Inactive'"
              name="play_circle"
              size="18px"
              color="green-6"
              class="cursor-pointer"
              @click="changeActiveStatus(props.row, 'Active')"
            >
              <q-tooltip>Publish</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="props.row.status === 'Active'"
              name="pause_circle"
              size="18px"
              color="red-8"
              class="cursor-pointer"
              @click="changeActiveStatus(props.row, 'Inactive')"
            >
              <q-tooltip>Unpublish</q-tooltip>
            </q-icon>
            {{ props.row.status }}
          </q-td>
        </template>
        <template #body-cell-content="props">
          <q-td class="cursor-pointer" @click="goToUrl(props.row.id)">
            <div v-html="props.row.content" class="singleLine_ellipsis"></div>
          </q-td>
        </template>
        <template #body-cell-name="props">
          <q-td class="cursor-pointer" @click="goToUrl(props.row.id)">
            {{ props.row.title?.length > 30 ? props.row.title.substring(0, 30) + '...' : props.row.title }}
          </q-td>
        </template>
        <template #body-cell-total_cost="props">
          <q-td class="text-right">
            {{ viewMatic(props.row.totalCost) }}
            <q-tooltip>{{ props.row.totalCost }}</q-tooltip>
          </q-td>
        </template>
      </q-table>
    </div>
    <q-dialog v-model="dialog.open">
      <q-card style="min-width: 20rem; max-width: 30rem">
        <q-card-section class="bg-primary text-white q-pa-sm">
          <div class="text-h6">{{ dialog.title }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none bg-white q-py-lg text-center">
          <div class="text-subtitle1 wrap">{{ dialog.subTitle }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <template v-if="dialog.type === 'ChangePublishDate'">
            <q-btn flat label="Yes" color="primary" v-close-popup @click="changePublishDate" />
            <q-btn flat label="No" color="primary" v-close-popup @click="onDeselect" />
          </template>
          <template v-else-if="dialog.type === 'DeleteCampaign'">
            <q-btn flat label="Yes" color="primary" v-close-popup @click="onDeleteAdvertise" />
            <q-btn flat label="No" color="primary" v-close-popup @click="onDeselect" />
          </template>
          <template v-else-if="dialog.type === 'ApproveCampaign'">
            <q-btn flat label="Yes" color="primary" v-close-popup @click="onApproveAdvertise" />
            <q-btn flat label="No" color="primary" v-close-popup @click="onDeselect" />
          </template>
          <template v-else>
            <q-btn flat label="Ok" color="primary" v-close-popup @click="onDeselect" />
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="withdrawAmountSpentDialog.show">
      <q-card>
        <q-card-section class="q-pb-none">
          <h6 class="q-my-sm">Available Amount to withdraw : {{ withdrawAmountSpentDialog.unclaimedAmount }}</h6>
        </q-card-section>
        <q-card-section>Are you sure you want to withdraw it ?</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Confirm"
            color="negative"
            @click="_claimPayment(withdrawAmountSpentDialog.advertise, withdrawAmountSpentDialog.currentAmountSpent)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="withdrawRemainingBudgetDialog.show">
      <q-card>
        <q-card-section class="q-pb-none">
          <h6 class="q-my-sm">Withdraw Remaining Budget : {{ withdrawRemainingBudgetDialog.remainingBudget }}</h6>
        </q-card-section>
        <q-card-section>Are you sure you want to withdraw it ?</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            data-test="delete-button"
            flat
            label="Confirm"
            color="negative"
            @click="_withdrawRemainingBudget(withdrawRemainingBudgetDialog.advertise, withdrawRemainingBudgetDialog.currentAmounSpent)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="advertismentPaymentEventsDialog.show">
      <q-card>
        <q-card-section class="row items-center">
          <div class="col">Campaign Events</div>
          <q-btn icon="close" flat round dense @click="advertismentPaymentEventsDialog.show = false" />
        </q-card-section>
        <q-card-section>
          <q-table :rows="eventRows" :columns="eventColumns" row-key="index" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAdvertiseStore, useErrorStore, useUserStore } from 'src/stores'
import { useRouter } from 'vue-router'
import { getCurrentDate, calculateEndDate, computedDuration } from 'src/utils/date'
import { claimPayment, requestAndApproveWithdrawal, getEventsForCampaign, getAdCampaignCosts } from 'app/src/web3/adCampaignManager'
import { customWeb3modal } from 'app/src/web3/walletConnect'

const props = defineProps({
  advertises: {
    required: true,
    default: () => [],
    type: Array
  }
})

const localAdvertises = ref([])

// Watch for changes in props.advertises
watch(
  () => props.advertises,
  async (newAdvertises) => {
    if (newAdvertises && newAdvertises.length > 0) {
      // Compute and add totalCost for each advertisement
      const advertisesWithCost = await Promise.all(
        newAdvertises.map(async (advertise) => ({
          ...advertise,
          totalCost: await computeAdvertisementMatic(advertise.totalImpressions, advertise.totalClicks, advertise.totalVisits),
          status: await showStatus(advertise)
        }))
      )
      localAdvertises.value = advertisesWithCost
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await advertiseStore.fetchAdvertises(selectedDataType?.value.label)
})

const router = useRouter()
const dialog = ref({ open: false, title: '', subTitle: '', type: '' })
const withdrawAmountSpentDialog = ref({})
const withdrawRemainingBudgetDialog = ref({})
const advertismentPaymentEventsDialog = ref({ show: false })
const $q = useQuasar()
const advertiseStore = useAdvertiseStore()
const errorStore = useErrorStore()
const userStore = useUserStore()
const selectedAdvertise = ref({})
const filter = ref('')
const selectedDataType = ref({ label: 'Ongoing', value: 'ongoing' })
const eventRows = ref([])
const eventColumns = ref([
  { name: 'eventType', align: 'left', label: 'Event Type', field: 'eventType' },
  { name: 'amount', align: 'right', label: 'Amount', field: 'amount', format: (val) => `${val} MATIC` }
])
const initialDataOptions = [
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Budget Crossed', value: 'budget-crossed' },
  { label: 'Complete', value: 'complete' },
  { label: 'All', value: 'all' }
]

const dataOptions = ref(
  initialDataOptions.filter(
    (option) =>
      option.value === 'budget-crossed' ||
      option.value === 'complete' ||
      option.value === 'all' ||
      option.value === 'inactive' ||
      option.value === 'active' ||
      option.value === 'ongoing'
  )
)

async function calculateAmountSpent(advertise) {
  const advertiseCosts = await getAdCampaignCosts()
  console.log('advertiseCosts====== ', advertiseCosts)
  console.log('the current advertise ====== ', advertise)
  if (advertiseCosts.status.includes('success')) {
    const result =
      parseFloat(advertiseCosts.data.costPerClick) * advertise.totalClicks +
      parseFloat(advertiseCosts.data.costPerImpression) * advertise.totalImpressions +
      parseFloat(advertiseCosts.data.costPerImpression) * advertise.totalVisits
    console.log('result====== ', result)
    return result
  } else {
    console.log('Failed to get the cost of the advertise', advertiseCosts)
    $q.notify({ type: 'negative', message: 'Failed to get the cost of the advertise' })
  }
}

async function _getEventsForCampaign(advertise) {
  if (advertise?.campaignCode) {
    $q.loading.show()
    if (!customWeb3modal.getAddress()) {
      $q.notify({ type: 'negative', message: 'Please connect your wallet and try again' })
      customWeb3modal.open()
      $q.loading.hide()
    } else {
      const result = await getEventsForCampaign(advertise.campaignCode)

      if (result.status.includes('success')) {
        $q.notify({ message: 'Events retreived successfully ', type: 'positive' })
        // Combine events into a single array with eventType field

        const adCampaignCreatedEvents = result.events.adCampaignCreatedEvents.map((event) => ({
          ...event,
          eventType: 'Campaign Created'
        }))

        const paymentReleasedEvents = result.events.paymentReleasedEvents.map((event) => ({
          ...event,
          eventType: 'Payment Released'
        }))

        const budgetWithdrawnEvents = result.events.budgetWithdrawnEvents.map((event) => ({
          ...event,
          eventType: 'Remaining Budget Withdrawn'
        }))

        const paymentReleasedOnWithdrawApprovalEvents = result.events.paymentReleasedOnWithdrawApprovalEvents.map((event) => ({
          ...event,
          eventType: 'Payment Released on Withdraw Approval'
        }))

        eventRows.value = [
          ...adCampaignCreatedEvents,
          ...paymentReleasedEvents,
          ...budgetWithdrawnEvents,
          ...paymentReleasedOnWithdrawApprovalEvents
        ]
        //let's change the advertise status.
        advertismentPaymentEventsDialog.value.show = true
      } else {
        $q.notify({ message: result?.error?.message, type: 'negative' })
      }
    }
  } else {
    $q.notify({ message: 'No campaign code associated', type: 'negative' })
  }
  $q.loading.hide()
}

async function onWithdrawRemainingBudgetDialog(advertise) {
  if (advertise?.campaignCode) {
    $q.loading.show()
    const currentAmountSpent = await calculateAmountSpent(advertise)
    const remainingBudget = advertise.budget - currentAmountSpent < 0 ? 0 : advertise.budget - currentAmountSpent
    withdrawRemainingBudgetDialog.value.advertise = advertise
    withdrawRemainingBudgetDialog.value.currentAmounSpent = currentAmountSpent
    withdrawRemainingBudgetDialog.value.remainingBudget = remainingBudget
    withdrawRemainingBudgetDialog.value.show = true
  } else {
    $q.notify({ message: 'No campaign code associated', type: 'negative' })
  }
  $q.loading.hide()
}

async function onwithdrawAmountSpentDialog(advertise) {
  if (advertise?.campaignCode) {
    $q.loading.show()
    const currentAmountSpent = await calculateAmountSpent(advertise)
    const adEvents = await getEventsForCampaign(advertise.campaignCode)
    let releasedAmount = 0
    let unclaimedAmount = 0
    if (adEvents.status.includes('success')) {
      if (adEvents.events.paymentReleasedEvents) {
        adEvents.events.paymentReleasedEvents.forEach((paymentReleasedEvent) => {
          releasedAmount += parseFloat(paymentReleasedEvent.amount)
        })
      }
    }
    unclaimedAmount = parseFloat(currentAmountSpent - releasedAmount).toFixed(3)

    if (unclaimedAmount > 0) {
      withdrawAmountSpentDialog.value.advertise = advertise
      withdrawAmountSpentDialog.value.unclaimedAmount = unclaimedAmount
      withdrawAmountSpentDialog.value.currentAmountSpent = currentAmountSpent
      withdrawAmountSpentDialog.value.show = true
    } else {
      $q.notify({ message: 'The curent balance to claim should be greater than zero' })
    }
  } else {
    $q.notify({ message: 'No campaign code associated', type: 'negative' })
  }
  $q.loading.hide()
}

async function _claimPayment(advertise, currentAmountSpent) {
  $q.loading.show()
  if (!customWeb3modal.getAddress()) {
    $q.notify({ type: 'negative', message: 'Please connect your wallet and try again' })
    customWeb3modal.open()
    $q.loading.hide()
  } else {
    const result = await claimPayment({ campaignCode: advertise.campaignCode, currentAmounSpentInMatic: currentAmountSpent.toString() })
    if (result.status.includes('success')) {
      $q.notify({ message: 'Campaign payment claimed successfully ', type: 'positive' })
      //let's change the advertise status.
      if (currentAmountSpent >= advertise.budget) {
        await _completeAdvertise(advertise)
      }
    } else {
      $q.notify({ message: result?.error?.message, type: 'negative' })
    }
  }

  $q.loading.hide()
}

async function _completeAdvertise(advertise) {
  advertise.status = 'Complete'
  advertiseStore
    .editAdvertise(advertise)
    .then(() => $q.notify({ type: 'info', message: 'Advertise status Changed to complete ' }))
    .catch((error) => {
      errorStore.throwError(error, 'Advertise edit failed')
    })
}
async function _withdrawRemainingBudget(advertise, currentAmounSpent) {
  $q.loading.show()
  if (!customWeb3modal.getAddress()) {
    $q.notify({ type: 'negative', message: 'Please connect your wallet and try again' })
    customWeb3modal.open()
    $q.loading.hide()
  } else {
    const result = await requestAndApproveWithdrawal({ campaignCode: advertise.campaignCode, currentAmounSpentInMatic: currentAmounSpent })
    if (result.status.includes('success')) {
      $q.notify({ message: 'Remaing budget withdrawn successfully ', type: 'positive' })
      //let's change the advertise status
      await _completeAdvertise(advertise)
    } else {
      $q.notify({ message: result?.error?.message, type: 'negative' })
    }
  }
  $q.loading.hide()
}

function goToUrl(id) {
  router.push('/campaign/' + id)
}

onMounted(async () => {
  await advertiseStore.fetchAdvertises(selectedDataType?.value.label)
})

function openDeleteDialog(id, type) {
  dialog.value.open = true
  dialog.value.title = 'Delete campaign'
  dialog.value.subTitle = 'Are you sure you want to delete this campaign'
  dialog.value.type = 'DeleteCampaign'
  selectedAdvertise.value.id = id
  selectedAdvertise.value.type = type
}

function openApprovalDialog(advertise, approve = true) {
  dialog.value.open = true
  dialog.value.title = 'Approval'
  dialog.value.subTitle = 'Are you sure you want to approve this campaign'
  dialog.value.type = 'ApproveCampaign'
  selectedAdvertise.value = { ...advertise }
  selectedAdvertise.value.isApproved = approve
}

function changePublishDate() {
  const date = getCurrentDate()
  selectedAdvertise.value.publishDate = date
  selectedAdvertise.value.endDate = calculateEndDate(date, selectedAdvertise.value.duration)
  advertiseStore
    .editAdvertise(selectedAdvertise.value)
    .then(() =>
      $q.notify({
        type: 'info',
        message: selectedAdvertise.value.status === 'Active' ? 'Advertise published successfully' : 'Advertise unpublished successfully'
      })
    )
    .catch((error) => {
      errorStore.throwError(error, 'Advertise edit failed')
    })
    .finally(() => {
      selectedAdvertise.value = {}
    })
}

function onDeleteAdvertise() {
  const id = selectedAdvertise.value?.id
  const type = selectedAdvertise.value?.type
  if (id && type) {
    advertiseStore
      .deleteAdvertise(id, type === 'Banner')
      .then(() => $q.notify({ type: 'negative', message: 'Advertise successfully deleted' }))
      .catch((error) => {
        errorStore.throwError(error, 'Advertise deletion failed')
      })
      .finally(() => {
        selectedAdvertise.value = {}
      })
  }
  selectedAdvertise.value = {}
}

function onDeselect() {
  selectedAdvertise.value = {}
}

function onApproveAdvertise() {
  advertiseStore
    .editAdvertise(selectedAdvertise.value)
    .then(() => $q.notify({ type: 'info', message: 'Advertise Approved successfully' }))
    .catch((error) => {
      console.log(error)
      errorStore.throwError(error, 'Advertise Approval failed')
    })
    .finally(() => {
      selectedAdvertise.value = {}
    })
}

const columns = ref([
  {
    name: 'status',
    field: 'publishDate',
    align: 'center',
    label: 'Status'
  },
  {
    name: 'name',
    required: true,
    label: 'Advertise Title',
    align: 'left',
    field: 'title'
  },
  {
    name: 'content',
    required: true,
    field: 'content',
    align: 'left',
    label: 'Advertise Content'
  },
  {
    name: 'type',
    required: true,
    align: 'center',
    field: 'type',
    label: 'Advertise Type'
  },
  {
    name: 'budget',
    field: 'budget',
    align: 'center',
    label: 'Advertise Budget',
    sortable: true
  },
  {
    name: 'clicks',
    field: 'totalClicks',
    align: 'center',
    label: 'Clicks',
    sortable: true
  },
  {
    name: 'impression',
    field: 'totalImpressions',
    align: 'center',
    label: 'Impression',
    sortable: true
  },
  {
    name: 'visits',
    field: 'totalVisits',
    align: 'center',
    label: 'Visits',
    sortable: true
  },
  {
    name: 'total_cost',
    field: 'total_cost',
    align: 'right',
    label: 'Total Spent',
    sortable: true
  },
  {
    name: 'expiry_status',
    field: 'duration',
    align: 'right',
    label: 'Expires in'
  },

  {
    name: 'action',
    field: 'action',
    align: 'right',
    label: ''
  }
])

function changeActiveStatus(advertise, status) {
  if (!calculateStatus(advertise.publishDate) && status === 'Active') {
    dialog.value.open = true
    dialog.value.title = 'Publish Status'
    dialog.value.subTitle = 'Do you want to change your publish date and publish this campaign today?'
    dialog.value.type = 'ChangePublishDate'
    selectedAdvertise.value = { ...advertise }
    selectedAdvertise.value.status = status
    return
  }
  advertise.status = status
  advertiseStore
    .editAdvertise(advertise)
    .then(() =>
      $q.notify({
        type: 'info',
        message: status === 'Active' ? 'Advertise published successfully' : 'Advertise unpublished successfully'
      })
    )
    .catch((error) => {
      errorStore.throwError(error, 'Advertise edit failed')
    })
}

function calculateStatus(date) {
  const currentDate = new Date()
  const publishDate = new Date(date)

  return publishDate <= currentDate
}

watch(selectedDataType, (newType) => {
  advertiseStore.fetchAdvertises(newType.label)
})

const maticCache = new Map()

async function computeAdvertisementMatic(impressions = 0, clicks = 0, views = 0) {
  const key = `${impressions}-${clicks}-${views}`
  const advertiseCosts = await getAdCampaignCosts()
  let impressionsMatic = 0
  let clicksMatic = 0
  let viewsMatic = 0
  if (advertiseCosts.status.includes('success')) {
    impressionsMatic = impressions * parseFloat(advertiseCosts.data.costPerImpression)
    clicksMatic = clicks * parseFloat(advertiseCosts.data.costPerClick)
    viewsMatic = views * parseFloat(advertiseCosts.data.costPerImpression)
  } else {
    console.log('Failed to get the cost of the advertise', advertiseCosts)
    $q.notify({ type: 'negative', message: 'Failed to get the cost of the advertise' })
  }

  if (maticCache.has(key)) {
    return maticCache.get(key)
  }
  const result = impressionsMatic + clicksMatic + viewsMatic
  maticCache.set(key, result)
  return result
}

function viewMatic(matic) {
  if (Number.isInteger(matic)) return matic
  const maticSplit = String(matic).split('.')
  let floatNumbers = maticSplit[1]
  if (floatNumbers?.length > 3) {
    floatNumbers = floatNumbers.slice(0, 3) + '...'
  }
  return maticSplit[0] + '.' + floatNumbers
}

async function showStatus(data) {
  const create = calculateStatus(data.publishDate)
  const ended = calculateStatus(data.endDate)
  const budgetCrossed = (await computeAdvertisementMatic(data.totalImpressions, data.totalClicks, data.totalVisits)) > Number(data.budget)
  if (!create) {
    return 'Publish date pending'
  } else if (budgetCrossed || data.status === 'Budget Crossed') {
    return 'Budget Crossed'
  } else if (ended || data.status === 'Complete') {
    return 'Complete'
  } else if (data.status === 'Active') {
    return 'Published'
  } else if (create && !ended && data.status !== 'Budget Crossed') {
    return 'Ready to Publish'
  }
  return 'Pending: Publish date not yet reached'
}

async function onUpdate(e) {
  selectedDataType.value = {
    value: e.value,
    label: e.label
  }
}

function formatExpiryStatus(days) {
  if (days === 1) {
    return '1 day left'
  } else if (days > 1) {
    return `${days} day's left`
  } else if (days === 0) {
    return `Today`
  } else {
    return 'Expired'
  }
}
</script>

<style>
.ads-select {
  width: 60%;

  @media (max-width: 720px) {
    width: 50%;
  }
}

.ads-select > :first-child > :first-child {
  background-color: white !important;
}

.singleLine_ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 300px;
  height: 20px;
}
</style>
