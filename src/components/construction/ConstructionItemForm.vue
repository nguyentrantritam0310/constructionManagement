<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useConstructionItem } from '../../composables/useConstructionItem'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useWorkSubTypeVariant } from '../../composables/useWorkSubTypeVariant'
import { useUnitofMeasurement } from '../../composables/useUnitofMeasurement'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  item: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const { showMessage } = useGlobalMessage()
const { createConstructionItem, updateConstructionItem } = useConstructionItem()
const { variants, loadVariants } = useWorkSubTypeVariant()
const { unitMeasurements, loadUnitMeasurements } = useUnitofMeasurement()

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  constructionItemName: '',
  startDate: '',
  expectedCompletionDate: '',
  totalVolume: '',
  unitOfMeasurementID: '',
  workSubTypeVariantID: '',
})

const formError = ref('')
const isSubmitting = ref(false)

// Regex patterns cho validation
const regexPatterns = {
  // Tên hạng mục: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu gạch ngang và gạch dưới, độ dài 1-200
  constructionItemName: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_-]{1,200}$/,
  // Ngày: định dạng YYYY-MM-DD
  date: /^\d{4}-\d{2}-\d{2}$/,
  // Khối lượng: số dương, có thể có số thập phân (2 chữ số)
  totalVolume: /^[1-9]\d{0,9}(\.\d{1,2})?$|^0\.\d{1,2}$/
}

// Validation errors
const errors = ref({
  constructionItemName: '',
  startDate: '',
  expectedCompletionDate: '',
  totalVolume: '',
  unitOfMeasurementID: '',
  workSubTypeVariantID: ''
})

// Initialize form data if in update mode
const initFormData = () => {
  if (props.mode === 'update' && props.item) {
    formData.value = {
      constructionItemName: props.item.constructionItemName || '',
      startDate: props.item.startDate ? new Date(props.item.startDate).toISOString().split('T')[0] : '',
      expectedCompletionDate: props.item.expectedCompletionDate ? new Date(props.item.expectedCompletionDate).toISOString().split('T')[0] : '',
      totalVolume: props.item.totalVolume || '',
      unitOfMeasurementID: props.item.unitOfMeasurementID || '',
      workSubTypeVariantID: props.item.workSubTypeVariantID || '',
    }
  } else {
    // Reset form for create mode
    formData.value = {
      constructionItemName: '',
      startDate: '',
      expectedCompletionDate: '',
      totalVolume: '',
      unitOfMeasurementID: '',
      workSubTypeVariantID: '',
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadVariants(), loadUnitMeasurements()])
    initFormData()
  } catch (error) {
    console.error('Error loading form data:', error)
    showMessage('Không thể tải dữ liệu form', 'error')
  }
})

// Watch for changes in item prop
watch(() => props.item, (newItem) => {
  if (props.mode === 'update' && newItem) {
    initFormData()
  }
}, { immediate: true })

// Validation functions
const validateConstructionItemName = () => {
  const value = formData.value.constructionItemName?.trim()
  if (!value) {
    errors.value.constructionItemName = 'Tên hạng mục không được để trống'
    return false
  }
  if (!regexPatterns.constructionItemName.test(value)) {
    errors.value.constructionItemName = 'Tên hạng mục chỉ được chứa chữ cái, số, khoảng trắng, dấu tiếng Việt và các ký tự đặc biệt (gạch ngang, gạch dưới) (tối đa 200 ký tự)'
    return false
  }
  errors.value.constructionItemName = ''
  return true
}

const validateStartDate = () => {
  const value = formData.value.startDate
  if (!value) {
    errors.value.startDate = 'Ngày bắt đầu không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.startDate = 'Định dạng ngày bắt đầu không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime()) || startDate.toISOString().split('T')[0] !== value) {
    errors.value.startDate = 'Ngày bắt đầu không hợp lệ'
    return false
  }
  
  // Ngày bắt đầu không được quá tương lai (cho phép tối đa 10 năm)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 10)
  if (startDate > maxDate) {
    errors.value.startDate = 'Ngày bắt đầu không được vượt quá 10 năm trong tương lai'
    return false
  }
  
  // Validate end date when start date changes
  if (formData.value.expectedCompletionDate) {
    const endDate = new Date(formData.value.expectedCompletionDate)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDate = 'Ngày bắt đầu phải trước ngày kết thúc dự kiến'
      // Also update end date error
      validateExpectedCompletionDate()
    }
  }
  
  errors.value.startDate = ''
  return true
}

