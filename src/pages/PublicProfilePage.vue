<template>
  <TheHeader v-if="user?.uid" ref="header" feedbackButton :title="user.role + ' Profile'" />
  <q-page-container>
    <q-page v-if="user?.uid">
      <q-card flat>
        <q-card-section class="flex items-center">
          <div class="flex items-center q-gutter-x-md">
            <q-avatar size="7rem">
              <template v-if="user.photoURL">
                <q-img :src="user.photoURL" />
              </template>
              <template v-else>
                <span class="q-avatar__content flex flex-center q-mx-auto bg-primary text-white">
                  {{ user.displayName.charAt(0).toUpperCase() }}
                </span>
              </template>
            </q-avatar>
            <h5 class="q-my-none" data-test="user-displayName">{{ user.displayName }}</h5>
          </div>
          <div class="col text-right">
            <span v-for="(socialNetwork, index) in socialNetworks" :key="index">
              <q-btn
                v-if="user[socialNetwork.name]"
                flat
                :data-test="socialNetwork.name + '-btn'"
                :href="normalizeRedirectUrl(user[socialNetwork.name], socialNetwork.link)"
                :icon="`img:/icons/${socialNetwork.name}.svg`"
                round
                target="_blank"
              />
            </span>
          </div>
        </q-card-section>
        <q-card-section>
          <p class="q-mb-none text-body1" style="white-space: pre-line">{{ user.bio }}</p>
        </q-card-section>
        <q-separator spaced inset />
        <q-card-section class="justify-center row">
          <div v-if="computedPosts.length === 0 && user?.uid === userStore.getUser?.uid" class="text-center q-mt-md">
            <p class="text-h6">It looks like you haven't created any entries yet.</p>
            <p>
              Start sharing your thoughts and experiences with the
              <b><i>Celebrity Fanalyzer!</i></b>
            </p>
            <q-btn label="Create Your First Entry" @click="header?.openEntryDialog()" color="primary" class="q-mt-md" rounded unelevated />
          </div>
          <div v-else-if="computedPosts.length === 0" class="text-center q-mt-md">
            <p class="text-h6">This user has not created any entries yet.</p>
          </div>
          <div
            v-else
            v-for="post in computedPosts"
            class="col-sm-4 col-xs-6"
            :key="post.id"
            @click="
              () => {
                post.slug
                  ? goToUrl(post.slug)
                  : $q.notify({
                      type: 'error',
                      message: 'Sorry. There is no link available for this entry at this time. Please contact support.'
                    })
              }
            "
          >
            <div class="cursor-pointer q-mx-xs">
              <q-img class="rounded-borders" height="12rem" :ratio="1" :src="post.image" />
              <p class="q-mb-none text-caption">{{ dayMonthYear(post.created) }} &bullet; {{ post.title }}</p>
              <span v-html="post.description.substring(0, 30)"></span>
              <span v-if="post.description.length > 30">...</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-page>
    <q-spinner v-else class="absolute-center" color="primary" size="3em" />
  </q-page-container>
</template>

<script setup>
import TheHeader from 'src/components/shared/TheHeader.vue'
import { useEntryStore, useErrorStore, usePromptStore, useUserStore } from 'src/stores'
import { dayMonthYear } from 'src/utils/date'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()

const entryStore = useEntryStore()
const errorStore = useErrorStore()
const promptStore = usePromptStore()
const userStore = useUserStore()
const $q = useQuasar()

const user = ref()
const header = ref(null)

const socialNetworks = [
  { name: 'facebook', link: 'https://www.facebook.com/' },
  { name: 'instagram', link: 'https://www.instagram.com/' },
  { name: 'linkedin', link: 'https://www.linkedin.com/in/' },
  { name: 'telegram', link: 'https://t.me/' },
  { name: 'x', link: 'https://x.com/' }
]

entryStore.fetchEntries().catch((error) => errorStore.throwError(error))
promptStore.fetchPrompts()

const computedPosts = computed(() => {
  return [
    ...(promptStore.getPrompts?.filter((prompt) => prompt.author?.uid === user.value.uid) || []),
    ...(entryStore.getEntries?.filter((entry) => entry.author?.uid === user.value.uid) || [])
  ].sort((a, b) => b.date - a.date)
})

userStore.getUserByUidOrUsername(router.currentRoute.value.params.username).then(async (res) => {
  user.value = res
  if (!res) {
    $q.notify({
      type: 'info',
      message: 'There is no user with the username: ' + router.currentRoute.value.params.username
    })
    setTimeout(async () => {
      $q.notify({
        type: 'info',
        message: 'You will be redirected in 3 seconds'
      })
    }, 3000)
    setTimeout(async () => {
      await router.push('/404')
    }, 6000)
  }
})

function goToUrl(link) {
  const normalizedLink = link.startsWith('/') ? link : `/${link}`
  router.push(normalizedLink)
}

function normalizeRedirectUrl(url, prefix) {
  url = url.trim()

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('www.')) {
    return `https://${url}`
  }

  if (url.match(/^(facebook|instagram|linkedin|twitter|x|t\.me)\.com/)) {
    return `https://www.${url}`
  }

  if (url.includes('profile.php') || url.includes('?id=')) {
    return prefix + url
  }

  return prefix + url
}
</script>
