import { ref } from 'vue'
import axios from 'axios'

export function useChangePassword() {
  const loading = ref(false)
  const error = ref('')

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    loading.value = true
    error.value = ''

    try {
      const response = await axios.post('/Auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      })

      return {
        success: true,
        message: response.data.message
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
      error.value = errorMessage
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = ''
  }

  return {
    loading,
    error,
    changePassword,
    clearError
  }
}