const validateExpectedCompletionDate = () => {
  const value = formData.value.expectedCompletionDate
  if (!value) {
    errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.expectedCompletionDate = 'Định dạng ngày kết thúc dự kiến không hợp lệ'
    return false
  }
  
  const endDate = new Date(value)
  if (isNaN(endDate.getTime()) || endDate.toISOString().split('T')[0] !== value) {
    errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không hợp lệ'
    return false
  }
  
  // Validate end date is after start date
  if (formData.value.startDate) {
    const startDate = new Date(formData.value.startDate)
    if (!isNaN(startDate.getTime())) {
      if (startDate >= endDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến phải sau ngày bắt đầu'
        return false
      }
      
      // Ngày kết thúc không được quá xa trong tương lai (tối đa 50 năm sau ngày bắt đầu)
      const maxDate = new Date(startDate)
      maxDate.setFullYear(maxDate.getFullYear() + 50)
      if (endDate > maxDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được vượt quá 50 năm sau ngày bắt đầu'
        return false
      }
      
      // Ngày kết thúc không được quá tương lai (cho phép tối đa 60 năm)
      const absoluteMaxDate = new Date()
      absoluteMaxDate.setFullYear(absoluteMaxDate.getFullYear() + 60)
      if (endDate > absoluteMaxDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được vượt quá 60 năm trong tương lai'
        return false
      }
    }
  }
  
  errors.value.expectedCompletionDate = ''
  return true
}

const validateTotalVolume = () => {
  const value = formData.value.totalVolume
  if (!value && value !== 0) {
    errors.value.totalVolume = 'Tổng khối lượng không được để trống'
    return false
  }
  
  const volumeNum = parseFloat(value)
  if (isNaN(volumeNum)) {
    errors.value.totalVolume = 'Tổng khối lượng phải là số'
    return false
  }
  
  if (volumeNum <= 0) {
    errors.value.totalVolume = 'Tổng khối lượng phải lớn hơn 0'
    return false
  }
  
  // Validate format: tối đa 10 chữ số, 2 chữ số thập phân
  const valueStr = String(value)
  if (!regexPatterns.totalVolume.test(valueStr)) {
    errors.value.totalVolume = 'Tổng khối lượng không đúng định dạng'
    return false
  }
  
  // Giới hạn: 0.01 đến 999,999,999,999.99
  if (volumeNum > 999999999999.99) {
    errors.value.totalVolume = 'Tổng khối lượng không được vượt quá 999,999,999,999.99'
    return false
  }
  
  errors.value.totalVolume = ''
  return true
}

const validateUnitOfMeasurementID = () => {
  const value = formData.value.unitOfMeasurementID
  if (!value) {
    errors.value.unitOfMeasurementID = 'Vui lòng chọn đơn vị đo'
    return false
  }
  errors.value.unitOfMeasurementID = ''
  return true
}

const validateWorkSubTypeVariantID = () => {
  const value = formData.value.workSubTypeVariantID
  if (!value) {
    errors.value.workSubTypeVariantID = 'Vui lòng chọn loại công tác'
    return false
  }
  errors.value.workSubTypeVariantID = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'constructionItemName':
      validateConstructionItemName()
      break
    case 'startDate':
      validateStartDate()
      // Re-validate end date when start date changes
      if (formData.value.expectedCompletionDate) {
        validateExpectedCompletionDate()
      }
      break
    case 'expectedCompletionDate':
      validateExpectedCompletionDate()
      // Re-validate start date when end date changes
      if (formData.value.startDate) {
        validateStartDate()
      }
      break
    case 'totalVolume':
      validateTotalVolume()
      break
    case 'unitOfMeasurementID':
      validateUnitOfMeasurementID()
      break
    case 'workSubTypeVariantID':
      validateWorkSubTypeVariantID()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateConstructionItemName(),
    validateStartDate(),
    validateExpectedCompletionDate(),
    validateTotalVolume(),
    validateUnitOfMeasurementID(),
    validateWorkSubTypeVariantID()
  ]
  
  const isValid = validations.every(v => v === true)
  
  if (!isValid) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
  }
  
  return isValid
}

