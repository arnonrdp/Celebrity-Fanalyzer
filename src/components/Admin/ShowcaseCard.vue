<template>
  <section class="text-center">
    <q-input
      autogrow
      class="col-grow q-pb-xl"
      hint="Max length 180 characters (optional)"
      label="Artist info"
      data-test="artist-info-input"
      v-model="modelArtistInfo"
      @update:model-value="addArtistInfo"
      maxlength="180"
    />
    <q-file
      class="hidden"
      ref="artistFileRef"
      v-model="modelFileArtist"
      @update:model-value="addArtistPhoto"
      :filter="checkFileSize"
      @rejected="onRejected"
      accept="image/*"
      data-test="upload-artist-photo"
    />
    <q-btn flat icon="add_circle_outline" label="Upload Artist Photo" rounded @click="onUploadArtist" />
    <div v-if="modelArtistPhoto" class="items-center no-wrap q-my-md q-pa-md rounded-borders col shadow-1">
      <q-spinner v-if="storageStore.isLoading && !modelArtistPhoto" class="q-mx-auto" color="primary" size="3em" style="width: 50%" />
      <q-img
        v-else
        class="artist-img q-mr-md rounded-borders"
        fit="contain"
        :src="modelArtistPhoto"
        spinner-color="primary"
        data-test="author-image"
      />
    </div>

    <q-file
      class="hidden"
      ref="artsFileRef"
      v-model="modelFileArt"
      @update:model-value="addArts"
      :filter="checkFileSize"
      @rejected="onRejected"
      accept="image/*"
      multiple
      :max-files="10"
      data-test="upload-arts"
    />
    <q-btn flat icon="add_circle_outline" label="Upload Art" rounded @click="onUploadArts">
      <q-tooltip>Max 10 Images</q-tooltip>
    </q-btn>
    <div v-if="modelArts.length" class="items-center q-my-md q-pa-md rounded-borders row shadow-1">
      <q-spinner v-if="storageStore.isLoading && !modelArts.length" class="q-mx-auto" color="primary" size="3em" />
      <div v-for="(art, index) in modelArts" class="art-img q-ma-xs relative-position" :key="index">
        <q-img class="rounded-borders" fit="cover" :ratio="1" :src="art" style="width: 10rem" data-test="arts-images" />
        <q-btn class="trash-icon" color="negative" icon="delete" round size="sm" @click="removeArt(art)" data-test="remove-art-btn" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { useErrorStore, useStorageStore } from 'src/stores'
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { uploadAndSetImage } from 'src/utils/imageConvertor'
import { uid } from 'quasar'

const props = defineProps(['arts', 'artist', 'collectionName', 'date', 'entryTitle'])
const emit = defineEmits(['update:arts', 'update:artist', 'updateRecentUploads', 'updateRecentArtistImage'])

const errorStore = useErrorStore()
const storageStore = useStorageStore()

const artsFileRef = ref(null)
const artistFileRef = ref(null)
const modelArts = ref(props.arts || [])
const modelArtistInfo = ref(props.artist.info)
const modelArtistPhoto = ref(props.artist.photo)
const modelFileArt = ref(null)
const modelFileArtist = ref(null)
const $q = useQuasar()

function onUploadArts() {
  artsFileRef.value.pickFiles()
}

function onUploadArtist() {
  artistFileRef.value.pickFiles()
}

function checkFileSize(files) {
  return files.filter((file) => file.size > 2048)
}

function onRejected(rejectedEntries) {
  $q.notify({
    type: 'negative',
    message: `${rejectedEntries.length} file(s) did not pass validation constraints`
  })
}

async function addArts(files) {
  const maxImages = 10
  const remainingImages = maxImages - modelArts.value.length

  if (remainingImages <= 0) {
    $q.notify({ type: 'negative', message: `You can only upload ${maxImages} images` })
    await errorStore.throwError(`You can only upload ${maxImages} images`)
    return
  }

  const filesToUpload = files.slice(0, remainingImages)

  for (const index in filesToUpload) {
    const uploaded = await uploadAndSetImage(filesToUpload[index], `images/${props.collectionName}-${props.date}-${uid()}`)
    modelArts.value.push(uploaded)
    emit('updateRecentUploads', uploaded)
  }

  emit('update:arts', modelArts.value)

  if (filesToUpload.length < files.length) {
    $q.notify({
      type: 'negative',
      message: `${filesToUpload.length} file(s) were uploaded. You can upload maximum 10 images`
    })
  }
}

function removeArt(file) {
  const index = modelArts.value.indexOf(file)
  const imgId = file.match(/entry-[^?\/]+/)
  storageStore
    .deleteFile(`images/${imgId}`)
    .then(() => modelArts.value.splice(index, 1))
    .catch((error) => errorStore.throwError(error))
  emit('update:arts', modelArts.value)
}

async function addArtistPhoto(files) {
  modelArtistPhoto.value = ''
  modelArtistPhoto.value = await uploadAndSetImage(files, `images/${props.collectionName}-${props.date}-artist`)
  emit('update:artist', { ...props.artist, photo: modelArtistPhoto.value })
  emit('updateRecentArtistImage', modelArtistPhoto.value)
}

function addArtistInfo() {
  emit('update:artist', { ...props.artist, info: modelArtistInfo.value })
}
</script>

<style lang="scss" scoped>
.trash-icon {
  position: absolute;
  right: -5px;
  top: -5px;
  visibility: hidden;
  z-index: 1;
}

.art-img:hover .trash-icon {
  visibility: visible;
}

.artist-img {
  max-height: 12rem;
  max-width: 50%;
}
</style>
