//Testing Frameworks
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteUser, getAuth } from 'firebase/auth'

// Necessary Components
import { useEntryStore, usePromptStore, useUserStore } from 'src/stores'
import { waitUntil } from 'src/utils/waitUntil'
import { ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

describe('Users Store', () => {
  // Create a router instance using the `createRouter()` function
  const router = createRouter({
    history: createWebHistory(),
    routes: []
  })

  beforeEach(async () => {
    setActivePinia(createPinia())

    // In the Pinia store user.js, the call to fetch to get the user IP breaks. This is a mock to prevent breaking.
    global.fetch = vi.fn(async () => {
      return {
        text: () => {
          return 'ip=255.255.255.255'
        }
      }
    })
  })

  it('Should Access the store initial state with the getter as an anonymous user', async () => {
    const userStore = useUserStore()
    expect(userStore.getAdmins).toEqual([])
    expect(userStore.getAdminsAndEditors).toEqual([])
    expect(userStore.getProfileTab).toEqual('profile')
    expect(userStore.getSubscriptions).toEqual(undefined)
    expect(userStore.getUser).toEqual({})
    expect(userStore.getUserById('abcd')).toEqual(undefined)
    expect(userStore.getUserIp).toEqual('')
    expect(userStore.getUserIpHash).toEqual('da39a3ee5e6b4b0d3255bfef95601890afd80709')
    expect(userStore.getUserRef).toEqual(undefined)
    expect(userStore.getUsers).toEqual(undefined)
    expect(userStore.isAdmin).toEqual(false)
    expect(userStore.isEditorOrAbove).toEqual(false)

    expect(userStore.isAnonymous).toEqual(undefined)
    expect(userStore.isLoading).toEqual(false)
    expect(userStore.isAuthenticated).toEqual(false)
    userStore.setProfileTab('feedback')
    expect(userStore.getProfileTab).toEqual('feedback')
  })

  it('Should Login Then logout', async () => {
    const userStore = useUserStore()

    // Part 1: Login The user
    // Login the test@test.com user
    const userObj = {
      email: import.meta.env.VITE_TEST_USER,
      password: import.meta.env.VITE_TEST_PASSWORD
    }
    userStore.emailSignIn(userObj)

    // Check the Start loading of data
    await waitUntil(() => {
      return userStore.isLoading
    }).catch((e) => console.log('Error : Should be loading', e))
    expect(userStore.isLoading).toEqual(true)

    // Check the End loading of data
    await waitUntil(() => {
      return userStore.isLoading === false
    }).catch((e) => console.log('Error : Should Not be loading', e))
    expect(userStore.isLoading).toEqual(false)

    // wait the user to be authenticated
    await waitUntil(() => {
      return userStore.isAuthenticated
    }).catch((e) => console.log('Error : Should be authenticated', e))

    // Check the state
    expect(userStore.getUser.displayName).toEqual('Cypress Tester')
    expect(!!userStore.getUserRef).toEqual(true)
    expect(userStore.isAdmin).toEqual(true)
    expect(userStore.isEditorOrAbove).toEqual(true)
    expect(userStore.isAnonymous).toEqual(undefined)
    expect(userStore.isAuthenticated).toEqual(true)
    await userStore.updateProfile(userStore.getUser)

    // Part 1: Logout The user
    try {
      userStore.logout()
    } catch (e) {
      console.log('Error', e)
    }

    await waitUntil(() => {
      return !userStore.isAuthenticated
    })
    expect(userStore.getUser.displayName).toEqual(undefined)
    expect(userStore.getUserRef).toEqual(undefined)
    expect(userStore.isAdmin).toEqual(false)
    expect(userStore.isEditorOrAbove).toEqual(false)

    expect(userStore.isAnonymous).toEqual(undefined)
    expect(userStore.isAuthenticated).toEqual(false)
  })

  it('Access a non-existing public profile', async () => {
    const userStore = useUserStore()
    // 1) Attempt to get the user
    const user = ref()
    await userStore.getUserByUidOrUsername('abc123').then((res) => (user.value = res))

    // 2) Check if the user exists, redirect to the corresponding page; otherwise, redirect to the Index Page.
    if (user.value) {
      await router.push('/fan/abc123')
    } else {
      await router.push('/')
    }

    // 3) Verify that the user is redirected to the Index Page.
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('Access a existing public profile', async () => {
    const entryStore = useEntryStore()
    const promptStore = usePromptStore()
    const userStore = useUserStore()

    // 1) Attempt to get the user
    const user = ref()
    await userStore.getUserByUidOrUsername('arnonrdp').then((res) => (user.value = res))

    // 2) Check if the user exists, redirect to the corresponding page; otherwise, redirect to the Index Page.
    if (user.value) {
      // TODO: remove 'arnonrdp' and replace by a generic username
      await router.push('/fan/arnonrdp')
    } else {
      await router.push('/')
    }

    // 3) Verify that the user is redirected to the Index Page.
    expect(router.currentRoute.value.path).toBe('/fan/arnonrdp')

    await userStore.fetchAdminsAndEditors()

    // 4) Get the user's prompts and entries
    await promptStore.fetchPrompts()
    await waitUntil(() => {
      return promptStore.getPrompts
    })
    const filteredPrompts = promptStore.getPrompts?.filter((prompt) => prompt.author?.uid === user.value.uid)

    await entryStore.fetchEntries().catch((error) => errorStore.throwError(error))

    await waitUntil(() => {
      return entryStore.getEntries
    })
    const filteredEntries = entryStore.getEntries.filter((entry) => entry.author?.uid === user.value.uid)

    // 5) Verify that the user has at least one prompt or one entry
    expect(filteredPrompts.length > 0 || filteredEntries.length > 0).toBe(true)
  })

  it('Should fetch all user', async () => {
    const userStore = useUserStore()
    await userStore.fetchUsers()
    await waitUntil(() => {
      return userStore.getUsers
    })

    expect(userStore.getUsers.length).toBeGreaterThan(0)
    expect(userStore.getAdmins.length).toBeGreaterThan(0)
    expect(userStore.getAdminsAndEditors.length).toBeGreaterThan(0)
  })

  it('Should Fetch user by ID', async () => {
    const userStore = useUserStore()
    const user = await userStore.fetchUser('NQFZGO9mCYYyJUMdihfvYqy7df43')
    expect(user.displayName).toMatchInlineSnapshot('"Cypress Tester"')
  })

  it('Should emailSignUp user then update user role then remove user', async () => {
    const userStore = useUserStore()
    const userObj = {
      email: Math.random().toString(36).substring(5, 10) + '@cypress.com',
      name: 'Unit Tester',
      password: import.meta.env.VITE_TEST_PASSWORD
    }

    // Check the user exit
    try {
      await userStore.emailSignIn(userObj).then(async () => {
        // Success mean user exist
        expect(userStore.isAuthenticated).toEqual(true)
        const auth = getAuth()
        const user = auth.currentUser
        await deleteUser(user)
      })
    } catch (e) {
      console.log('Error Mean User does not exist')
    }

    // Register User
    expect(userStore.isAuthenticated).toEqual(false)
    await userStore.emailSignUp(userObj)

    // Remove User
    await waitUntil(() => {
      return userStore.isAuthenticated
    })
    expect(userStore.isAuthenticated).toEqual(true)
    const auth = getAuth()
    let user = auth.currentUser
    expect(user.email).toEqual(userObj.email)
    const newUserUID = user.uid

    // Logout
    userStore.logout()
    await waitUntil(() => {
      return !userStore.isAuthenticated
    })

    // Login Admin
    const adminObj = {
      email: import.meta.env.VITE_TEST_USER,
      password: import.meta.env.VITE_TEST_PASSWORD
    }
    await userStore.emailSignIn(adminObj)
    await waitUntil(() => {
      return userStore.isAuthenticated
    })
    expect(userStore.isAuthenticated).toEqual(true)
    user = await userStore.fetchUser(newUserUID)
    expect(user.email).toEqual(userObj.email)
    await userStore.fetchUsers()
    await waitUntil(() => {
      return userStore.getUsers
    })

    // Update user Roles
    await userStore.updateRole({ ...user, role: 'Editor' })
    user = await userStore.fetchUser(newUserUID)
    expect(user.email).toEqual(userObj.email)
    userStore.logout()
    await waitUntil(() => {
      return !userStore.isAuthenticated
    })

    // Login user
    await userStore.emailSignIn(userObj)
    await waitUntil(() => {
      return userStore.isAuthenticated && userStore.getUser.role === 'Editor'
    }, 50000)
    expect(userStore.getUser.role).toEqual('Editor')
    expect(userStore.isAuthenticated).toEqual(true)
    expect(userStore.isEditorOrAbove).toEqual(true)
    user = auth.currentUser

    try {
      await deleteUser(user)
      console.log('user removed')
      console.log('current user:', auth.currentUser)
    } catch (e) {
      console.error('Failed to delete user:', e)
    }
    expect(auth.currentUser).toEqual(null)
  }, 30000)
  // describe('UnAuthenticated User', () => {
  //   beforeEach(async () => {
  //     const userStore = useUserStore()
  //   })
  //   // it.fails('Should test UserName Availability', async () => {
  //   //   const userStore = useUserStore()
  //   //   expect( () =>  userStore.checkUsernameAvailability('abcd')).toThrowError('ERROR: you need to be authenticated')
  //   // })
  // })
  describe('Authenticated User', () => {
    beforeEach(async () => {
      const userStore = useUserStore()

      // Part 1: Login The user
      // Login the test@test.com user
      const userObj = {
        email: import.meta.env.VITE_TEST_USER,
        password: import.meta.env.VITE_TEST_PASSWORD
      }
      await userStore.emailSignIn(userObj)
      // wait the user to be authenticated
      await waitUntil(() => {
        return userStore.isAuthenticated
      }).catch((e) => console.log('Error : Should be authenticated', e))
    })

    it('Should test UserName Availability', async () => {
      const userStore = useUserStore()
      expect(await userStore.checkUsernameAvailability('abcd')).toEqual(false)
    })
  })
})
