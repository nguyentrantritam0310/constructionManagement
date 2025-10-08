import { ref } from 'vue'
import api from '../api.js'

export function useUser() {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchUsers = async (roleName = null) => {
    try {
      let res
      if (roleName && roleName !== 'all') {
        res = await api.get(`/ApplicationUser/${roleName}`)
      } else {
        res = await api.get('/ApplicationUser')
      }
      users.value = res.data
      console.log('Fetched users:', users.value)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
  }
}
