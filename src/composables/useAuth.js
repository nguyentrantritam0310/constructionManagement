import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const currentUser = ref(null)

// Dữ liệu giả lập users
const users = [
  {
    username: 'nvkt',
    password: '123',
    role: 'technician',
    fullName: 'Nhân viên kỹ thuật'
  },
  {
    username: 'chct',
    password: '123',
    role: 'construction_leader',
    fullName: 'Chỉ huy công trình'
  },
  {
    username: 'gd',
    password: '123',
    role: 'director',
    fullName: 'Giám đốc'
  }
]

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!currentUser.value)

  const userRole = computed(() => currentUser.value?.role)

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password)
    if (user) {
      currentUser.value = user
      router.push('/')
      return true
    }
    return false
  }

  const logout = () => {
    currentUser.value = null
    router.push('/login')
  }

  return {
    currentUser,
    isAuthenticated,
    userRole,
    login,
    logout
  }
}