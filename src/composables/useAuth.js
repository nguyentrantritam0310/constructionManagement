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
    return null;
  }
};

// Khởi tạo currentUser từ token nếu có (tạm thời, sẽ được cập nhật khi checkAuth được gọi)
// Lưu ý: Role từ token có thể không chính xác, nên luôn gọi checkAuth() sau khi app khởi động
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

axios.interceptors.response.use(
  response => response,
  async error => {
    if (!error.response) {
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

  const isDirector = computed(() => {
    const role = currentUser.value?.role
    return role === 'director' || role === 'DIRECTOR' || role === '3'
  })

  const isHRManager = computed(() => {
    const role = currentUser.value?.role
    return role === 'hr_manager' || role === 'HR_MANAGER' || role === '5'
  })

  const isHREmployee = computed(() => {
    const role = currentUser.value?.role
    return role === 'hr_employee' || role === 'HR_EMPLOYEE' || role === '6'
  })

  const isHRStaff = computed(() => {
    return isHRManager.value || isHREmployee.value
  })

  const canManageAll = computed(() => {
    return isHRStaff.value
  })

  const canViewAll = computed(() => {
    return isDirector.value || isHRStaff.value
  })

  const canEdit = computed(() => {
    return isHRStaff.value || !canViewAll.value
  })

  const login = async (email, password) => {
    try {
      const response = await axios.post('/Auth/login', { email, password })
      const { token: newToken, refreshToken: newRefreshToken, message, requiresPasswordChange } = response.data

      token.value = newToken
      refreshToken.value = newRefreshToken
      localStorage.setItem('token', newToken)
      localStorage.setItem('refreshToken', newRefreshToken)

      // Lấy thông tin user từ API để đảm bảo role chính xác từ database
      // Thay vì lấy từ token (có thể có role cũ)
      try {
        const userResponse = await axios.get('/Auth/me')
        currentUser.value = userResponse.data
      } catch (userError) {
        // Nếu API /Auth/me fail, fallback về token
        console.warn('Failed to fetch user info from API, using token instead:', userError)
        currentUser.value = getUserFromToken(newToken)
      }

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
      // Logout silently even if API call fails
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
      // Sử dụng updateUserFromResponse để map role đúng
      updateUserFromResponse(response.data)
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  // Hàm map role từ backend sang frontend
  const mapRoleFromBackend = (backendRole) => {
    if (!backendRole) return null
    
    const roleLower = backendRole.toLowerCase()
    
    // Map các role từ backend
    const roleMap = {
      'user': 'worker', // Backend trả về 'user' cho worker
      'worker': 'worker',
      'technician': 'technician',
      'manager': 'manager',
      'director': 'director',
      'hr_manager': 'hr_manager',
      'hr_employee': 'hr_employee',
      // Map từ Vietnamese nếu có
      'nhân viên thợ': 'worker',
      'nhân viên kỹ thuật': 'technician',
      'chỉ huy công trình': 'manager',
      'giám đốc': 'director',
      'trưởng phòng hành chính – nhân sự': 'hr_manager',
      'nhân viên phòng hành chính - nhân sự': 'hr_employee'
    }
    
    return roleMap[roleLower] || backendRole
  }

  const updateUserFromResponse = (userData) => {
    // Map role từ backend sang frontend
    const mappedRole = mapRoleFromBackend(userData.role)
    
    currentUser.value = {
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName,
      role: mappedRole || userData.role
    }
    
    console.log('=== USER ROLE MAPPING ===')
    console.log('Backend role:', userData.role)
    console.log('Mapped role:', mappedRole)
    console.log('Final role:', currentUser.value.role)
  }

  const refreshTokenAsync = async () => {
    if (!refreshToken.value) return false

    try {
      const tokenResponse = await axios.post('/Auth/refresh-token', {
        token: token.value,
        refreshToken: refreshToken.value
      })

      if (tokenResponse.data.token) {
        const newToken = tokenResponse.data.token
        token.value = newToken
        localStorage.setItem('token', newToken)

        // Sau khi refresh token, lấy thông tin user mới nhất từ API
        // để đảm bảo role chính xác từ database
        try {
          const userResponse = await axios.get('/Auth/me')
          currentUser.value = userResponse.data
        } catch (userError) {
          // Nếu API /Auth/me fail, fallback về token
          console.warn('Failed to fetch user info from API after token refresh, using token instead:', userError)
          const tokenUser = getUserFromToken(newToken)
          if (tokenUser) {
            currentUser.value = tokenUser
          }
        }
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const refreshUserInfo = async () => {
    if (!token.value) return false

    try {
      const response = await axios.get('/Auth/me')
      updateUserFromResponse(response.data)

      if (refreshToken.value) {
        await refreshTokenAsync()
      }

      return true
    } catch (error) {
      if (refreshToken.value) {
        return await refreshTokenAsync()
      }
      return false
    }
  }

  const forceRefreshUserInfo = async () => {
    if (!token.value) return false

    try {
      const response = await axios.get('/Auth/me')
      updateUserFromResponse(response.data)

      if (refreshToken.value) {
        await refreshTokenAsync()
      }

      return true
    } catch (error) {
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
