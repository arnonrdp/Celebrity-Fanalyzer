<template>
  <TheHeader :title="userStore.getUser?.role + ' ' + 'Panel'" />
  <q-page-container>
    <q-page class="absolute q-pt-sm q-pb-xl window-width" style="left: 0">
      <q-tabs active-color="primary" align="justify">
        <q-route-tab
          v-if="userStore.isAuthenticated"
          data-test="posts-tab"
          name="prompts"
          icon="view_list"
          :label="userStore.isEditorOrAbove ? 'Prompts & Entries' : 'Entries'"
          :to="{ name: 'admin.prompts' }"
        />
        <q-route-tab
          v-if="userStore.isAdmin"
          data-test="users-tab"
          name="users"
          :to="{ name: 'admin.users' }"
          icon="people"
          label="Users"
        />
        <q-route-tab
          v-if="userStore.isAuthenticated || userStore.isAdmin"
          name="advertises"
          :to="{ name: 'admin.advertises' }"
          icon="campaign"
          label="Advertises"
        />
        <q-route-tab
          v-if="userStore.isEditorOrAbove"
          data-test="feedbacks-tab"
          name="feedbacks"
          icon="feedback"
          label="Feedbacks"
          :to="{ name: 'admin.feedbacks' }"
          exact
        />

        <q-route-tab
          v-if="userStore.isAdmin"
          :to="{ name: 'admin.errors' }"
          exact
          data-test="errors-tab"
          name="errors"
          icon="error"
          label="Errors"
        />

        <q-route-tab
          v-if="userStore.isEditorOrAbove"
          data-test="reports-tab"
          name="reports"
          icon="report"
          label="Reports"
          :to="{ name: 'admin.reports' }"
        />
      </q-tabs>

      <q-dialog full-width position="bottom" v-model="prompt.dialog" data-test="prompt-dialog">
        <PromptCard v-bind="prompt" @hideDialog="prompt = {}" data-test="prompt-card" />
      </q-dialog>

      <q-dialog full-width position="bottom" v-model="entry.dialog" no-backdrop-dismiss no-refocus no-esc-dismiss data-test="entry-dialog">
        <EntryCard v-bind="entry" @hideDialog="entry = {}" data-test="entry-card" />
      </q-dialog>

      <q-dialog full-width position="bottom" v-model="advertise.dialog" data-test="advertise-dialog">
        <AdvertiseCard v-bind="advertise" @hideDialog="advertise = {}" data-test="advertise-card" />
      </q-dialog>

      <router-view @openPromptDialog="openPromptDialog" @openAdvertiseDialog="openAdvertiseDialog" />
    </q-page>
  </q-page-container>
</template>

<script setup>
import EntryCard from 'src/components/Admin/EntryCard.vue'
import PromptCard from 'src/components/Admin/PromptCard.vue'
import AdvertiseCard from 'src/components/Advertiser/AdvertiseCard.vue'
import TheHeader from 'src/components/shared/TheHeader.vue'
import { onMounted, ref, watch, onUnmounted } from 'vue'
import { useUserStore, useAdvertiseStore, useErrorStore } from 'src/stores'
import { useRoute, useRouter } from 'vue-router'

const userStore = useUserStore()

const entry = ref({})
const prompt = ref({})
const advertise = ref({})
const advertiseStore = useAdvertiseStore()
const errorStore = useErrorStore()
const currentPath = ref('')

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  advertiseStore.fetchAdvertises().catch((error) => errorStore.throwError(error))

  currentPath.value = router.currentRoute.value.path
  const adminTab = document.querySelector('.adminTab')
  const activeHomeTab = document.querySelector('[href="/"]')
  const handleHomeTabClasses = () => {
    activeHomeTab?.classList.remove('q-tab--active')
    activeHomeTab?.classList.remove('text-primary')
    activeHomeTab?.classList.add('q-tab--inactive')
  }
  if (router.currentRoute.value.fullPath.includes('/admin')) {
    setTimeout(() => {
      handleHomeTabClasses()
    }, 400)

    if (adminTab) {
      adminTab?.classList.add('admin_tab', 'cursor-pointer', 'q-router-link--active')
      adminTab?.classList.replace('q-tab--inactive', 'q-tab--active')
    }
  }

  watch(route, () => {
    if (router.currentRoute.value.fullPath.includes('/admin')) {
      setTimeout(() => {
        handleHomeTabClasses()
      }, 400)

      if (adminTab) {
        adminTab?.classList.add('admin_tab', 'cursor-pointer', 'q-router-link--active')
        adminTab?.classList.replace('q-tab--inactive', 'q-tab--active')
      }
    } else {
      activeHomeTab?.classList.remove('q-tab--inactive')
      adminTab?.classList.remove('admin_tab', 'cursor-pointer', 'q-router-link--active')
      adminTab?.classList.replace('q-tab--active', 'q-tab--inactive')
    }
  })
})

function openPromptDialog(props) {
  prompt.value = props?.id ? props : {}
  prompt.value.dialog = true
}

function openAdvertiseDialog(props) {
  advertise.value = props?.id ? props : {}
  advertise.value.dialog = true
}

onUnmounted(async () => {
  const adminTab = document.querySelector('.adminTab')
  const activeHomeTab = document.querySelector('[href="/"]')
  activeHomeTab?.classList.remove('q-tab--inactive')
  adminTab?.classList.remove('admin_tab', 'cursor-pointer', 'q-router-link--active')
  adminTab?.classList.replace('q-tab--active', 'q-tab--inactive')
})
</script>
