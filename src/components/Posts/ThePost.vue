<template>
  <q-page-container style="padding-bottom: 0">
    <q-page class="bg-white" style="min-height: auto">
      <TheHeader feedbackButton :title="title" />
      <q-responsive :ratio="1" v-if="!isAdd" :style="{ backgroundImage: `url(${post?.image})` }">
        <div class="bg-blur flex cursor-pointer">
          <q-img
            fit="contain"
            ratio="1"
            spinner-color="primary"
            :src="post?.image"
            :srcset="`${post.image} 2x`"
            sizes="(max-width: 560) 50vw, 100vw"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            @click.stop="openDialog = true"
          />
        </div>
      </q-responsive>
      <div v-else-if="post.contentURL" class="bg-blur flex">
        <q-img class="rounded-borders full-width height-auto q-mt-lg" :src="post.contentURL" />
      </div>
      <q-dialog v-model="openDialog" ref="dialogRef" backdrop-filter="blur(1px)" auto-close>
        <q-img
          style="max-height: 100%; height: fit-content; max-width: 90vw; width: 90rem; cursor: pointer"
          fit="contain"
          ratio="1"
          spinner-color="primary"
          :src="post?.image"
          :srcset="`${post.image} 2x`"
          sizes="(max-width: 560) 50vw, 100vw"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      </q-dialog>
      <section class="q-pa-md q-pb-none" :class="{ 'margin-bottom': isAdd }">
        <div class="flex justify-between">
          <p class="text-body2">
            {{ isPrompt ? `Prompt of ${formatMonthYear(post?.date || 'unknown')}` : `Posted on ${dayMonthYear(post.created)}` }}
          </p>
          <div v-show="!isAdd">
            <q-badge v-for="(category, index) of post?.categories" class="q-mx-xs" :key="index" rounded>
              {{ category }}
            </q-badge>
          </div>
        </div>
        <h1 class="q-mt-none text-bold text-h5" data-test="post-title">{{ post?.title }}</h1>
        <q-separator spaced />
        <section
          v-if="post?.author && !isAdd"
          class="cursor-pointer flex column items-start no-wrap q-pa-md"
          data-test="author-section"
          @click="router.push(`/fan/${props.post.author.username || props.post.author.uid}`)"
        >
          <div class="flex row items-center">
            <q-avatar size="4rem">
              <q-img
                :src="post.author.photoURL ? post.author.photoURL : '/icons/user_raiting_premium_member.svg'"
                :srcset="post.author.photoURL"
                :width="post.author.photoURL ? 'null' : '50px'"
              />
            </q-avatar>
            <div>
              <p class="text-body1 text-bold q-mb-none q-ml-md text-capitalize">{{ post.author.displayName }}</p>
              <div class="flex q-ml-md">
                <!--                <q-rating-->
                <!--                  v-model="userRating"-->
                <!--                  max="5"-->
                <!--                  size="1.4rem"-->
                <!--                  color="yellow"-->
                <!--                  icon="star_border"-->
                <!--                  icon-selected="star"-->
                <!--                  icon-half="star_half"-->
                <!--                  no-dimming-->
                <!--                  readonly-->
                <!--                />-->
              </div>
            </div>
          </div>

          <p v-if="props.post.author.bio" class="q-mb-none q-mt-md text-italic" style="white-space: pre-line">
            {{ post.author.bio }}
          </p>
        </section>
        <q-separator v-if="!isAdd" spaced />
        <p v-if="isAdd" v-html="post?.content" class="q-mt-sm text-body1"></p>
        <p v-else class="q-mt-md text-body1" v-html="post?.description"></p>
        <ShowcaseArt v-if="post?.showcase?.arts?.length" :showcase="post.showcase" />
        <q-separator v-if="!isAdd" inset />
        <div class="text-center q-pt-md">
          <q-btn
            color="green"
            :data-test="!likeStore._isLoading && likeStore.getLikes ? 'like-button' : ''"
            flat
            :icon="
              likeStore.getLikes?.find((like) => like.id === userStore.getUserId)
                ? 'img:/icons/thumbs-up-bolder.svg'
                : 'img:/icons/thumbs-up.svg'
            "
            :label="likeStore.getLikes?.length || 0"
            rounded
            size="0.75rem"
            @click="like()"
          >
            <q-tooltip anchor="bottom middle" self="center middle">Like</q-tooltip>
          </q-btn>
          <q-btn
            color="red"
            :data-test="!likeStore._isLoading && likeStore.getDislikes ? 'dislike-button' : ''"
            flat
            :icon="
              likeStore.getDislikes?.find((dislike) => dislike.id === userStore.getUserId)
                ? 'img:/icons/thumbs-down-bolder.svg'
                : 'img:/icons/thumbs-down.svg'
            "
            :label="likeStore.getDislikes?.length || 0"
            rounded
            size="0.75rem"
            @click="dislike()"
          >
            <q-tooltip anchor="bottom middle" self="center middle">Dislike</q-tooltip>
          </q-btn>
          <q-btn
            data-test="comments"
            flat
            icon="chat_bubble_outline"
            :label="commentStore.getCommentsCount"
            rounded
            size="0.75rem"
            @click="$emit('clickComments')"
          >
            <q-tooltip anchor="bottom middle" self="center middle">Comments</q-tooltip>
          </q-btn>
          <ShareComponent :label="shareStore.getShares ? shareStore.getShares : 0" :disable="shareStore.isLoading" @share="share($event)" />
          <q-btn
            v-if="isAdd && post?.productLink"
            flat
            icon="open_in_new"
            rounded
            size="0.75rem"
            :href="getFormattedLink(post?.productLink)"
            replace
            target="_blank"
          >
            <q-tooltip anchor="bottom middle" self="center middle">{{ getFormattedLink(post?.productLink) }}</q-tooltip>
          </q-btn>

          <q-btn
            v-if="userStore.isAuthenticated && !isAdd"
            color="blue"
            flat
            :icon="userStore.getUser.subscriptions?.includes(props.post?.id) ? 'notifications' : 'notifications_none'"
            :label="props.post?.subscribers?.length || 0"
            rounded
            size="0.75rem"
            @click="subscribe"
          >
            <q-tooltip>{{ userStore.getUser.subscriptions?.includes(props.post.id) ? 'Subscribed' : 'Subscribe' }}</q-tooltip>
          </q-btn>
          <q-btn v-if="showEdit" color="blue" flat icon="edit" rounded size="0.75rem" @click="manageEdit" data-test="edit">
            <q-tooltip>Edit {{ isPrompt ? 'Prompt' : isAdd ? 'Advertise' : 'Entry' }}</q-tooltip>
          </q-btn>
        </div>
      </section>
    </q-page>
  </q-page-container>
