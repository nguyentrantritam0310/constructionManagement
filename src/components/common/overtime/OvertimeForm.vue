<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import { useEmployee } from '@/composables/useEmployee'
import { useOvertimeType } from '../../../composables/useOvertimeType.js'
import { useOvertimeForm } from '../../../composables/useOvertimeForm.js'

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update', 'detail'].includes(v) },
  overtime: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit', 'submit-for-approval'])

// Composables
const { employees, fetchAllEmployees } = useEmployee()
const { overtimeTypes, fetchOvertimeTypes } = useOvertimeType()
const { overtimeForms, fetchOvertimeForms } = useOvertimeForm()

// Form data
const formData = ref({
  voucherCode: props.overtime.voucherCode || '',
  employeeID: props.overtime.employeeID || '',
  overtimeTypeID: props.overtime.overtimeTypeID || '',
  overtimeFormID: props.overtime.overtimeFormID || '',
  coefficient: props.overtime.coefficient || '',
  startDateTime: props.overtime.startDateTime || '',
  endDateTime: props.overtime.endDateTime || '',
  reason: props.overtime.reason || ''
})

// Validation
const errors = ref({})

// Regex patterns cho validation
const regexPatterns = {
  // Số phiếu: chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  voucherCode: /^[A-Za-z0-9_-]{1,50}$/,
  // DateTime-local: định dạng YYYY-MM-DDTHH:mm
  dateTimeLocal: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Hệ số: số thập phân dương (ví dụ: 1.5, 2.0, 0.5)
  coefficient: /^([1-9]\d*(\.\d{1,2})?|0\.\d{1,2}|0)$/,
  // Lý do: cho phép chữ, số, khoảng trắng, dấu câu, độ dài tối đa 500
  reason: /^[\s\S]{1,500}$/
}

// Computed property to get selected overtime type
const selectedOvertimeType = computed(() => {
  return overtimeTypes.value.find(type => type.id === formData.value.overtimeTypeID)
})

// Watch for changes in overtimeTypeID to auto-set coefficient
watch(() => formData.value.overtimeTypeID, (newTypeID) => {
  if (newTypeID && selectedOvertimeType.value) {
    formData.value.coefficient = selectedOvertimeType.value.coefficient
    // Validate coefficient after auto-set
    if (formData.value.coefficient) {
      validateField('coefficient')
    }
  }
})

// Validation functions
const validateVoucherCode = () => {
  const value = formData.value.voucherCode?.trim()
  if (!value) {
    errors.value.voucherCode = 'Số phiếu không được để trống'
    return false
  }
  if (!regexPatterns.voucherCode.test(value)) {
    errors.value.voucherCode = 'Số phiếu chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 50 ký tự)'
    return false
  }
  errors.value.voucherCode = ''
  return true
}

const validateEmployeeID = () => {
  const value = formData.value.employeeID
  if (!value) {
    errors.value.employeeID = 'Nhân viên là bắt buộc'
    return false
  }
  errors.value.employeeID = ''
  return true
}

const validateOvertimeTypeID = () => {
  const value = formData.value.overtimeTypeID
  if (!value) {
    errors.value.overtimeTypeID = 'Loại tăng ca là bắt buộc'
    return false
  }
  if (!regexPatterns.id.test(String(value))) {
    errors.value.overtimeTypeID = 'Loại tăng ca không hợp lệ'
    return false
  }
  errors.value.overtimeTypeID = ''
  return true
}

const validateOvertimeFormID = () => {
  const value = formData.value.overtimeFormID
  if (!value) {
    errors.value.overtimeFormID = 'Hình thức tăng ca là bắt buộc'
    return false
  }
  if (!regexPatterns.id.test(String(value))) {
    errors.value.overtimeFormID = 'Hình thức tăng ca không hợp lệ'
    return false
  }
  errors.value.overtimeFormID = ''
  return true
}

const validateCoefficient = () => {
  const value = formData.value.coefficient
  if (value === null || value === undefined || value === '') {
    errors.value.coefficient = 'Hệ số không được để trống'
    return false
  }
  
  const coefficientNum = parseFloat(value)
  if (isNaN(coefficientNum)) {
    errors.value.coefficient = 'Hệ số phải là số'
    return false
  }
  
  if (coefficientNum <= 0) {
    errors.value.coefficient = 'Hệ số phải lớn hơn 0'
    return false
  }
  
  // Validate format: tối đa 2 chữ số thập phân
  const valueStr = String(value)
  if (!regexPatterns.coefficient.test(valueStr)) {
    errors.value.coefficient = 'Hệ số không đúng định dạng'
    return false
  }
  
  // Validate decimal places
  const decimalPlaces = (valueStr.split('.')[1] || '').length
  if (decimalPlaces > 2) {
    errors.value.coefficient = 'Hệ số chỉ được có tối đa 2 chữ số thập phân'
    return false
  }
  
  // Giới hạn hệ số (ví dụ: 0.01 đến 10.0)
  if (coefficientNum > 10) {
    errors.value.coefficient = 'Hệ số không được lớn hơn 10'
    return false
  }
  
  errors.value.coefficient = ''
  return true
}

