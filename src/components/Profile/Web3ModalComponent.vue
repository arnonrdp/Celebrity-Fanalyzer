<template>
  <div v-if="page_name == 'profile'">
    <div class="text-right" v-if="isConnected">
      <div class="q-pa-md q-gutter-sm">
        <q-btn
          icon="edit"
          flat
          dense
          @click.prevent.stop="updateWalletInfo()"
          color="primary"
          label=""
          data-test="Open Connect Modal"
          size="sm"
        >
          <q-tooltip>Add new wallet</q-tooltip>
        </q-btn>
      </div>
    </div>
    <div class="text-right" v-if="!isConnected">
      <div class="q-pa-md q-gutter-sm">
        <q-btn
          :icon="userStore.getUser?.['walletAddress'] ? 'edit' : 'add_circle'"
          @click.prevent.stop="!userStore.getUser.walletAddress ? updateWalletInfo() : onChangeWalletAddressDialog()"
          color="primary"
          label=""
          data-test="Open Connect Modal"
          size="sm"
          flat
          dense
        >
          <q-tooltip>{{ userStore.getUser?.['walletAddress'] ? 'Change wallet' : 'Connect wallet' }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
  <q-dialog v-model="changeWalletAddressDialog.show">
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Wallet address change</h6>
      </q-card-section>
      <q-card-section>
        <span class="q-ml-sm">Are you sure you want to set this as your new wallet address?</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" data-test="cancel-address-change" label="Cancel" v-close-popup />
        <q-btn color="negative" data-test="confirm-remove-wallet" label="Confirm" @click.prevent.stop="updateWalletInfo()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { customWeb3modal } from 'src/web3/walletConnect'
import { computed, ref } from 'vue'
import { useWalletStore, useUserStore } from 'app/src/stores'
import { Notify } from 'quasar'

const walletStore = useWalletStore()
const userStore = useUserStore()
const changeWalletAddressDialog = ref({ show: false })

function onChangeWalletAddressDialog() {
  changeWalletAddressDialog.value.show = true
}

//let's define props
defineProps({
  page_name: {
    type: String,
    default: 'profile'
  }
})

const address = computed(() => {
  return customWeb3modal.getAddress()
})

const chainId = computed(() => {
  return customWeb3modal.getChainId()
})

const isConnected = computed(() => {
  return customWeb3modal.getIsConnected()
})

async function updateWalletInfo() {
  changeWalletAddressDialog.value.show = false

  await customWeb3modal.open()
  if (chainId.value) {
    walletStore.setNetworkId(chainId.value)
  }
  if (address.value) {
    walletStore.setWalletAddress(address.value)
    await saveWalletAddress()
  }
}

function handleChange({ provider, providerType, address, error, chainId, isConnected }) {
  if (address) {
    walletStore.setWalletAddress(address)
    saveWalletAddress()
  }
}

async function saveWalletAddress() {
  const currentWalletAddress = walletStore.getWalletInfo.wallet_address
  if (currentWalletAddress && currentWalletAddress !== userStore.getUser.walletAddress) {
    userStore.getUser.walletAddress = currentWalletAddress
    try {
      await userStore.updateProfile(userStore.getUser)
      Notify.create({
        message: 'Wallet address saved successfully. You will receive payments on this address.',
        type: 'positive'
      })
    } catch (error) {
      console.error(error)
      Notify.create({ message: 'Error saving wallet address', type: 'negative' })
    }
  }
}

customWeb3modal.subscribeProvider(handleChange)
</script>
