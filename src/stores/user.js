import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  getAuth
} from 'firebase/auth'
import { collection, doc, deleteDoc, getDoc, getDocs, onSnapshot, or, query, runTransaction, setDoc, where } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { LocalStorage, Notify } from 'quasar'
import sha1 from 'sha1'
import { auth, db } from 'src/firebase'
import { baseURL } from 'stores/stats'
import { mock_layer8_interceptor } from 'mock_layer8_module'
import { useWalletStore } from 'stores/wallet'
import { getFunctions, httpsCallable } from 'firebase/functions'

export const useUserStore = defineStore('user', {
  state: () => ({
    _profileTab: 'profile',
    _user: {},
    _userIp: '',
    _users: undefined,
    _isLoading: false,
    _userLocation: '',
    _statsUsers: undefined
  }),

  persist: true,

  getters: {
    getAdmins: (getters) => getters.getUsers?.filter((user) => user.role === 'Admin') || [],
    getAdminsAndEditors: (getters) => getters.getUsers?.filter((user) => user.role === 'Admin' || user.role === 'Editor') || [],
    getProfileTab: (state) => state._profileTab,
    getSubscriptions: (state) => state._user.subscriptions,
    getUser: (state) => state._user,
    getUserById: (getters) => (id) => getters.getUsers?.find((user) => user.uid === id),
    getUserIp: (state) => state._userIp,
    getUserIpHash: (state) => sha1(state._userIp),
    getUserRef: (getters) => (getters.getUser.uid ? doc(db, 'users', getters.getUser.uid) : undefined),
    getUsers: (state) => state._users,
    isAdmin: (getters) => getters.getUser.role === 'Admin',
    isEditorOrAbove: (getters) => ['Admin', 'Editor'].includes(getters.getUser.role),
    isAdvertiser: (getters) => getters.getUser.role === 'Advertiser',
    isAuthenticated: (getters) => Boolean(getters.getUser?.uid),
    isLoading: (state) => state._isLoading,
    getUserId: (getters) => (getters.isAuthenticated && getters.getUser ? getters.getUser.uid : getters.getUserIpHash),
    getUserLocation: (state) => state._userLocation,
    getAllUsers: (state) => state._statsUsers
  },

  actions: {
    async fetchUser(uid) {
      this._isLoading = true
      return await getDoc(doc(db, 'users', uid))
        .then((document) => {
          return { uid: document.id, ...document.data() }
        })
        .finally(() => (this._isLoading = false))
    },

    async fetchUsers() {
      this._isLoading = true
      onSnapshot(query(collection(db, 'users')), (querySnapshot) => {
        const users = querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
        this.$patch({ _users: users })
      })
      this._isLoading = false
    },

    async getUserByUidOrUsername(id) {
      this._isLoading = true
      const user = await getDoc(doc(db, 'users', id)).catch((error) => console.error(error))
      if (user.exists()) {
        this._isLoading = false
        return { uid: user.id, ...user.data() }
      }
      return await getDocs(query(collection(db, 'users'), or(where('username', '==', id), where('displayName', '==', id))))
        .then((querySnapshot) => querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))[0])
        .finally(() => (this._isLoading = false))
    },

    // async fetchAdminsAndEditors() {
    //   this._isLoading = true
    //   await getDocs(query(collection(db, 'users'), or(where('role', '==', 'Admin'), where('role', '==', 'Editor'))))
    //     .then((querySnapshot) => {
    //       const users = querySnapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
    //       this.$patch({ _users: users })
    //     })
    //     .finally(() => (this._isLoading = false))
    // },

    /**
     * Fetch the user ip from Cloudflare
     * @SaveState <string> IPV6
     */
    async fetchUserIp() {
      this._userIp = ''
      this._userLocation = ''
      const trace = await fetch('https://stats-api.up.railway.app/v1/trace')
      const data = await trace.json()

      if (data.ip) {
        this._userIp = data.ip
      }

      if (data.country) {
        this._userLocation = data.country
      }

      if (this.getUser.uid && !this.getUser.location) {
        try {
          await this.updateProfile({ location: this._userLocation })
        } catch (e) {
          console.error(e)
        }
      }
    },

    async emailSignUp(user) {
      this._isLoading = true
      await createUserWithEmailAndPassword(auth, user.email, user.password)
        .then(async (userCredential) => {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            displayName: user.name,
            email: user.email,
            username: user.username,
            role: 'User',
            walletAddress: ''
          })
            .then(() => this.emailSignIn(user))
            .then(() => Notify.create({ color: 'positive', message: 'Account created successfully' }))
            .catch((error) => console.error(error))
        })
        .catch((error) => {
          if (error.code === 'auth/email-already-in-use') {
            Notify.create({ type: 'negative', message: 'Email already exists' })
          } else {
            Notify.create({ type: 'negative', message: 'Something went wrong, Please try again' })
          }
        })
        .finally(() => (this._isLoading = false))
    },

    async emailSignIn(user) {
      this.$reset()
      LocalStorage.remove('user')
      this._isLoading = true
      await signInWithEmailAndPassword(auth, user.email, user.password)
        .then(async (result) => {
          onSnapshot(doc(db, 'users', result.user.uid), (doc) => {
            this.$patch({ _user: { uid: doc.id, ...doc.data() } })
          })
        })
        .finally(() => (this._isLoading = false))
    },

    async googleSignIn() {
      this.$reset()
      const provider = new GoogleAuthProvider()

      this._isLoading = true
      await signInWithPopup(auth, provider)
        .then(async (result) => {
          const isNewUser = getAdditionalUserInfo(result)?.isNewUser
          const { email, displayName, photoURL, uid } = result.user

          if (isNewUser) {
            await setDoc(doc(db, 'users', uid), { email, displayName, photoURL, role: 'User' })
          }

          onSnapshot(doc(db, 'users', result.user.uid), (doc) => {
            this.$patch({ _user: { uid: doc.id, ...doc.data() } })
          })
        })
        .finally(() => (this._isLoading = false))
    },

    async checkUsernameAvailability(username) {
      this._isLoading = true
      return await getDocs(query(collection(db, 'users'), this.isAuthenticated ? where('uid', '!=', this.getUser.uid) : ''))
        .then((querySnapshot) => {
          const usernames = querySnapshot.docs.map((document) => document.data().username)
          return usernames.some((name) => name?.toLowerCase() === username?.toLowerCase())
        })
        .finally(() => (this._isLoading = false))
    },

    async updateProfile(user) {
      this._isLoading = true
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'users', this.getUser.uid), user)
      }).finally(() => {
        this._user = user
        this._isLoading = false
      })
    },

    async updateRole(user) {
      this._isLoading = true
      await runTransaction(db, async (transaction) => {
        transaction.update(doc(db, 'users', user.uid), user)
      }).finally(() => (this._isLoading = false))
    },
    async checkEmailExists(email) {
      if (!email) {
        return false
      }
      const q = query(collection(db, 'users'), where('email', '==', email))
      const userSnapsot = await getDocs(q)
      return !userSnapsot.empty
    },

    logout() {
      const walletStore = useWalletStore()
      signOut(auth).then(() => {
        walletStore.$reset()
        this.$reset()
        LocalStorage.remove('user')
      })
    },

    setProfileTab(tab) {
      this.$patch({ _profileTab: tab })
    },

    async deleteUser(uid) {
      this._isLoading = true
      try {
        const functions = getFunctions()
        const deleteUserFunction = httpsCallable(functions, 'deleteUser')
        await deleteUserFunction({ uid })

        Notify.create({
          color: 'positive',
          message: 'User deleted successfully'
        })

        this._users = this._users.filter((user) => user.uid !== uid)
      } catch (error) {
        console.error('Error deleting user: ', error)
        Notify.create({
          color: 'negative',
          message: 'Error deleting user. Please try again.'
        })
      } finally {
        this._isLoading = false
      }
    },

    // async addAllUsers(users) {
    //   await fetch(${baseURL}/add-all-users, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(users)
    //   }).catch((error) => console.log(error))
    // },

    // async getStatsUsers() {
    //   const allUsers = await mock_layer8_interceptor.fetch(${baseURL}/users, {
    //     method: 'GET'
    //   })
    //   this._statsUsers = await allUsers.json()
    // }

    async deleteOwnAccount() {
      this._isLoading = true
      try {
        const currentUser = getAuth().currentUser
        if (!currentUser) {
          throw new Error('User is not authenticated.')
        }

        const userDocRef = doc(db, 'users', currentUser.uid)
        await deleteDoc(userDocRef)

        await currentUser.delete()

        Notify.create({
          color: 'positive',
          message: 'Your account has been deleted successfully.'
        })

        this.$reset()
        LocalStorage.remove('user')
      } catch (error) {
        console.error('Error deleting account:', error)

        if (error.code === 'auth/requires-recent-login') {
          Notify.create({
            color: 'negative',
            message: 'Please log in again to delete your account.'
          })
        } else {
          Notify.create({
            color: 'negative',
            message: 'Failed to delete your account. Please try again later.'
          })
        }
      } finally {
        this._isLoading = false
      }
    }
  }
})
