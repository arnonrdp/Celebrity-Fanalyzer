<template>
  <q-table
    v-if="userStore.getUsers"
    :columns="columnsUser"
    bordered
    flat
    virtual-scroll
    :filter="filter"
    :loading="userStore.isLoading || !userStore.getUsers"
    :pagination="{ sortBy: 'role', rowsPerPage: 20 }"
    row-key="email"
    :rows="filteredUsers"
    title="Manage Users"
    class="q-ma-md custom-table"
    selection="multiple"
    :selected="selectedRows"
    @update:selected="onSelect"
    data-test="user-table"
  >
    <template v-slot:top-right>
      <q-input debounce="400" data-test="query-input" dense placeholder="Search" v-model="filter">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn
        v-if="selectedRows.length > 1"
        label="Delete Selected"
        color="primary"
        @click="confirmDeleteMultiple"
        class="q-ml-sm"
        dense
        :disable="selectedRows.some((row) => row.role === 'Admin')"
        data-test="delete-multiple-button"
      />
    </template>
    <template v-slot:body-selection="scope">
      <q-checkbox v-if="scope.row.role !== 'Admin'" v-model="scope.selected" data-test="user-checkbox" />
    </template>
    <template v-slot:body-cell-role="props">
      <q-td data-test="role-cell">
        <q-select
          borderless
          dense
          :options="options"
          v-model="props.row.role"
          @update:model-value="userStore.updateRole(props.row)"
          data-test="role-select"
        />
      </q-td>
    </template>
    <template v-slot:body-cell-actions="props">
      <q-td>
        <q-btn
          flat
          dense
          icon="delete"
          color="negative"
          @click="confirmDelete(props.row)"
          :disable="props.row.role === 'Admin'"
          data-test="delete-button"
        />
      </q-td>
    </template>
  </q-table>

  <q-dialog v-model="deleteDialog" data-test="delete-dialog">
    <q-card>
      <q-card-section>
        <div class="text-h6">Delete Confirmation</div>
      </q-card-section>
      <q-card-section>
        Are you sure you want to delete the following user(s)?
        <ul data-test="delete-dialog-list">
          <li v-for="user in selectedRows" :key="user.email" data-test="delete-user-item">{{ user.displayName }}</li>
        </ul>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup data-test="cancel-delete" />
        <q-btn flat label="Delete" color="negative" @click="deleteUsers" data-test="confirm-delete-button" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useUserStore } from 'src/stores'
import { ref, computed } from 'vue'

const userStore = useUserStore()
const filter = ref('')
const deleteDialog = ref(false)
const selectedRows = ref([])

userStore.fetchUsers()

const filteredUsers = computed(() => {
  if (!filter.value) return userStore.getUsers
  const search = filter.value.toLowerCase()
  return userStore.getUsers.filter((user) => {
    return user.displayName.toLowerCase().includes(search) || user.email.toLowerCase().includes(search)
  })
})

const columnsUser = [
  { name: 'displayName', label: 'Name', field: 'displayName', sortable: true, align: 'left' },
  { name: 'email', label: 'Email', field: 'email', sortable: true, align: 'left' },
  { name: 'role', label: 'Role', field: 'role', sortable: true, align: 'left' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'left' }
]
const options = ['Admin', 'Editor', 'Advertiser', 'User']

function onSelect(selected) {
  selectedRows.value = selected.filter((item) => item.role !== 'Admin')
}

function confirmDelete(row) {
  selectedRows.value = [row]
  deleteDialog.value = true
}

function confirmDeleteMultiple() {
  deleteDialog.value = true
}

async function deleteUsers() {
  for (const row of selectedRows.value) {
    await userStore.deleteUser(row.uid)
  }
  deleteDialog.value = false
  selectedRows.value = []
}
</script>
