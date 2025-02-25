<template>
  <q-input v-model="userStore.getUser.email" disable label="Email" data-test="profile-email" />
  <q-btn class="full-width q-mt-lg" color="secondary" data-test="logout-button" label="Logout" padding="12px" rounded @click="onLogout" />

  <q-btn
    class="full-width q-mt-lg"
    color="negative"
    data-test="delete-account-button"
    label="Delete Account"
    padding="12px"
    rounded
    @click="openDeleteConfirmationDialog"
  />

  <q-dialog v-model="deleteDialog.show" data-test="delete-account-dialog">
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Delete Account?</h6>
      </q-card-section>
      <q-card-section data-test="delete-confirmation-message">
        Hi
        <strong data-test="user-display-name">{{ userStore.getUser.displayName }}</strong>
        , are you sure you want to delete your account? This action is irreversible.
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="confirmationText"
          label="Type DELETE to confirm"
          filled
          data-test="delete-confirmation-input"
          :rules="[(val) => val === 'DELETE' || 'You must type DELETE to confirm']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn
          data-test="delete-button"
          flat
          label="Delete"
          color="negative"
          :disable="confirmationText !== 'DELETE'"
          @click="onDeleteAccount"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useUserStore } from 'app/src/stores'
import { useRouter } from 'vue-router'
import { customWeb3modal } from 'src/web3/walletConnect'
import { ref } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const deleteDialog = ref({
  show: false,
  author: userStore.getUser
})
const confirmationText = ref('')

function onLogout() {
  if (customWeb3modal.getAddress()) {
    customWeb3modal.disconnect()
  }
  userStore.logout()
  router.push({ path: '/profile' })
}

function openDeleteConfirmationDialog() {
  deleteDialog.value.show = true
  confirmationText.value = ''
}

async function onDeleteAccount() {
  try {
    await userStore.deleteOwnAccount()
    router.push({ path: '/profile' })
  } catch (error) {
    console.error('Account deletion failed:', error)
  } finally {
    deleteDialog.value.show = false
  }
}
</script>