const handleSubmit = async () => {
  formError.value = ''
  
  // Validate form trước khi submit
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true
    const itemData = {
      constructionItemName: formData.value.constructionItemName.trim(),
      startDate: new Date(formData.value.startDate).toISOString(),
      expectedCompletionDate: new Date(formData.value.expectedCompletionDate).toISOString(),
      totalVolume: Number(formData.value.totalVolume),
      unitOfMeasurementID: Number(formData.value.unitOfMeasurementID),
      workSubTypeVariantID: Number(formData.value.workSubTypeVariantID)
    }

    console.log('Submitting form data:', itemData) // Debug log
    emit('submit', itemData)
  } catch (error) {
    console.error('Error submitting form:', error)
    formError.value = error.response?.data?.message || 'Có lỗi xảy ra khi gửi form'
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="construction-item-form">
    <div v-if="formError" class="alert alert-danger mb-3">
      {{ formError }}
    </div>

    <div class="row g-3">
      <!-- Tên hạng mục -->
      <div class="col-12">
        <label class="form-label">Tên Hạng Mục <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.constructionItemName }"
          v-model="formData.constructionItemName"
          @blur="validateField('constructionItemName')"
          @input="validateField('constructionItemName')"
          maxlength="200"
          placeholder="Nhập tên hạng mục"
        />
        <div class="invalid-feedback">{{ errors.constructionItemName }}</div>
      </div>

      <!-- Ngày bắt đầu -->
      <div class="col-md-6">
        <label class="form-label">Ngày Bắt Đầu <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.startDate }"
          v-model="formData.startDate"
          @blur="validateField('startDate')"
          @change="validateField('startDate')"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.startDate }}</div>
      </div>

      <!-- Ngày kết thúc -->
      <div class="col-md-6">
        <label class="form-label">Ngày Kết Thúc Dự Kiến <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.expectedCompletionDate }"
          v-model="formData.expectedCompletionDate"
          @blur="validateField('expectedCompletionDate')"
          @change="validateField('expectedCompletionDate')"
          :min="formData.startDate || undefined"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 60)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.expectedCompletionDate }}</div>
      </div>

      <!-- Khối lượng -->
      <div class="col-md-6">
        <label class="form-label">Tổng Khối Lượng <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.totalVolume }"
          v-model.number="formData.totalVolume"
          @blur="validateField('totalVolume')"
          @input="validateField('totalVolume')"
          step="0.01"
          min="0.01"
          max="999999999999.99"
          placeholder="Nhập khối lượng"
        />
        <div class="invalid-feedback">{{ errors.totalVolume }}</div>
      </div>

      <!-- Đơn vị đo -->
      <div class="col-md-6">
        <label class="form-label">Đơn Vị Đo <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.unitOfMeasurementID }"
          v-model="formData.unitOfMeasurementID"
          @change="validateField('unitOfMeasurementID')"
        >
          <option value="">Chọn đơn vị đo</option>
          <option v-for="unit in unitMeasurements" :key="unit.id" :value="unit.id">
            {{ unit.shortName || unit.name }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.unitOfMeasurementID }}</div>
      </div>

      <!-- Loại công việc -->
      <div class="col-12">
        <label class="form-label">Loại Công Tác <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.workSubTypeVariantID }"
          v-model="formData.workSubTypeVariantID"
          @change="validateField('workSubTypeVariantID')"
        >
          <option value="">Chọn loại công tác</option>
          <option v-for="variant in variants" :key="variant.id" :value="variant.id">
            {{ variant.description }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.workSubTypeVariantID }}</div>
      </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="handleCancel" :disabled="isSubmitting">
        Hủy
      </button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.construction-item-form {
  max-width: 100%;
}

.alert {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.form-control.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control,
.form-select {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.95rem;
  height: 45px;
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.text-danger {
  color: #dc3545;
}
</style>