const validateStartDateTime = () => {
  const value = formData.value.startDateTime
  if (!value) {
    errors.value.startDateTime = 'Ngày bắt đầu là bắt buộc'
    return false
  }
  if (!regexPatterns.dateTimeLocal.test(value)) {
    errors.value.startDateTime = 'Định dạng ngày giờ không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime())) {
    errors.value.startDateTime = 'Ngày giờ bắt đầu không hợp lệ'
    return false
  }
  
  // Validate start date is before end date
  if (formData.value.endDateTime) {
    const endDate = new Date(formData.value.endDateTime)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDateTime = 'Ngày bắt đầu phải trước ngày kết thúc'
      return false
    }
  }
  
  errors.value.startDateTime = ''
  return true
}

const validateEndDateTime = () => {
  const value = formData.value.endDateTime
  if (!value) {
    errors.value.endDateTime = 'Ngày kết thúc là bắt buộc'
    return false
  }
  if (!regexPatterns.dateTimeLocal.test(value)) {
    errors.value.endDateTime = 'Định dạng ngày giờ không hợp lệ'
    return false
  }
  
  const endDate = new Date(value)
  if (isNaN(endDate.getTime())) {
    errors.value.endDateTime = 'Ngày giờ kết thúc không hợp lệ'
    return false
  }
  
  // Validate end date is after start date
  if (formData.value.startDateTime) {
    const startDate = new Date(formData.value.startDateTime)
    if (!isNaN(startDate.getTime()) && startDate >= endDate) {
      errors.value.endDateTime = 'Ngày kết thúc phải sau ngày bắt đầu'
      return false
    }
    
    // Validate duration (không được quá 24 giờ trong một lần tăng ca)
    const durationMs = endDate - startDate
    const durationHours = durationMs / (1000 * 60 * 60)
    if (durationHours > 24) {
      errors.value.endDateTime = 'Thời gian tăng ca không được vượt quá 24 giờ'
      return false
    }
    if (durationHours <= 0) {
      errors.value.endDateTime = 'Thời gian tăng ca phải lớn hơn 0'
      return false
    }
  }
  
  errors.value.endDateTime = ''
  return true
}

const validateReason = () => {
  const value = formData.value.reason?.trim() || ''
  if (!value) {
    errors.value.reason = 'Lý do là bắt buộc'
    return false
  }
  if (value.length < 1 || value.length > 500) {
    errors.value.reason = 'Lý do phải từ 1 đến 500 ký tự'
    return false
  }
  errors.value.reason = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'voucherCode':
      validateVoucherCode()
      break
    case 'employeeID':
      validateEmployeeID()
      break
    case 'overtimeTypeID':
      validateOvertimeTypeID()
      break
    case 'overtimeFormID':
      validateOvertimeFormID()
      break
    case 'coefficient':
      validateCoefficient()
      break
    case 'startDateTime':
      validateStartDateTime()
      // Re-validate end date when start date changes
      if (formData.value.endDateTime) {
        validateEndDateTime()
      }
      break
    case 'endDateTime':
      validateEndDateTime()
      // Re-validate start date when end date changes
      if (formData.value.startDateTime) {
        validateStartDateTime()
      }
      break
    case 'reason':
      validateReason()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateVoucherCode(),
    validateEmployeeID(),
    validateOvertimeTypeID(),
    validateOvertimeFormID(),
    validateCoefficient(),
    validateStartDateTime(),
    validateEndDateTime(),
    validateReason()
  ]
  
  return validations.every(v => v === true)
}

const handleSubmit = () => {
  // Validate form trước khi submit
  if (!validateForm()) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  // Convert datetime-local to proper format for API
  const submitData = {
    ...formData.value,
    voucherCode: formData.value.voucherCode.trim(),
    reason: formData.value.reason.trim(),
    coefficient: parseFloat(formData.value.coefficient),
    startDateTime: new Date(formData.value.startDateTime).toISOString(),
    endDateTime: new Date(formData.value.endDateTime).toISOString()
  }
  emit('submit', submitData)
}

const handleClose = () => emit('close')

const handleSubmitForApproval = () => {
  // Validate form trước khi submit
  if (!validateForm()) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  // Convert datetime-local to proper format for API
  const submitData = {
    ...formData.value,
    voucherCode: formData.value.voucherCode.trim(),
    reason: formData.value.reason.trim(),
    coefficient: parseFloat(formData.value.coefficient),
    startDateTime: new Date(formData.value.startDateTime).toISOString(),
    endDateTime: new Date(formData.value.endDateTime).toISOString()
  }
  emit('submit-for-approval', submitData.voucherCode)
}