</template>

<script setup>
import TheHeader from 'src/components/shared/TheHeader.vue'
import {
  useCommentStore,
  useErrorStore,
  useLikeStore,
  useNotificationStore,
  usePromptStore,
  useShareStore,
  useStatStore,
  useStorageStore,
  useUserStore,
  useVisitorStore
} from 'src/stores'
import { dayMonthYear, formatMonthYear } from 'src/utils/date'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import ShareComponent from './ShareComponent.vue'
import ShowcaseArt from './ShowcaseArt.vue'
import { getFormattedLink } from '../../utils/getFormattedLink'

const props = defineProps(['collectionName', 'post', 'title', 'isAdd', 'showEdit'])
const emit = defineEmits(['clickComments', 'openPromptDialog', 'openAdvertiseDialog', 'openEntryDialog'])

const router = useRouter()

const commentStore = useCommentStore()
const errorStore = useErrorStore()
const likeStore = useLikeStore()
const notificationStore = useNotificationStore()
const shareStore = useShareStore()
const userStore = useUserStore()
const visitorStore = useVisitorStore()
const statsStore = useStatStore()
const promptStore = usePromptStore()
const dialogRef = ref(false)
const openDialog = ref(false)

// const userRating = ref(0)
const isPrompt = !!props.post?.entries
const isEntry = props.post?.prompt
const id = props.post.id
const userId = userStore.getUserId ? userStore.getUserId : userStore.getUserIpHash
const userLocation = userStore.getUser?.location || userStore.getUserLocation
onMounted(async () => {
  await statsStore.addUser(userId, userLocation)

  if (props.post?.id) {
    await commentStore.getTotalComments(props.collectionName, props.post?.id)
  }
  if (!props.isAdd || props.post?.status === 'Active') {
    await visitorStore.addVisitor(props.collectionName, props.post.id).catch((error) => errorStore.throwError(error))
  }
})

