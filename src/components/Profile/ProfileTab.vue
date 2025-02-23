<template>
  <q-form class="q-gutter-y-md" greedy @submit="save">
    <div class="flex items-center no-wrap">
      <q-avatar size="5rem" text-color="white" class="q-mt-lg" data-test="avatar-upload">
        <template v-if="storageStore.isLoading">
          <q-spinner color="primary" size="3rem" />
        </template>
        <template v-else-if="user.photoURL">
          <q-img :src="user.photoURL" spinner-color="primary" spinner-size="3rem">
            <div class="photo" @click="openUploadDialog">
              <q-icon class="absolute-center q-mx-auto" color="grey-6" name="upload" />
            </div>
          </q-img>
        </template>
        <template v-else>
          <div class="photo" @click="openUploadDialog">
            <q-icon class="absolute-center q-mx-auto" color="grey-6" name="upload" />
            <div class="q-avatar__content flex flex-center q-mx-auto bg-primary text-white">
              {{ user.displayName.charAt(0).toUpperCase() }}
            </div>
          </div>
        </template>
      </q-avatar>
      <q-input
        class="col-grow q-pl-sm q-mt-lg"
        label="Name"
        required
        :rules="[(val) => val.length || 'Name is required']"
        data-test="input-name"
        v-model="user.displayName"
      />
    </div>
    <q-input
      class="non-selectable"
      debounce="400"
      label="Username"
      data-test="input-user-name"
      :rules="[(val) => usernameValidator(val)]"
      v-model.trim="user.username"
    >
      <template v-slot:append>
        <q-btn
          v-if="userStore.getUser?.username && isUsernameSame"
          flat
          icon="content_copy"
          data-test="button-username-copy"
          round
          size="sm"
          @click="copyLink"
        >
          <q-tooltip>Copy</q-tooltip>
        </q-btn>
        <q-btn
          v-if="userStore.getUser?.username && isUsernameSame"
          flat
          icon="open_in_new"
          round
          size="sm"
          @click="openUserProfile"
          data-test="button-username-view-profile"
        >
          <q-tooltip>View Profile</q-tooltip>
        </q-btn>
      </template>
    </q-input>
    <div>
      <span class="text-h8 text-bold text-secondary">Wallet address</span>
      <q-input class="non-selectable" debounce="400" label="Current Connected wallet Address" v-model.trim="walletAddress" readonly>
        <Web3ModalComponent page_name="profile" />
        <q-btn
          v-if="user.walletAddress || currentWalletAddress"
          color="negative"
          :icon="'delete'"
          size="sm"
          class="self-center"
          flat
          dense
          @click="onDeleteWalletAddressDialog"
        >
          <q-tooltip>Delete</q-tooltip>
        </q-btn>
      </q-input>
    </div>
    <q-input counter label="Bio" maxlength="1000" type="textarea" data-test="input-bio" v-model="user.bio" />

    <h3 class="q-mt-xl text-bold text-h5 text-secondary">Social Networks</h3>
    <q-input
      v-for="network in socialNetworks"
      :key="network.name"
      :label="capitalize(network.name)"
      :placeholder="network.link"
      :data-test="'input-' + network.name"
      :model-value="user[network.name]"
      @update:model-value="(val) => (user[network.name] = val.replace(/\s+/g, ''))"
    />

    <q-btn class="full-width q-my-lg" color="primary" label="Save" padding="12px" data-test="button-submit" rounded type="submit" />
  </q-form>

  <q-dialog v-model="uploadDialog.show" persistent data-test="upload-dialog">
    <q-card style="max-width: 300px; width: 100%">
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Upload Profile Picture</h6>
      </q-card-section>

      <q-card-section class="q-pa-none" style="text-align: center; padding: 20px">
        <q-img
          v-if="previewImage"
          :src="previewImage"
          class="q-mb-md"
          spinner-color="primary"
          spinner-size="5rem"
          data-test="upload-preview"
          style="height: 200px; width: 200px; object-fit: cover; border-radius: 50%; border: 2px solid #ddd"
        />
        <div v-else class="q-mb-md">
          <q-avatar size="11rem" text-color="white" class="q-mt-lg">
            <div class="q-avatar__content flex flex-center q-mx-auto bg-primary text-white">
              {{ user.displayName.charAt(0).toUpperCase() }}
            </div>
          </q-avatar>
        </div>
      </q-card-section>

      <q-card-section style="min-height: 100px; padding: 10px">
        <q-file
          v-model="newPhoto"
          accept="image/*"
          :label="previewImage ? 'Change your profile picture' : 'Choose your profile picture'"
          max-file-size="5242880"
          style="height: 5rem"
          @rejected="onRejected"
          @update:model-value="changePhoto()"
          class="q-mb-md q-mb-lg"
          dense
          filled
          bottom-slots
          data-test="upload-file-input"
        ></q-file>
      </q-card-section>

      <q-card-actions align="center" class="q-gutter-sm">
        <div style="width: 100%; display: flex; justify-content: space-between">
          <q-btn color="primary" label="Cancel" v-close-popup style="flex: 1; margin-right: 10px" />
          <q-btn
            color="negative"
            label="Delete"
            v-close-popup
            :disable="!Boolean(newPhoto || previewImage)"
            @click="deleteImage"
            style="flex: 1; margin-right: 10px"
            data-test="upload-delete-btn"
          />
          <q-btn color="primary" label="Save" v-close-popup @click="uploadPhotoToDB" style="flex: 1" data-test="upload-save-btn" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="removeWalletAddressDialog.show">
    <q-card>
      <q-card-section class="q-pb-none">
        <h6 class="q-my-sm">Remove wallet address</h6>
      </q-card-section>
      <q-card-section>
        <span class="q-ml-sm">Are you sure you want to remove your wallet address?</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="primary" label="Cancel" v-close-popup />
        <q-btn color="negative" data-test="confirm-remove-wallet" label="Remove" v-close-popup @click="onRemoveWalletAddress" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useErrorStore, useStorageStore, useUserStore } from 'app/src/stores'
