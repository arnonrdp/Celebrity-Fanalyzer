import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  or,
  orderBy,
  query,
  runTransaction,
  setDoc,
  startAfter,
  Timestamp,
  where
} from 'firebase/firestore'
import { deleteObject, ref } from 'firebase/storage'
import { defineStore } from 'pinia'
import { db, storage } from 'src/firebase'
import {
  useCommentStore,
  useEntryStore,
  useErrorStore,
  useLikeStore,
  useNotificationStore,
  useShareStore,
  useStatStore,
  useUserStore,
  useVisitorStore
} from 'src/stores'
import { Notify } from 'quasar'
import { currentYearMonth } from 'src/utils/date'

let updatedBefore = false
const getPrompts = async (querySnapshot, userStore) => {
  const prompts = []

  for (const doc of querySnapshot.docs) {
    const promptData = doc.data()
    const authorId = promptData.author.id
    const author = userStore.getUserById(authorId) || (await userStore.fetchUser(authorId))

    prompts.push({
      id: doc.id,
      ...promptData,
      author,
      entries: promptData.entries?.map((entry) => entry.id) || []
    })
  }
  return prompts
}

export const usePromptStore = defineStore('prompts', {
  state: () => ({
    _isLoading: false,
    _prompts: undefined,
    _monthPrompt: undefined,
    _activePrompts: undefined,
    _tab: 'post',
    promptDialog: false,
    entryDialog: {},
    loadCount: 6,
    _totalPrompts: undefined,
    _lastVisible: null,
    _hasMore: true
  }),

  getters: {
    getPromptRef: () => (id) => doc(db, 'prompts', id),
    getPrompts: (state) => state._prompts,
    getMonthPrompt: (state) => state._monthPrompt,
    isLoading: (state) => state._isLoading,
    tab: (state) => state._tab,
    hasMore: (state) => state._hasMore
  },

  actions: {
    async redirect() {
      Notify.create({
        type: 'info',
        message: 'Not found'
      })
      setTimeout(async () => {
        Notify.create({
          type: 'info',
          message: 'You will be redirected in 3 seconds'
        })
      }, 3000)
      setTimeout(async () => {
        window.location.href = '/404'
      }, 6000)
    },

    async fetchPrompts(loadMore = false, count) {
      const userStore = useUserStore()
      this._isLoading = true

      try {
        let queryRef = collection(db, 'prompts')
        const limitCount = count ?? this.loadCount

        if (loadMore) {
          queryRef = this._lastVisible
            ? query(queryRef, orderBy('id', 'desc'), startAfter(this._lastVisible), limit(limitCount))
            : query(queryRef, orderBy('id', 'desc'), limit(limitCount))
        } else {
          queryRef = query(queryRef, orderBy('id', 'desc'), limit(limitCount))
        }
        const querySnapshot = await getDocs(queryRef)
        const newPrompts = await getPrompts(querySnapshot, userStore)

        if (newPrompts.length > 0) {
          this._lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]
        }
        if (newPrompts.length > 4) this._hasMore = true
        else this._hasMore = false

        this._prompts = loadMore ? [...(this._prompts?.length > 5 ? this._prompts : []), ...newPrompts] : newPrompts

        return newPrompts
      } catch (error) {
        console.error('Error fetching prompts:', error)
      } finally {
        this._isLoading = false
      }
    },

    async getTotalPromptsCount() {
      try {
        const totalCountFunc = await getCountFromServer(collection(db, 'prompts'))
        this._totalPrompts = totalCountFunc.data().count
        return this._totalPrompts
      } catch (e) {
        console.error('Failed fetching errors count', e)
      }
    },

    async fetchActivePrompts() {
      const userStore = useUserStore()
      this._isLoading = true

      try {
        let queryRef = collection(db, 'prompts')
        queryRef = query(queryRef, where('hasWinner', '==', null), where('escrowId', '!=', null))

        const querySnapshot = await getDocs(queryRef)
        const activePrompts = await getPrompts(querySnapshot, userStore)
        this._activePrompts = activePrompts
        return activePrompts
      } catch (error) {
        console.error('Error fetching prompts:', error)
      } finally {
        this._isLoading = false
      }
    },

    async fetchPromptById(id) {
      const userStore = useUserStore()

      try {
        this._isLoading = true
        const querySnapshot = await getDocs(query(collection(db, 'prompts'), where('id', '==', id)))
        return await getPrompts(querySnapshot, userStore)
      } catch (e) {
        console.error('Error fetching prompts:', e)
      } finally {
        this._isLoading = false
      }
    },

    async fetchPromptBySlug(slug) {
      try {
        this._isLoading = true
        const userStore = useUserStore()

        const promptRef = await getDocs(query(collection(db, 'prompts'), or(where('slug', '==', slug), where('date', '==', slug))))
        const promptSnapshot = promptRef.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0]

        if (promptSnapshot.author.id) {
          promptSnapshot.author = userStore.getUserById(promptSnapshot.author.id) || (await userStore.fetchUser(promptSnapshot.author.id))
        }

        if (promptRef.empty) {
          await this.redirect()
        }

        this._isLoading = false
        this._prompts = [
          {
            ...promptSnapshot,
            entries: promptSnapshot?.entries?.map((entry) => entry.id) || []
          }
        ]
      } catch (e) {
        console.error('Error fetching promptsBySlug:', e)
        await this.redirect()
      }
    },

    async fetchMonthsPrompt() {
      try {
        this._isLoading = true
        const userStore = useUserStore()

        const promptDocRef = doc(db, 'prompts', currentYearMonth())
        const promptSnapshotRef = await getDoc(promptDocRef)

        if (promptSnapshotRef.exists()) {
          const promptSnapshot = { id: promptSnapshotRef.id, ...promptSnapshotRef.data() }

          if (promptSnapshot.author && promptSnapshot.author.id) {
            promptSnapshot.author = userStore.getUserById(promptSnapshot.author.id) || (await userStore.fetchUser(promptSnapshot.author.id))
          }

          this._isLoading = false
          this._monthPrompt = [
            {
              ...promptSnapshot,
              entries: promptSnapshot?.entries?.map((entry) => entry.id) || []
            }
          ]
        } else {
          const lastPromptAvailableRef = await getDocs(query(collection(db, 'prompts'), orderBy('created', 'desc'), limit(1)))
          const lastPrompt = lastPromptAvailableRef.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0]

          if (lastPrompt.author && lastPrompt.author.id) {
            lastPrompt.author = userStore.getUserById(lastPrompt.author.id) || (await userStore.fetchUser(lastPrompt.author.id))
          }
          this._isLoading = false
          this._monthPrompt = [
            {
              ...lastPrompt,
              entries: lastPrompt?.entries?.map((entry) => entry.id) || []
            }
          ]
        }
      } catch (e) {
        await this.redirect()
        console.error('Error fetching months prompts:', e)
      }
    },

    async hasPrompt(date, title, slug, isEdit = false) {
      try {
        const promptSnapshot = await getDocs(
          query(
            collection(db, 'prompts'),
            isEdit ? where('id', '!=', date) : '',
            or(isEdit ? '' : where('date', '==', date), where('slug', '==', slug), where('title', '==', title))
          )
        )
        promptSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.title.toLowerCase() === title.toLowerCase() || data.slug === slug) {
            Notify.create({ message: 'Prompt with this title already exists. Please choose another title.', type: 'negative' })
          } else if (data.date === date) {
            Notify.create({ message: 'Choose another month for this prompt.', type: 'negative' })
          }
        })
        return !promptSnapshot.empty
      } catch (error) {
        console.log('Error occurred while checking', error)
        return false
      }
    },

    async getPromptDates() {
      const set = new Set()
      if (this.hasMore) {
        await this.fetchPrompts(true, this._totalPrompts)
        this._hasMore = false
      }
      this.getPrompts?.map((prompt) => {
        set.add(prompt?.id)
      })
      return Array.from(set)
    },

    async addPrompt(payload) {
      const notificationStore = useNotificationStore()
      const userStore = useUserStore()
      const isTester = payload.author.label === 'Cypress Tester'
      const prompt = isTester ? { ...payload, escrowId: '0.0000000000000000001' } : { ...payload }
      prompt.author = doc(db, 'users', prompt.author.value)
      prompt.created = Timestamp.fromDate(new Date())
      prompt.id = prompt.date
      prompt.hasWinner = null

      this._isLoading = true
      await setDoc(doc(db, 'prompts', prompt.id), prompt).finally(() => (this._isLoading = false))

      prompt.author = await userStore.fetchUser(prompt.author.id)
      prompt.entries = []
      this._prompts = this.getPrompts ? [prompt, ...this.getPrompts] : [prompt]

      await notificationStore.toggleSubscription('prompts', prompt.id)
    },

    async editPrompt(payload) {
      const prompt = { ...payload }
      const userStore = useUserStore()

      prompt.author = doc(db, 'users', prompt.author.value)
      prompt.updated = Timestamp.fromDate(new Date())

      this._isLoading = true
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'prompts', prompt.id), prompt)
      })
        .then(async () => {
          prompt.entries = []
          prompt.author = await userStore.fetchUser(prompt.author.id)

          this._prompts = this._prompts.map((element) => (element.id === prompt.id ? prompt : element))
          this._monthPrompt = this._monthPrompt?.map((element) => (element.id === prompt.id ? prompt : element))
        })
        .finally(() => (this._isLoading = false))
    },

    async updateEscrowId(payload) {
      const { promptId, escrowId } = payload

      if (!promptId || !escrowId) {
        throw new Error('Both promptId and escrowId are required.')
      }

      this._isLoading = true
      try {
        await runTransaction(db, async (transaction) => {
          const promptDocRef = doc(db, 'prompts', promptId)
          const promptDoc = await transaction.get(promptDocRef)

          if (!promptDoc.exists()) {
            throw new Error('Prompt does not exist.')
          }

          const prompt = promptDoc.data()
          prompt.escrowId = escrowId
          prompt.updated = Timestamp.fromDate(new Date())

          transaction.update(promptDocRef, prompt)
        })

        // Update local state or cache if needed
        this._prompts = this._prompts?.map((element) => (element.id === promptId ? { ...element, escrowId } : element))
        this._monthPrompt = this._monthPrompt?.map((element) => (element.id === promptId ? { ...element, escrowId } : element))
      } catch (error) {
        console.error('Error updating escrowId:', error)
      } finally {
        this._isLoading = false
      }
    },

    async deletePrompt(id) {
      const commentStore = useCommentStore()
      const entryStore = useEntryStore()
      const errorStore = useErrorStore()
      const likeStore = useLikeStore()
      const shareStore = useShareStore()
      const visitorStore = useVisitorStore()
      const statStore = useStatStore()

      const relatedEntries = this._prompts.find((prompt) => prompt.id === id)?.entries || []

      this._isLoading = true
      if (relatedEntries.length) {
        for (const entryId of relatedEntries) {
          await entryStore.deleteEntry(entryId)
        }
      }

      try {
        const deleteImage = deleteObject(ref(storage, `images/prompt-${id}`))
        const deleteComments = commentStore.deleteCommentsCollection('prompts', id)
        const deleteLikes = likeStore.deleteAllLikesDislikes('prompts', id)
        const deletePromptDoc = deleteDoc(doc(db, 'prompts', id))
        const deleteShares = shareStore.deleteAllShares('prompts', id)
        const deleteVisitors = visitorStore.deleteAllVisitors('prompts', id)
        const deletePromptFromStats = statStore.removeTopic(id)

        await Promise.all([deleteComments, deleteLikes, deleteShares, deleteImage, deletePromptDoc, deleteVisitors, deletePromptFromStats])
        this._prompts = this.getPrompts?.filter((prompt) => prompt.id !== id)
      } catch (error) {
        await errorStore.throwError(error, 'Error deleting prompt')
      }
      this._isLoading = false
    },

    setTab(tab) {
      this.$patch({ _tab: tab })
    },
    reset() {
      this._lastVisible = null
      this._prompts = undefined
      this._hasMore = true
      updatedBefore = false
    }
  }
})
