import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from 'src/firebase'
import { useEntryStore, usePromptStore, useUserStore } from 'src/stores'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    _isLoading: false,
    _notifications: []
  }),

  // persist: true,

  getters: {
    getNotifications: (state) => state._notifications,
    isLoading: (state) => state._isLoading
  },

  actions: {
    async toggleSubscription(collectionName, documentId) {
      const promptStore = usePromptStore()
      const entryStore = useEntryStore()
      const userStore = useUserStore()

      this._isLoading = true
      await runTransaction(db, async (transaction) => {
        const addToArray = (array, element) => [...array, element]
        const removeFromArray = (array, element) => array?.filter((item) => item !== element) ?? []

        if (userStore.getUser.subscriptions?.includes(documentId)) {
          transaction.update(doc(db, collectionName, documentId), { subscribers: arrayRemove(userStore.getUser.uid) })
          transaction.update(userStore.getUserRef, { subscriptions: arrayRemove(documentId) })

          // TODO : This is not a good practice to update a store outside of the store
          userStore._user.subscriptions = removeFromArray(userStore.getUser.subscriptions, documentId)

          if (collectionName === 'prompts') {
            promptStore._monthPrompt = promptStore.getMonthPrompt?.map((prompt) =>
              prompt.id === documentId
                ? { ...prompt, subscribers: removeFromArray(prompt.subscribers || [], userStore.getUser.uid) }
                : prompt
            )

            promptStore._prompts = promptStore.getPrompts?.map((prompt) =>
              prompt.id === documentId ? { ...prompt, subscribers: removeFromArray(prompt.subscribers, userStore.getUser.uid) } : prompt
            )
          }
          if (collectionName === 'entries') {
            entryStore._entries = entryStore.getEntries?.map((entry) =>
              entry.id === documentId ? { ...entry, subscribers: removeFromArray(entry.subscribers, userStore.getUser.uid) } : entry
            )
          }
        } else {
          transaction.update(doc(db, collectionName, documentId), { subscribers: arrayUnion(userStore.getUser.uid) })
          transaction.update(userStore.getUserRef, { subscriptions: arrayUnion(documentId) })
          userStore._user.subscriptions = addToArray(userStore.getUser.subscriptions || [], documentId)

          if (collectionName === 'prompts') {
            promptStore._prompts = promptStore.getPrompts?.map((prompt) =>
              prompt.id === documentId ? { ...prompt, subscribers: addToArray(prompt.subscribers || [], userStore.getUser.uid) } : prompt
            )

            promptStore._monthPrompt = promptStore.getMonthPrompt?.map((prompt) =>
              prompt.id === documentId ? { ...prompt, subscribers: addToArray(prompt.subscribers || [], userStore.getUser.uid) } : prompt
            )
          }

          if (collectionName === 'entries') {
            entryStore._entries = entryStore.getEntries?.map((entry) =>
              entry.id === documentId ? { ...entry, subscribers: addToArray(entry.subscribers || [], userStore.getUser.uid) } : entry
            )
          }
        }
      }).finally(() => (this._isLoading = false))
    },

    /**
     * Sends a notification to each user on the subscriber list.
     * @param {*} subscribers - Array of user ids
     * @param {*} notification - Notification object
     */
    async create(subscribers, notification) {
      if (!subscribers?.length) return

      const userStore = useUserStore()

      notification.created = Date.now()
      notification.id = Date.now().toString()
      notification.read = false

      subscribers = subscribers.filter((subscriber) => subscriber !== userStore.getUser.uid)

      subscribers?.forEach(async (subscriber) => {
        await setDoc(doc(db, 'users', subscriber, 'notifications', notification.id), notification)
      })
    },

    async notifyWinner(winner, notification) {
      if (!winner) return
      notification.created = Date.now()
      notification.id = Date.now().toString()
      notification.read = false
      await setDoc(doc(db, 'users', winner, 'notifications', notification.id), notification)
    },

    async readList() {
      const userStore = useUserStore()

      onSnapshot(collection(db, 'users', userStore.getUser.uid, 'notifications'), (querySnapshot) => {
        this._notifications = querySnapshot.docs.map((doc) => doc.data())
      })
    },

    async markOneAsRead(notificationId) {
      const userStore = useUserStore()

      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'users', userStore.getUser.uid, 'notifications', notificationId), { read: true })
      })
    },

    async markAllAsRead(link) {
      const userStore = useUserStore()
      let unreadNotifications
      if (link) {
        unreadNotifications = this.getNotifications.filter((notification) => !notification.read && notification.link === link)
      } else {
        unreadNotifications = this.getNotifications.filter((notification) => !notification.read)
      }

      await runTransaction(db, async (transaction) => {
        unreadNotifications.forEach((notification) => {
          transaction.update(doc(db, 'users', userStore.getUser.uid, 'notifications', notification.id), { read: true })
        })
      })
    },

    async deleteOne(notificationId) {
      const userStore = useUserStore()

      await deleteDoc(doc(db, 'users', userStore.getUser.uid, 'notifications', notificationId))
    },

    async deleteAll() {
      const userStore = useUserStore()

      const notificationSnapshot = await getDocs(collection(db, 'users', userStore.getUser.uid, 'notifications'))

      notificationSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref)
      })
    }
  }
})
