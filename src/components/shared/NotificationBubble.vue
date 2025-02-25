<template>
  <q-btn color="secondary" dense flat icon="notifications" round size="1rem" data-test="notification-bubble-btn">
    <q-tooltip>Notifications</q-tooltip>
    <q-badge v-if="unreadNotifications.length" color="red" floating rounded data-test="notification-badge">
      {{ unreadNotifications.length }}
    </q-badge>
    <q-menu v-if="notificationStore.getNotifications.length" anchor="bottom right" self="top right">
      <q-separator spaced />
      <q-item style="min-width: 320px">
        <q-item-section class="text-center">
          <q-btn class="no-wrap" color="primary" dense label="Mark all as read" outline @click="markAllAsRead" />
        </q-item-section>
        <q-item-section>
          <q-btn color="primary" dense label="Clear all" outline @click="deleteAll" />
        </q-item-section>
      </q-item>
      <q-item
        v-for="notification in notificationStore.getNotifications"
        class="non-selectable"
        :key="notification.id"
        data-test="notification-item"
      >
        <q-item-section side>
          <q-icon
            class="cursor-pointer"
            :color="notification.read ? 'white' : 'blue'"
            name="circle"
            size="0.75rem"
            @click="markOneAsRead(notification.id)"
            data-test="notification-read-icon"
          />
        </q-item-section>
        <q-item-section class="cursor-pointer" @click="goToLink(notification)" data-test="notification-message">
          {{ notification.message }}
        </q-item-section>
        <q-item-section side>
          <q-btn flat icon="clear" round size="sm" @click="deleteOne(notification.id)" data-test="notification-clear-btn" />
        </q-item-section>
      </q-item>
    </q-menu>
    <q-menu v-else>
      <q-item>
        <q-item-section class="text-center">
          <p class="q-my-sm text-body2" data-test="no-notifications-message">There are no notifications</p>
        </q-item-section>
      </q-item>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { useEntryStore, useNotificationStore, usePromptStore } from 'app/src/stores'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const entryStore = useEntryStore()
const notificationStore = useNotificationStore()
const promptStore = usePromptStore()

onMounted(async () => {
  await notificationStore.readList()
})

const unreadNotifications = computed(() => notificationStore.getNotifications.filter((notification) => !notification.read))

function markOneAsRead(id) {
  if (unreadNotifications.value.some((i) => i.id === id)) {
    notificationStore.markOneAsRead(id)
  }
}

function markAllAsRead() {
  notificationStore.markAllAsRead()
}

function goToLink(notification) {
  markOneAsRead(notification.id)

  if (notification.type === 'comment') {
    markAllAsRead(notification.link)
  }
  if (notification.collection === 'prompts') {
    router.push(notification.link || '/')
    promptStore.setTab('comments')
  }
  if (notification.collection === 'entries') {
    const entry = notification.slug || notification.link.slice(0, 8) + '/' + notification.link.slice(8) + '_id'
    router.push(entry)
    entryStore.setTab('comments')
  }
}

function deleteOne(id) {
  notificationStore.deleteOne(id)
}

function deleteAll() {
  notificationStore.deleteAll()
}
</script>
