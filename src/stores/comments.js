import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { defineStore } from 'pinia'
import { db } from 'src/firebase'
import { useUserStore } from 'src/stores'

export const useCommentStore = defineStore('comments', {
  state: () => ({
    _comments: [],
    _isLoading: false
  }),

  persist: true,

  getters: {
    getComments: (state) => state._comments,
    isLoading: (state) => state._isLoading
  },

  actions: {
    async fetchComments(documentId) {
      this._isLoading = true
      await getDocs(collection(db, 'entries', documentId, 'comments'))
        .then(async (querySnapshot) => {
          const comments = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

          for (const comment of comments) {
            if (!comment.isAnonymous) {
              comment.author = await getDoc(comment.author).then((doc) => doc.data())
            }
          }

          this.$patch({ _comments: comments })
        })
        .finally(() => (this._isLoading = false))
    },

    async addComment(comment, entry) {
      const userStore = useUserStore()
      await userStore.fetchUserIp()

      comment.author = userStore.getUserRef || userStore.getUserIpHash
      comment.created = Timestamp.fromDate(new Date())
      comment.isAnonymous = !userStore.isAuthenticated

      const stateAuthor = Object.keys(userStore.getUser).length ? userStore.getUser : userStore.getUserIpHash
      const docId = comment.id ? comment.id : Date.now() + '-' + (comment.author.id || comment.author)

      comment.id = docId
      localStorage.setItem('id', docId)

      this._isLoading = true
      await setDoc(doc(db, 'entries', entry.id, 'comments', docId), comment)
        .then(() => this.$patch({ _comments: [...this._comments, { ...comment, author: stateAuthor }] }))
        .finally(() => (this._isLoading = false))
    },

    async editComment(entryId, id, editedComment, userId) {
      const userStore = useUserStore()
      await userStore.fetchUserIp()

      const comment = this.getComments.find((comment) => comment.id === id)
      const index = this._comments.findIndex((comment) => comment.id === id)

      comment.updated = Timestamp.fromDate(new Date())

      this._isLoading = true
      if (index !== -1 && userId === (comment.author?.uid || comment.author)) {
        await runTransaction(db, async (transaction) => {
          transaction.update(doc(db, 'entries', entryId, 'comments', comment.id), { text: editedComment })
        })
          .then(() => {
            this.$patch({
              _comments: [...this._comments.slice(0, index), { ...this._comments[index], ...comment }, ...this._comments.slice(index + 1)]
            })
          })
          .finally(() => (this._isLoading = false))
      } else {
        throw new Error(error)
      }
    },

    async likeComment(entryId, commentId) {
      const userStore = useUserStore()
      await userStore.fetchUserIp()

      const commentRef = doc(db, 'entries', entryId, 'comments', commentId)
      const user = userStore.getUserRef || userStore.getUserIpHash

      await updateDoc(commentRef, { likes: arrayUnion(user) })
      await updateDoc(commentRef, { dislikes: arrayRemove(user) })

      const comments = this._comments.map((comment) => {
        if (comment.id === commentId && !comment.likes?.includes(user)) {
          comment.likes?.push(user)
          comment.dislikes = comment.dislikes?.filter((dislike) => dislike.id !== user.id)
        } else if (comment.id === commentId && comment.likes?.includes(user)) {
          comment.likes = comment.likes?.filter((like) => like.id !== user.id)
        }
        return comment
      })

      this.$patch({ _comments: comments })
    },

    async dislikeComment(entryId, id) {
      const userStore = useUserStore()
      await userStore.fetchUserIp()

      const commentRef = doc(db, 'entries', entryId, 'comments', id)
      const user = userStore.getUserRef || userStore.getUserIpHash

      await updateDoc(commentRef, { dislikes: arrayUnion(user) })
      await updateDoc(commentRef, { likes: arrayRemove(user) })

      const comments = this._comments.map((comment) => {
        if (comment.id === id && !comment.dislikes?.includes(user)) {
          comment.dislikes.push(user)
          comment.likes = comment.likes.filter((like) => like.id !== user.id)
        } else if (comment.id === id && comment.dislikes?.includes(user)) {
          comment.dislikes = comment.dislikes?.filter((dislike) => dislike.id !== user.id)
        }
        return comment
      })

      this.$patch({ _comments: comments })
    },

    async deleteComment(entryId, id) {
      const index = this._comments.findIndex((comment) => comment.id === id)

      this._isLoading = true
      await deleteDoc(doc(db, 'entries', entryId, 'comments', id))
        .then(() => this._comments.splice(index, 1))
        .finally(() => (this._isLoading = false))
    },

    async deleteCommentsCollection(collectionName, documentId) {
      const commentsCollection = collection(db, collectionName, documentId, 'comments')

      const commentsSnapshot = await getDocs(commentsCollection)

      commentsSnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref)
      })
    },

    async addReply(entryId, commentId, reply) {
      const userStore = useUserStore()
      await userStore.fetchUserIp()

      reply.author = userStore.getUserRef || userStore.getUserIpHash
      reply.created = Timestamp.fromDate(new Date())
      reply.isAnonymous = !userStore.isAuthenticated

      const stateAuthor = Object.keys(userStore.getUser).length ? userStore.getUser : userStore.getUserIpHash
      const docId = Date.now() + '-' + (reply.author.id || reply.author)

      reply.id = docId
      reply.id = reply.id ? reply.id : docId

      this._isLoading = true
      await setDoc(doc(db, 'entries', entryId, 'comments', docId), reply)
        .then(() => this.$patch({ _comments: [...this._comments, { ...reply, author: stateAuthor }] }))
        .finally(() => (this._isLoading = false))
    }
  }
})
