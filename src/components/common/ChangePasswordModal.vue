<template>
  <ModalDialog 
    :show="show" 
    title="Đổi mật khẩu" 
    size="md"
    :closable="!isRequiredPasswordChange"
    @update:show="$emit('update:show', $event)"
  >
    <div class="change-password-form">
      <div class="alert alert-warning mb-3" v-if="isRequiredPasswordChange">
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Yêu cầu bảo mật bắt buộc:</strong>
        <span>
          Bạn đang sử dụng mật khẩu mặc định. Vui lòng đổi mật khẩu ngay để đảm bảo tài khoản của bạn được bảo vệ tốt hơn.
        </span>
      </div>

      <div class="alert alert-info mb-3" v-else>
        <i class="fas fa-info-circle"></i>
        <strong>Đổi mật khẩu:</strong>
        <span>
          Bạn có thể đổi mật khẩu để tăng cường bảo mật cho tài khoản của mình.
        </span>
      </div>

      <form @submit.prevent="handleChangePassword">
        <div class="form-group mb-3">
          <label for="currentPassword" class="form-label">
            <i class="fas fa-lock"></i>
            Mật khẩu hiện tại
          </label>
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            type="password"
            class="form-control"
            placeholder="Nhập mật khẩu hiện tại"
            required
            :disabled="loading"
          >
        </div>

        <div class="form-group mb-3">
          <label for="newPassword" class="form-label">
            <i class="fas fa-key"></i>
            Mật khẩu mới
          </label>
          <input
            id="newPassword"
            v-model="form.newPassword"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': form.newPassword && !passwordValidation.isValid }"
            placeholder="Nhập mật khẩu mới (8+ ký tự, chữ hoa, thường, số, ký tự đặc biệt)"
            required
            minlength="8"
            :disabled="loading"
          >
          
          <!-- Password Strength Indicator -->
          <div v-if="form.newPassword" class="password-strength mt-2">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                :class="`strength-${passwordStrength.color}`"
                :style="{ width: `${(passwordStrength.score / 5) * 100}%` }"
              ></div>
            </div>
            <small class="strength-text" :class="`text-${passwordStrength.color}`">
              Độ mạnh: {{ passwordStrength.label }}
            </small>
          </div>

          <!-- Password Requirements -->
          <div v-if="form.newPassword" class="password-requirements mt-2">
            <div 
              v-for="(result, key) in passwordValidation.results" 
              :key="key"
              class="requirement-item"
              :class="{ 'valid': result.valid, 'invalid': !result.valid }"
            >
              <i :class="result.valid ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
              <span>{{ result.message }}</span>
            </div>
          </div>
          
          <div v-else class="form-text">
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
          </div>
        </div>

        <div class="form-group mb-4">
          <label for="confirmPassword" class="form-label">
            <i class="fas fa-check-circle"></i>
            Xác nhận mật khẩu mới
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-control"
            placeholder="Nhập lại mật khẩu mới"
            required
            :disabled="loading"
          >
          <div v-if="form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword" 
               class="form-text text-danger">
            <i class="fas fa-times-circle"></i>
            Mật khẩu xác nhận không khớp
          </div>
          <div v-else-if="form.newPassword && form.confirmPassword && form.newPassword === form.confirmPassword" 
               class="form-text text-success">
            <i class="fas fa-check-circle"></i>
            Mật khẩu xác nhận khớp
          </div>
        </div>

        <div v-if="error" class="alert alert-danger mb-3">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <div class="d-flex gap-2 justify-content-end">
          <!-- Chỉ hiển thị nút Hủy khi không bắt buộc đổi mật khẩu -->
          <button 
            v-if="!isRequiredPasswordChange"
            type="button" 
            class="btn btn-secondary"
            @click="$emit('update:show', false)"
            :disabled="loading"
          >
            <i class="fas fa-times"></i>
            Hủy
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading || !isFormValid"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-save"></i>
            {{ loading ? 'Đang lưu...' : 'Lưu mật khẩu' }}
          </button>
        </div>
      </form>
    </div>
  </ModalDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useChangePassword } from '@/composables/useChangePassword'
import { usePasswordValidation } from '@/composables/usePasswordValidation'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'success', 'password-changed'])

const { currentUser } = useAuth()
const { loading, error, changePassword, clearError } = useChangePassword()
const { validatePassword, getPasswordStrength } = usePasswordValidation()

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password validation
const passwordValidation = computed(() => {
  if (!form.value.newPassword) return { isValid: false, results: {} }
  return validatePassword(form.value.newPassword)
})

// Password strength
const passwordStrength = computed(() => {
  return getPasswordStrength(form.value.newPassword)
})

const isFormValid = computed(() => {
  return form.value.currentPassword && 
         form.value.newPassword && 
         form.value.confirmPassword &&
         passwordValidation.value.overallValid &&
         form.value.newPassword === form.value.confirmPassword
})

// Kiểm tra xem có bắt buộc đổi mật khẩu không
const isRequiredPasswordChange = computed(() => {
  return props.isRequired
})

const handleChangePassword = async () => {
  if (!isFormValid.value) return

  clearError()

  const result = await changePassword(
    form.value.currentPassword,
    form.value.newPassword,
    form.value.confirmPassword
  )

  if (result.success) {
    // Reset form
    form.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    emit('success', result.message)
    emit('password-changed', result.message)
    emit('update:show', false)
  }
}

// Reset form when modal is closed
const resetForm = () => {
  form.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  clearError()
}

// Watch for show prop changes to reset form
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
.change-password-form {
  padding: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #495057;
}

.form-label i {
  color: #6c757d;
  width: 16px;
}

.form-control {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  outline: none;
}

.form-control:disabled {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.form-text {
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.alert {
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-warning {
  background-color: #fff3cd;
  border-color: #ffeaa7;
  color: #856404;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.btn {
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #3498db;
  border-color: #3498db;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
  border-color: #2980b9;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  border-color: #5a6268;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.gap-2 {
  gap: 0.5rem !important;
}

.justify-content-end {
  justify-content: flex-end !important;
}

.d-flex {
  display: flex !important;
}

.mb-3 {
  margin-bottom: 1rem !important;
}

.mb-4 {
  margin-bottom: 1.5rem !important;
}

.fa-spin {
  animation: fa-spin 1s infinite linear;
}

@keyframes fa-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Password Strength Indicator */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-danger {
  background-color: #dc3545;
}

.strength-warning {
  background-color: #ffc107;
}

.strength-success {
  background-color: #28a745;
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Password Requirements */
.password-requirements {
  margin-top: 0.5rem;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.requirement-item i {
  width: 16px;
  font-size: 0.75rem;
}

.requirement-item.valid {
  color: #28a745;
}

.requirement-item.invalid {
  color: #dc3545;
}

/* Form validation states */
.form-control.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.text-danger {
  color: #dc3545 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-success {
  color: #28a745 !important;
}
</style>
