import { collection, deleteDoc, doc, getCountFromServer, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from 'src/firebase'
import { useUserStore } from 'src/stores'
import { baseURL } from 'stores/stats'
import { mock_layer8_interceptor } from 'mock_layer8_module'

const pushShareToStats = async (user_id, id, social_media) =>
  await mock_layer8_interceptor
    .fetch(`${baseURL}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id, id, social_media })
    })
    .then((res) => res.json())
    .catch((err) => console.log(err))

export const useShareStore = defineStore('shares', {
  state: () => ({
    _sharesCount: undefined,
    _sharesStats: undefined,
    _unSubscribe: undefined,
    _isLoading: false
  }),

  // persist: true,

  getters: {
    getShares: (state) => state._sharesCount,
    getSharesStats: (state) => state._sharesStats,
    isLoaded: (state) => !!state._sharesCount || state._sharesCount === 0,
    isLoading: (state) => state._isLoading
  },

  actions: {
    async fetchSharesCount(collectionName, documentId) {
      try {
        const totalCountFunc = await getCountFromServer(collection(db, collectionName, documentId, 'shares'))
        this._sharesCount = totalCountFunc.data().count
        this._isLoading = false
      } catch (e) {
        console.error('Failed fetching shares count', e)
      }
    },

    async fetchSharesStats(collectionName, documentId) {
      try {
        this._isLoading = true
        const sharesCollection = collection(db, collectionName, documentId, 'shares')
        const querySnapshot = await getDocs(sharesCollection)
        this._sharesStats = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        this._isLoading = false
      } catch (e) {
        console.error('Failed fetching shares count', e)
      }
    },

    async addShare(collectionName, documentId, socialNetwork, isTest = false) {
      try {
        this._isLoading = true
        const userStore = useUserStore()
        const user_id = userStore.getUserId ? userStore.getUserId : userStore.getUserIpHash
        const docId = socialNetwork + '-' + (userStore.isAuthenticated ? userStore.getUserRef.id : userStore.getUserIpHash)

        await setDoc(doc(db, collectionName, documentId, 'shares', docId), {
          author: userStore.isAuthenticated ? userStore.getUserRef : 'Anonymous',
          createdAt: Timestamp.fromDate(new Date()),
          sharedOn: socialNetwork
        })
        if (!isTest) {
          await pushShareToStats(user_id, documentId, socialNetwork)
        }

        await this.fetchSharesCount(collectionName, documentId)
        this._isLoading = false
      } catch (e) {
        console.error('Error adding share:', e)
      } finally {
        this._isLoading = false
      }
    },

    async deleteAllShares(collectionName, documentId) {
      this._isLoading = true
      const sharesCollection = collection(db, collectionName, documentId, 'shares')

      const snapshot = await getDocs(sharesCollection)

      const promises = snapshot.docs.map(async (doc) => {
        return deleteDoc(doc.ref)
      })
      await Promise.all(promises)
      this._isLoading = false
    }
  }
})
