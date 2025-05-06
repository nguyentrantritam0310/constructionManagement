import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const currentUser = ref(null)
const token = ref(localStorage.getItem('token'))
const refreshToken = ref(localStorage.getItem('refreshToken'))

// Hàm để lấy thông tin user từ token
const getUserFromToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const data = JSON.parse(jsonPayload);
    console.log('Token data:', data); // Debug log

    // Try different role claim keys
    const role = data['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
                data['role'] ||
                data['Role'] ||
                'User';

    return {
      id: data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      fullName: data['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      role: role
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Khởi tạo currentUser từ token nếu có
if (token.value) {
  currentUser.value = getUserFromToken(token.value)
}

// Cấu hình axios
axios.defaults.baseURL = 'http://localhost:5244/api'
axios.interceptors.request.use(config => {
  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`
  }
  return config
})

// Xử lý refresh token
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const response = await axios.post('/auth/refresh-token', {
          token: token.value,
          refreshToken: refreshToken.value
        })
        const { token: newToken, refreshToken: newRefreshToken } = response.data
        token.value = newToken
        refreshToken.value = newRefreshToken
        localStorage.setItem('token', newToken)
        localStorage.setItem('refreshToken', newRefreshToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return axios(originalRequest)
      } catch (error) {
        logout()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  const userRole = computed(() => currentUser.value?.role)

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { token: newToken, refreshToken: newRefreshToken, message } = response.data

      token.value = newToken
      refreshToken.value = newRefreshToken
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', newRefreshToken)

      // Lấy thông tin user từ token
      currentUser.value = getUserFromToken(newToken)

      router.push('/')
      return { success: true, message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      return { success: true, message: response.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng ký thất bại'
      }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      refreshToken.value = null
      currentUser.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    if (!token.value) return false

    try {
      const response = await axios.get('/auth/me')
      currentUser.value = response.data
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    currentUser,
    isAuthenticated,
    userRole,
    login,
    logout,
    register,
    checkAuth
  }
}