// Load data on mount
onMounted(async () => {
  try {
    await Promise.all([
      fetchAllEmployees(),
      fetchOvertimeTypes(),
      fetchOvertimeForms()
    ])
    
    console.log('Loaded data:', {
      employees: employees.value,
      overtimeTypes: overtimeTypes.value,
      overtimeForms: overtimeForms.value
    })
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

// Watch for changes in overtime prop
watch(() => props.overtime, (newOvertime) => {
  if (newOvertime && Object.keys(newOvertime).length > 0) {
    formData.value = {
      voucherCode: newOvertime.voucherCode || '',
      employeeID: newOvertime.employeeID || '',
      overtimeTypeID: newOvertime.overtimeTypeID || '',
      overtimeFormID: newOvertime.overtimeFormID || '',
      coefficient: newOvertime.coefficient || '',
      startDateTime: newOvertime.startDateTime ? new Date(newOvertime.startDateTime).toISOString().slice(0, 16) : '',
      endDateTime: newOvertime.endDateTime ? new Date(newOvertime.endDateTime).toISOString().slice(0, 16) : '',
      reason: newOvertime.reason || ''
    }
  }
}, { immediate: true })
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Số phiếu <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.voucherCode }"
          v-model="formData.voucherCode"
          @blur="validateField('voucherCode')"
          @input="validateField('voucherCode')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          maxlength="50"
          placeholder="VD: TC-2024-001"
        />
        <div class="invalid-feedback">{{ errors.voucherCode }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.employeeID" 
          :class="{ 'is-invalid': errors.employeeID }"
          @change="validateField('employeeID')"
          :disabled="props.mode === 'detail'"
        >
          <option value="">Chọn nhân viên</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.employeeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.employeeID }}</div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Loại tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeTypeID" 
          :class="{ 'is-invalid': errors.overtimeTypeID }"
          @change="validateField('overtimeTypeID')"
          :disabled="props.mode === 'detail'"
        >
          <option value="">Chọn loại tăng ca</option>
          <option v-for="type in overtimeTypes" :key="type.id" :value="type.id">
            {{ type.overtimeTypeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.overtimeTypeID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hình thức tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeFormID" 
          :class="{ 'is-invalid': errors.overtimeFormID }"
          @change="validateField('overtimeFormID')"
          :disabled="props.mode === 'detail'"
        >
          <option value="">Chọn hình thức tăng ca</option>
          <option v-for="form in overtimeForms" :key="form.id" :value="form.id">
            {{ form.overtimeFormName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.overtimeFormID }}</div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hệ số <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.coefficient }"
          v-model.number="formData.coefficient"
          @blur="validateField('coefficient')"
          @input="validateField('coefficient')"
          :disabled="props.mode === 'detail' || !!formData.overtimeTypeID"
          :readonly="props.mode === 'detail'"
          step="0.01"
          min="0.01"
          max="10"
          placeholder="1.0"
        />
        <div class="invalid-feedback">{{ errors.coefficient }}</div>
        <small v-if="formData.overtimeTypeID" class="form-text text-muted">
          Hệ số được tự động cập nhật từ loại tăng ca
        </small>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Ngày bắt đầu <span class="text-danger">*</span></label>
        <input 
          type="datetime-local" 
          class="form-control" 
          :class="{ 'is-invalid': errors.startDateTime }"
          v-model="formData.startDateTime"
          @blur="validateField('startDateTime')"
          @change="validateField('startDateTime')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
        />
        <div class="invalid-feedback">{{ errors.startDateTime }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Ngày kết thúc <span class="text-danger">*</span></label>
        <input 
          type="datetime-local" 
          class="form-control" 
          :class="{ 'is-invalid': errors.endDateTime }"
          v-model="formData.endDateTime"
          @blur="validateField('endDateTime')"
          @change="validateField('endDateTime')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
        />
        <div class="invalid-feedback">{{ errors.endDateTime }}</div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-12">
        <label class="form-label">Lý do <span class="text-danger">*</span></label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.reason }"
          v-model="formData.reason"
          @blur="validateField('reason')"
          @input="validateField('reason')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          rows="3"
          maxlength="500"
          placeholder="Nhập lý do tăng ca (tối đa 500 ký tự)..."
        ></textarea>
        <div class="invalid-feedback">{{ errors.reason }}</div>
        <small class="form-text text-muted">{{ (formData.reason || '').length }}/500 ký tự</small>
      </div>
    </div>
    <div v-if="props.mode !== 'detail'" class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Đang xử lý...' : (props.mode === 'update' ? 'Cập nhật' : 'Tạo mới') }}
      </button>
      <!-- Show "Gửi duyệt" button only for update mode and when status is "Tạo mới" (0) -->
      <button 
        v-if="props.mode === 'update' && (props.overtime.approveStatus == 0 || props.overtime.approveStatus === '0')" 
        type="button" 
        class="btn btn-success" 
        @click="handleSubmitForApproval"
        :disabled="loading"
      >
        {{ loading ? 'Đang xử lý...' : 'Gửi duyệt' }}
      </button>
    </div>
    <div v-else class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Đóng</button>
    </div>
  </form>
</template>
