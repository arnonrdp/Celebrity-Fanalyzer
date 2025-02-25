<template>
  <q-page>
    <q-card class="fixed-center q-mx-auto" style="width: 25rem; max-width: 90vw" data-test="auth-card">
      <q-tabs class="text-primary" v-model="tab" data-test="auth-tabs">
        <q-tab data-test="signin-tab" label="Sign In" name="signin" />
        <q-tab data-test="signup-tab" label="Sign Up" name="signup" />
      </q-tabs>

      <q-form class="q-px-md q-pt-md text-center" :class="{ 'q-pb-md': tab === 'signup' }" greedy @submit="emailSign" data-test="auth-form">
        <q-input
          v-if="tab === 'signup'"
          data-test="name-field"
          hide-hint
          :hint="'At least 2 characters'"
          label="Name"
          lazy-rules
          required
          :rules="[(val) => /^.{2,}$/.test(val) || 'Invalid Name']"
          v-model.trim="user.name"
        />
        <q-input
          data-test="email-field"
          label="Email"
          lazy-rules
          required
          :rules="[(val, rules) => rules.email(val) || 'Invalid Email']"
          v-model="user.email"
        />
        <q-input
          v-if="tab === 'signup'"
          data-test="username-field"
          label="Username"
          lazy-rules
          :rules="[(val) => usernameValidator(val)]"
          v-model="user.username"
        >
          <template #append>
            <q-icon v-if="isUserNameAvailable" data-test="username-available-icon" name="check_circle" color="green" />
          </template>
        </q-input>
        <q-input
          data-test="password-field"
          label="Password"
          hide-hint
          :hint="'At least 6 characters'"
          lazy-rules
          required
          :rules="[(val) => /^.{6,}$/.test(val) || 'Invalid Password']"
          :type="isVisibleOn ? 'text' : 'password'"
          v-model="user.password"
        >
          <template v-slot:append>
            <q-icon
              :name="isVisibleOn ? 'visibility' : 'visibility_off'"
              data-test="password-visibility-icon"
              @click.stop.prevent="text = null"
              class="cursor-pointer"
              @click="toggleVisibility"
            />
          </template>
        </q-input>

        <q-btn color="primary" data-test="sign-button" :label="tab === 'signin' ? 'Sign In' : 'Sign Up'" type="submit" />
      </q-form>
      <q-btn
        color="secondary"
        size="sm"
        v-if="tab !== 'signup'"
        class="forgot-pass"
        data-test="forgot-password-button"
        label="Forgot Password?"
        @click="openResetDialog = true"
      />
      <q-separator inset data-test="form-separator" />

      <div class="column items-center q-gutter-md q-py-md" data-test="social-login-section">
        <q-btn data-test="google-button" icon="img:/icons/google.svg" label="Sign with Google" rounded @click="googleSign" />
      </div>
    </q-card>

    <q-dialog v-model="openResetDialog" data-test="reset-password-dialog">
      <q-card style="width: 400px" data-test="reset-password-card">
        <q-card-section>
          <div class="text-h6" data-test="reset-password-title">Reset Password</div>
        </q-card-section>
        <q-card-section class="row items-center">
          <q-input
            class="full-width"
            data-test="reset-email-field"
            label="Enter your email"
            lazy-rules
            required
            :rules="[(val, rules) => rules.email(val) || 'Invalid Email']"
            v-model="user.email"
          />
        </q-card-section>

        <q-card-actions align="right" data-test="reset-card-actions">
          <q-btn flat label="Cancel" color="primary" v-close-popup data-test="reset-cancel-button" />
          <q-btn
            flat
            label="Ok"
            color="primary"
            v-close-popup
            @click="handleResetPassword"
            :disable="!validateEmail(user.email)"
            data-test="reset-submit-button"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { Notify } from 'quasar'
import { useErrorStore, useUserStore } from 'src/stores'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { passwordResetEmail } from '../../firebase'

const errorStore = useErrorStore()
const userStore = useUserStore()

const user = ref({
  email: '',
  name: '',
  username: '',
  password: ''
})
const tab = ref('signin')
const openResetDialog = ref(false)
const route = useRoute()
const isVisibleOn = ref(false)
const isUserNameAvailable = ref(false)

function toggleVisibility() {
  isVisibleOn.value = !isVisibleOn.value
}

async function emailSign() {
  if (tab.value === 'signin') {
    await userStore.emailSignIn(user.value).catch((error) => {
      errorStore.throwError(error)
      Notify.create({ message: 'Wrong username or password', type: 'negative' })
    })
  }

  if (tab.value === 'signup') {
    if (!validateEmail(user.value.email)) {
      Notify.create({ message: 'Invalid email address', type: 'negative' })
      return
    }
    await userStore.emailSignUp(user.value).catch((error) => errorStore.throwError(error))
  }
}

async function googleSign() {
  await userStore.googleSignIn().catch((error) => errorStore.throwError(error))
}

async function handleResetPassword() {
  if (user.value.email) {
    const doesExists = await userStore.checkEmailExists(user.value.email)
    if (doesExists) {
      passwordResetEmail(user.value.email)
        .then(() => {
          Notify.create({ message: 'Password reset link sent. Please check your email.', type: 'positive' })
        })
        .catch(() => {
          Notify.create({ message: 'Something went wrong', type: 'negative' })
        })
    } else {
      Notify.create({ message: 'This email does not exist', type: 'negative' })
    }
  }
}
function validateEmail(email) {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

async function usernameValidator(username) {
  if (!/\w{3,20}$/.test(username)) return 'Username must be between 3 and 20 characters long'
  const isAvailable = !(await userStore.checkUsernameAvailability(username))
  isUserNameAvailable.value = isAvailable
  if (!isAvailable) return 'Username already taken'
}

watch(
  () => route.query,
  () => {
    if (route.query.email) {
      user.value.email = route.query.email
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.forgot-pass {
  display: flex;
  margin: 10px auto;
}
</style>
