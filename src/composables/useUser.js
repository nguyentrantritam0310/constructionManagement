import { ref } from 'vue'
import api from '../api.js'

export function useUser() {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchUsers = async (roleName) => {
    try {
      const res = await api.get(`/ApplicationUser/${roleName}`)
      users.value = res.data
      console.log('Fetched:', users.value)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
  }
}
