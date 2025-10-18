<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import { useEmployee } from '@/composables/useEmployee'
import { useOvertimeType } from '../../../composables/useOvertimeType.js'
import { useOvertimeForm } from '../../../composables/useOvertimeForm.js'

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
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

// Computed property to get selected overtime type
const selectedOvertimeType = computed(() => {
  return overtimeTypes.value.find(type => type.id === formData.value.overtimeTypeID)
})

// Watch for changes in overtimeTypeID to auto-set coefficient
watch(() => formData.value.overtimeTypeID, (newTypeID) => {
  if (newTypeID && selectedOvertimeType.value) {
    formData.value.coefficient = selectedOvertimeType.value.coefficient
  }
})

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.voucherCode.trim()) {
    errors.value.voucherCode = 'Số phiếu là bắt buộc'
  }
  
  if (!formData.value.employeeID) {
    errors.value.employeeID = 'Nhân viên là bắt buộc'
  }
  
  if (!formData.value.overtimeTypeID) {
    errors.value.overtimeTypeID = 'Loại tăng ca là bắt buộc'
  }
  
  if (!formData.value.overtimeFormID) {
    errors.value.overtimeFormID = 'Hình thức tăng ca là bắt buộc'
  }
  
  if (!formData.value.coefficient || formData.value.coefficient <= 0) {
    errors.value.coefficient = 'Hệ số phải lớn hơn 0'
  }
  
  if (!formData.value.startDateTime) {
    errors.value.startDateTime = 'Ngày bắt đầu là bắt buộc'
  }
  
  if (!formData.value.endDateTime) {
    errors.value.endDateTime = 'Ngày kết thúc là bắt buộc'
  }
  
  if (!formData.value.reason.trim()) {
    errors.value.reason = 'Lý do là bắt buộc'
  }
  
  // Validate date range
  if (formData.value.startDateTime && formData.value.endDateTime) {
    const startDate = new Date(formData.value.startDateTime)
    const endDate = new Date(formData.value.endDateTime)
    
    if (startDate >= endDate) {
      errors.value.endDateTime = 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validateForm()) {
    // Convert datetime-local to proper format for API
    const submitData = {
      ...formData.value,
      startDateTime: new Date(formData.value.startDateTime).toISOString(),
      endDateTime: new Date(formData.value.endDateTime).toISOString()
    }
    emit('submit', submitData)
  }
}

const handleClose = () => emit('close')

const handleSubmitForApproval = () => {
  if (validateForm()) {
    // Convert datetime-local to proper format for API
    const submitData = {
      ...formData.value,
      startDateTime: new Date(formData.value.startDateTime).toISOString(),
      endDateTime: new Date(formData.value.endDateTime).toISOString()
    }
    emit('submit-for-approval', submitData.voucherCode)
  }
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
        <FormField 
          label="Số phiếu" 
          type="text" 
          v-model="formData.voucherCode" 
          :error="errors.voucherCode"
          required 
        />
      </div>
      <div class="col-md-6">
        <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.employeeID" 
          :class="{ 'is-invalid': errors.employeeID }"
        >
          <option value="">Chọn nhân viên</option>
          <option v-for="emp in employees" :key="emp.id" :value="emp.id">
            {{ emp.employeeName }}
          </option>
        </select>
        <div v-if="errors.employeeID" class="invalid-feedback">
          {{ errors.employeeID }}
        </div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Loại tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeTypeID" 
          :class="{ 'is-invalid': errors.overtimeTypeID }"
        >
          <option value="">Chọn loại tăng ca</option>
          <option v-for="type in overtimeTypes" :key="type.id" :value="type.id">
            {{ type.overtimeTypeName }}
          </option>
        </select>
        <div v-if="errors.overtimeTypeID" class="invalid-feedback">
          {{ errors.overtimeTypeID }}
        </div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hình thức tăng ca <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          v-model="formData.overtimeFormID" 
          :class="{ 'is-invalid': errors.overtimeFormID }"
        >
          <option value="">Chọn hình thức tăng ca</option>
          <option v-for="form in overtimeForms" :key="form.id" :value="form.id">
            {{ form.overtimeFormName }}
          </option>
        </select>
        <div v-if="errors.overtimeFormID" class="invalid-feedback">
          {{ errors.overtimeFormID }}
        </div>
      </div>
      <div class="col-md-4">
        <FormField 
          label="Hệ số" 
          type="number" 
          v-model="formData.coefficient" 
          :error="errors.coefficient"
          :disabled="!!formData.overtimeTypeID"
          step="0.1"
        />
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-6">
        <FormField 
          label="Ngày bắt đầu" 
          type="datetime-local" 
          v-model="formData.startDateTime" 
          :error="errors.startDateTime"
          required 
        />
      </div>
      <div class="col-md-6">
        <FormField 
          label="Ngày kết thúc" 
          type="datetime-local" 
          v-model="formData.endDateTime" 
          :error="errors.endDateTime"
          required 
        />
      </div>
    </div>
    <div class="row g-3">
      <div class="col-md-12">
        <FormField 
          label="Lý do" 
          type="textarea" 
          v-model="formData.reason" 
          :error="errors.reason"
          required 
        />
      </div>
    </div>
    <div class="mt-4 d-flex justify-content-end gap-2">
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
  </form>
</template>
