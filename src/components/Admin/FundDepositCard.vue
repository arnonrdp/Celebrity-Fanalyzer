<template>
  <q-card>
    <q-card-section class="q-pt-none">
      <q-form @submit="onSubmit">
        <q-input hide-hint label="Current connected wallet address" maxlength="80" required v-model="_walletAddress" disable />
        <q-input
          v-model="usdAmount"
          label="Price in USD"
          min="0"
          mask="#.##"
          fill-mask="0"
          reverse-fill-mask
          @update:model-value="convertToMatic()"
        />
        <!-- Displaying Corresponding Ether Amount-->
        <q-input data-text="ether-amount" v-model="maticAmount" label="Price in pol" readonly></q-input>
        <q-card-actions align="right">
          <q-btn color="primary" label="Cancel" v-close-popup />
          <q-btn label="deposit fund" :disable="!usdAmount" color="green" data-test="confirm-deposit-fund" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card-section>
  </q-card>
</template>
<script setup>
import { useQuasar } from 'quasar'
import { useErrorStore } from 'src/stores'
import { ref, onMounted } from 'vue'
import { fetchMaticRate } from 'app/src/web3/transfers.js'
import { usePromptStore } from 'src/stores'
import { depositFunds } from 'app/src/web3/escrow'

const $q = useQuasar()
const errorStore = useErrorStore()

const promptStore = usePromptStore()

const emit = defineEmits(['hideDialog', 'paymentStatus', 'winnerReward'])

const props = defineProps({
  walletAddress: { type: String, required: true },
  prompt: { type: Object }
})

const _walletAddress = ref('')
const _prompt = ref(null)
const usdAmount = ref(0)
const maticAmount = ref(0)
const maticRate = ref(0)

onMounted(async () => {
  _walletAddress.value = props.walletAddress
  _prompt.value = props.prompt
  const maticRateResult = await fetchMaticRate()
  if (maticRateResult?.success) {
    maticRate.value = maticRateResult.maticRate
  } else {
    $q.notify({ type: 'negative', message: 'Failed to fetch POL rate' })
  }
})

function convertToMatic() {
  if (maticRate.value && usdAmount.value) {
    maticAmount.value = (usdAmount.value / maticRate.value).toFixed(6)
  }
}

async function onSubmit(event) {
  event.preventDefault()

  $q.loading.show()
  try {
    const result = await depositFunds({ amountInMatic: maticAmount.value })
    if (result?.status?.includes('success')) {
      if (_prompt?.value) {
        //save advertisement to database
        _prompt.value.escrowId = result.events[0].args.escrowId
        const payload = {
          promptId: _prompt.value.id,
          escrowId: result.events[0].args.escrowId
        }
        await promptStore
          .updateEscrowId(payload)
          .then(() => {
            $q.notify({ type: 'info', message: 'Fund deposited successfully' })
            emit('paymentStatus', 'Payment successful')
            emit('winnerReward', usdAmount.value)
          })
          .catch((error) => {
            errorStore.throwError(error, 'fund deposit failed on prompt edition')
          })
          .finally(() => {
            $q.loading.hide()
            emit('hideDialog')
          })
      } else {
        $q.notify({ type: 'negative', message: 'Prompt should not be null' })
        emit('hideDialog')
      }
    } else {
      $q.notify({ message: result?.error?.message, type: 'negative' })
      $q.loading.hide()
      emit('hideDialog')
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Fund deposit failed' })
    errorStore.throwError(errorMessage, error)
    emit('hideDialog')
    $q.loading.hide()
  }
}
</script>
