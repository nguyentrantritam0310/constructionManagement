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
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
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
axios.defaults.baseURL = import.meta.env.VITE_API_URL + '/api'
axios.interceptors.request.use(config => {
  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`
  }
  return config
})

// Xử lý refresh token
// axios.interceptors.response.use(
//   response => response,
//   async error => {
//     const originalRequest = error.config
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true
//       try {
//         const response = await axios.post('/auth/refresh-token', {
//           token: token.value,
//           refreshToken: refreshToken.value
//         })
//         const { token: newToken, refreshToken: newRefreshToken } = response.data
//         token.value = newToken
//         refreshToken.value = newRefreshToken
//         localStorage.setItem('token', newToken)
//         localStorage.setItem('refreshToken', newRefreshToken)
//         originalRequest.headers.Authorization = `Bearer ${newToken}`
//         return axios(originalRequest)
//       } catch (error) {
//         logout()
//         return Promise.reject(error)
//       }
//     }
//     return Promise.reject(error)
//   }
// )

axios.interceptors.response.use(
  response => response,
  async error => {
    // Kiểm tra tồn tại error.response trước khi truy cập status
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post('/Auth/refresh-token', {
          token: token.value,
          refreshToken: refreshToken.value
        });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        token.value = newToken;
        refreshToken.value = newRefreshToken;
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  const userRole = computed(() => currentUser.value?.role)

  // Helper functions for role checking
  const isDirector = computed(() => {
    const role = currentUser.value?.role
    console.log('Checking isDirector, current role:', role)
    return role === 'director' || role === 'DIRECTOR' || role === '3'
  })
  const isHRManager = computed(() => {
    const role = currentUser.value?.role
    console.log('Checking isHRManager, current role:', role)
    return role === 'hr_manager' || role === 'HR_MANAGER' || role === '5'
  })
  const isHREmployee = computed(() => {
    const role = currentUser.value?.role
    console.log('Checking isHREmployee, current role:', role)
    return role === 'hr_employee' || role === 'HR_EMPLOYEE' || role === '6'
  })
  const isHRStaff = computed(() => {
    const result = isHRManager.value || isHREmployee.value
    console.log('Checking isHRStaff, result:', result, 'HRManager:', isHRManager.value, 'HREmployee:', isHREmployee.value)
    return result
  })
  const canManageAll = computed(() => {
    const result = isHRStaff.value
    console.log('Checking canManageAll, result:', result)
    return result
  })
  const canViewAll = computed(() => {
    const result = isDirector.value || isHRStaff.value
    console.log('Checking canViewAll, result:', result, 'Director:', isDirector.value, 'HRStaff:', isHRStaff.value)
    return result
  })
  const canEdit = computed(() => {
    // Allow editing for HR staff, and also for regular users on their own data
    const result = isHRStaff.value || !canViewAll.value
    console.log('Checking canEdit, result:', result, 'HRStaff:', isHRStaff.value, 'Not canViewAll:', !canViewAll.value)
    return result
  })

  const login = async (email, password) => {
    try {
      const response = await axios.post('/Auth/login', { email, password })
      const { token: newToken, refreshToken: newRefreshToken, message, requiresPasswordChange } = response.data

      token.value = newToken
      refreshToken.value = newRefreshToken
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', newRefreshToken)

      // Lấy thông tin user từ token
      currentUser.value = getUserFromToken(newToken)

      router.push('/')
      return { 
        success: true, 
        message, 
        requiresPasswordChange: requiresPasswordChange || false 
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Đăng nhập thất bại'
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/Auth/register', userData)
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
      await axios.post('/Auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = null
      refreshToken.value = null
      currentUser.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('requiresPasswordChange') // Xóa flag khi logout
      router.push('/login')
    }
  }

  const checkAuth = async () => {
    if (!token.value) return false

    try {
      const response = await axios.get('/Auth/me')
      currentUser.value = response.data
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  // Function to refresh user info and update token
  const refreshUserInfo = async () => {
    if (!token.value) return false
    
    try {
      console.log('Refreshing user info...')
      
      // Always try to get fresh user info from API first
      try {
        const response = await axios.get('/Auth/me')
        const userData = response.data
        
        // Update currentUser with fresh data from API
        currentUser.value = {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role
        }
        
        console.log('User info refreshed from API:', currentUser.value)
        
        // Try to refresh token to get updated JWT with new role
        if (refreshToken.value) {
          try {
            const tokenResponse = await axios.post('/Auth/refresh-token', {
              token: token.value,
              refreshToken: refreshToken.value
            })
            
            if (tokenResponse.data.token) {
              const newToken = tokenResponse.data.token
              token.value = newToken
              localStorage.setItem('token', newToken)
              
              // Update currentUser from new token as well
              const tokenUser = getUserFromToken(newToken)
              if (tokenUser) {
                currentUser.value = tokenUser
                console.log('Token refreshed and user updated:', currentUser.value)
              }
            }
          } catch (tokenError) {
            console.log('Token refresh failed, but user info updated from API')
          }
        }
        
        return true
      } catch (apiError) {
        console.log('API call failed, trying token refresh...')
        
        // Fallback: try token refresh
        if (refreshToken.value) {
          try {
            const tokenResponse = await axios.post('/Auth/refresh-token', {
              token: token.value,
              refreshToken: refreshToken.value
            })
            
            if (tokenResponse.data.token) {
              const newToken = tokenResponse.data.token
              token.value = newToken
              localStorage.setItem('token', newToken)
              
              // Update currentUser from new token
              currentUser.value = getUserFromToken(newToken)
              console.log('Token refreshed successfully:', currentUser.value)
              return true
            }
          } catch (tokenError) {
            console.log('Token refresh also failed')
          }
        }
        
        console.log('Using cached user info:', currentUser.value)
        return false
      }
    } catch (error) {
      console.error('Error refreshing user info:', error)
      return false
    }
  }

  // Force refresh user info - bypass cache and get fresh data
  const forceRefreshUserInfo = async () => {
    if (!token.value) return false
    
    try {
      console.log('Force refreshing user info...')
      
      // Always get fresh data from API
      const response = await axios.get('/Auth/me')
      const userData = response.data
      
      // Update currentUser with fresh data from API
      currentUser.value = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role
      }
      
      console.log('User info force refreshed from API:', currentUser.value)
      
      // Force refresh token to get updated JWT
      if (refreshToken.value) {
        try {
          const tokenResponse = await axios.post('/Auth/refresh-token', {
            token: token.value,
            refreshToken: refreshToken.value
          })
          
          if (tokenResponse.data.token) {
            const newToken = tokenResponse.data.token
            token.value = newToken
            localStorage.setItem('token', newToken)
            
            // Update currentUser from new token as well
            const tokenUser = getUserFromToken(newToken)
            if (tokenUser) {
              currentUser.value = tokenUser
              console.log('Token force refreshed and user updated:', currentUser.value)
            }
          }
        } catch (tokenError) {
          console.log('Token refresh failed, but user info updated from API')
        }
      }
      
      return true
    } catch (error) {
      console.error('Error force refreshing user info:', error)
      return false
    }
  }

  return {
    currentUser,
    isAuthenticated,
    userRole,
    isDirector,
    isHRManager,
    isHREmployee,
    isHRStaff,
    canManageAll,
    canViewAll,
    canEdit,
    login,
    logout,
    register,
    checkAuth,
    refreshUserInfo,
    forceRefreshUserInfo
  }
}