import { Notify, useQuasar } from 'quasar'
import { computed, ref, watch, onMounted } from 'vue'
import Web3ModalComponent from './Web3ModalComponent.vue'
import { useWalletStore } from 'app/src/stores'
import { customWeb3modal } from 'src/web3/walletConnect'

const walletStore = useWalletStore()
const errorStore = useErrorStore()
const storageStore = useStorageStore()
const userStore = useUserStore()
const $q = useQuasar()

const currentWalletAddress = computed(() => walletStore.getWalletInfo.wallet_address)
const newPhoto = ref(null)
const origin = window.location.origin + '/'
const user = ref(JSON.parse(JSON.stringify(userStore.getUser)))
const addressUpdated = ref(false)
const removeWalletAddressDialog = ref({ show: false })
const isUpdate = ref(false)
const uploadDialog = ref({ show: false })
const previewImage = ref(null)

const socialNetworks = [
  { name: 'facebook', link: 'https://www.facebook.com/' },
  { name: 'instagram', link: 'https://www.instagram.com/' },
  { name: 'linkedin', link: 'https://www.linkedin.com/in/' },
  { name: 'telegram', link: 'https://t.me/' },
  { name: 'x', link: 'https://x.com/' }
]

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

watch([currentWalletAddress, user], () => {
  isUpdate.value = !!user.value.walletAddress
})

const walletAddress = computed(() => {
  return user.value.walletAddress || currentWalletAddress.value
})

onMounted(() => {
  if (userStore?.getUser?.photoURL) {
    previewImage.value = userStore.getUser.photoURL
  }
})

function onRejected() {
  Notify.create({ type: 'negative', message: 'File size is too big. Max file size is 5MB.' })
}

async function uploadPhotoToDB() {
  if (newPhoto.value) {
    await storageStore
      .uploadFile(newPhoto.value, `users/${userStore.getUser.uid}`)
      .then((url) => {
        user.value.photoURL = url
        previewImage.value = url
      })
      .catch((error) => errorStore.throwError(error))
  }
  save()
}

function changePhoto() {
  previewImage.value = ''
  if (!newPhoto.value) {
    return
  }
  const reader = new FileReader()
  reader.readAsDataURL(newPhoto.value)
  reader.onload = () => (previewImage.value = reader.result)
}

async function usernameValidator(username) {
  if (!username) return true
  if (!/\w{3,20}$/.test(username)) return 'Username must be between 3 and 20 characters long'
  const isAvailable = !(await userStore.checkUsernameAvailability(username))
  if (!isAvailable) return 'Username already taken'
}

function copyLink() {
  navigator.clipboard.writeText(origin + 'fan/' + user.value.username)
  Notify.create({ type: 'positive', message: 'Link copied to clipboard' })
}

function switchAddressUpdated(value) {
  addressUpdated.value = value
}

function openUserProfile() {
  window.open(`${origin}fan/${user.value.username}`, '_blank', 'noopener, noreferrer')
}

const isUsernameSame = computed(() => {
  return userStore.getUser?.username === user.value.username
})

function openUploadDialog() {
  uploadDialog.value.show = true
}

function onDeleteWalletAddressDialog() {
  removeWalletAddressDialog.value.show = true
}

function deleteImage() {
  previewImage.value = null
  newPhoto.value = null
  if (userStore.getUser?.photoURL?.length) {
    user.value.photoURL = ''
    save()
  }
}

function onRemoveWalletAddress() {
  user.value.walletAddress = ''
  walletStore.getWalletInfo.wallet_address = ''
  removeWalletAddressDialog.value.show = false
  customWeb3modal.disconnect()
  save()
  $q.notify({ message: 'Wallet address removed', type: 'negative' })
}

function save() {
  if (currentWalletAddress.value && addressUpdated.value === true) {
    user.value.walletAddress = currentWalletAddress.value
  }

  userStore
    .updateProfile(user.value)
    .then(() => {
      switchAddressUpdated(false)
      $q.notify({ message: 'Profile successfully updated', type: 'positive' })
    })
    .catch((error) => errorStore.throwError(error, 'Error updating profile'))
}
</script>

<style scoped lang="scss">
.photo {
  background-color: transparent;
  height: 100%;
  transition: all 0.3s;
  width: 100%;

  & .q-icon {
    display: none;
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.5);

    & .q-icon {
      display: block;
    }
  }
}
</style>