watchEffect(async () => {
  if (isPrompt) {
    await statsStore.addTopic(props.post?.id, props.post.author?.uid, props.post?.title, props.post?.description, props.post?.categories)
  }

  if (isEntry) {
    const promptId = props.post.prompt?.id
      ? props.post.prompt?.id
      : promptStore.getPrompts?.filter((prompt) => prompt.entries.includes(props.post.id))[0]?.id
    await statsStore.addArticle(props.post?.id, promptId, props.post.author?.uid, props.post?.title, props.post.description)
  }

  if (props.isAdd) {
    await statsStore.addAdvertisement(
      props.post.id,
      props.post.author?.uid,
      props.post.title,
      props.post.content,
      props.post.budget,
      props.post.duration
    )
  }
})

async function like() {
  if (likeStore._isLoading) return

  const userLikeIndex = likeStore._likes?.findIndex((like) => like.id === userId)

  if (userLikeIndex !== -1) {
    likeStore._likes?.splice(userLikeIndex, 1)
  } else {
    likeStore._dislikes = likeStore._dislikes?.filter((dislike) => dislike.id !== userId)
    likeStore._likes.push({ id: userId })
  }

  if (isPrompt) {
    await likeStore.addLike(props.collectionName, id, null, id, null).catch((error) => errorStore.throwError('Error adding like', error))
  } else if (props.isAdd) {
    await likeStore
      .addLike(props.collectionName, props.post.id, null, null, id)
      .catch((error) => errorStore.throwError('Error adding like', error))
  } else {
    await likeStore
      .addLike(props.collectionName, id, id, props.post?.prompt?.id, null)
      .catch((error) => errorStore.throwError('Error adding like', error))
  }
}

async function dislike() {
  if (likeStore._isLoading) return
  const userDislikeIndex = likeStore._dislikes?.findIndex((dislike) => dislike.id === userId)
  if (userDislikeIndex !== -1) {
    likeStore._dislikes?.splice(userDislikeIndex, 1)
  } else {
    likeStore._likes = likeStore._likes?.filter((like) => like.id !== userId)
    likeStore._dislikes?.push({ id: userId })
  }

  if (isPrompt) {
    await likeStore.addDislike(props.collectionName, id, null, id, null).catch((error) => errorStore.throwError('Error adding like', error))
  } else if (props.isAdd) {
    await likeStore
      .addDislike(props.collectionName, props.post.id, null, null, id)
      .catch((error) => errorStore.throwError('Error adding like', error))
  } else {
    await likeStore
      .addDislike(props.collectionName, id, id, props.post?.prompt?.id, null)
      .catch((error) => errorStore.throwError('Error adding like', error))
  }
}

async function share(socialNetwork) {
  await shareStore.addShare(props.collectionName, props.post.id, socialNetwork).catch((error) => errorStore.throwError(error))
}

async function subscribe() {
  await notificationStore.toggleSubscription(props.collectionName, props.post.id).catch((error) => errorStore.throwError(error))
}

function manageEdit() {
  if (props.isAdd) {
    emit('openAdvertiseDialog')
  } else if (isPrompt) {
    emit('openPromptDialog')
  } else if (isEntry) {
    emit('openEntryDialog')
  }
}

// watchEffect(async () => {
//   if (statsStore.getUserRate) {
//     userRating.value = (statsStore.getUserRate / 100) * 5
//   }
// })
</script>

<style scoped lang="scss">
// add a blur effect to the background image
.bg-blur {
  backdrop-filter: blur(60px);
}

.margin-bottom {
  margin-bottom: 6rem;
}
</style>
