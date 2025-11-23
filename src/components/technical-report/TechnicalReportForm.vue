<script setup>
import { ref, watch, computed } from 'vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  reportType: {
    type: String,
    required: true,
    validator: (value) => ['incident', 'technical'].includes(value)
  },
  report: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'resubmit', 'cancel'])

const formData = ref({
  constructionCode: '',
  constructionName: '',
  issueType: '',
  description: '',
  severity: '',
  status: 'Pending',
  images: []
})

// Regex patterns cho validation
const regexPatterns = {
  // Mô tả: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu câu, dấu gạch ngang và gạch dưới, độ dài 10-5000
  description: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_,.\-!?;:()\[\]{}\"']{10,5000}$/
}

// Validation errors
const errors = ref({
  constructionCode: '',
  issueType: '',
  severity: '',
  description: '',
  images: ''
})

// Watch for changes in report prop
watch(() => props.report, (newReport) => {
  if (newReport && Object.keys(newReport).length > 0) {
    formData.value = { ...newReport }
  }
}, { immediate: true })

// Watch for form data changes and emit them
watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

const issueTypes = [
  { value: 'equipment', label: 'Lỗi thiết bị' },
  { value: 'material', label: 'Thiếu vật tư' },
  { value: 'construction', label: 'Sự cố công trình' },
  { value: 'other', label: 'Vấn đề khác' }
]

const severityLevels = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
  { value: 'critical', label: 'Nghiêm trọng' }
]

const isRejected = computed(() => {
  if (props.report && props.report.statusLogs && props.report.statusLogs.length > 0) {
    // Lấy trạng thái mới nhất
    const latestStatus = props.report.statusLogs[0].status
    return latestStatus === 2 // 2 là Rejected
  }
  return false
})

// Validation functions
const validateConstructionCode = () => {
  const value = formData.value.constructionCode
  if (!value) {
    errors.value.constructionCode = 'Vui lòng chọn công trình'
    return false
  }
  errors.value.constructionCode = ''
  return true
}

const validateIssueType = () => {
  const value = formData.value.issueType
  if (!value) {
    errors.value.issueType = 'Vui lòng chọn loại vấn đề'
    return false
  }
  const validTypes = ['equipment', 'material', 'construction', 'other']
  if (!validTypes.includes(value)) {
    errors.value.issueType = 'Loại vấn đề không hợp lệ'
    return false
  }
  errors.value.issueType = ''
  return true
}

const validateSeverity = () => {
  const value = formData.value.severity
  if (!value) {
    errors.value.severity = 'Vui lòng chọn mức độ ảnh hưởng'
    return false
  }
  const validSeverities = ['low', 'medium', 'high', 'critical']
  if (!validSeverities.includes(value)) {
    errors.value.severity = 'Mức độ ảnh hưởng không hợp lệ'
    return false
  }
  errors.value.severity = ''
  return true
}

const validateDescription = () => {
  const value = formData.value.description?.trim()
  if (!value) {
    errors.value.description = 'Mô tả vấn đề không được để trống'
    return false
  }
  if (value.length < 10) {
    errors.value.description = 'Mô tả vấn đề phải có ít nhất 10 ký tự'
    return false
  }
  if (value.length > 5000) {
    errors.value.description = 'Mô tả vấn đề không được vượt quá 5000 ký tự'
    return false
  }
  if (!regexPatterns.description.test(value)) {
    errors.value.description = 'Mô tả vấn đề chứa ký tự không hợp lệ'
    return false
  }
  errors.value.description = ''
  return true
}

const validateImages = () => {
  const images = formData.value.images
  if (images && images.length > 0) {
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = Array.from(images).filter(file => !validTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      errors.value.images = 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'
      return false
    }
    // Validate file size (max 10MB per file)
    const oversizedFiles = Array.from(images).filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      errors.value.images = 'Mỗi file ảnh không được vượt quá 10MB'
      return false
    }
    // Validate total number of files (max 10)
    if (images.length > 10) {
      errors.value.images = 'Tối đa 10 file ảnh'
      return false
    }
  }
  errors.value.images = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'constructionCode':
      validateConstructionCode()
      break
    case 'issueType':
      validateIssueType()
      break
    case 'severity':
      validateSeverity()
      break
    case 'description':
      validateDescription()
      break
    case 'images':
      validateImages()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateConstructionCode(),
    validateIssueType(),
    validateSeverity(),
    validateDescription(),
    validateImages()
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

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }
  
  if (isRejected.value) {
    emit('resubmit', formData.value)
  } else {
    emit('submit', formData.value)
  }
}

const handleImageChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    formData.value.images = Array.from(files)
    validateField('images')
  } else {
    formData.value.images = []
    errors.value.images = ''
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-3">
    <div class="row g-3">
      <!-- Công trình -->
      <div class="col-12">
        <label class="form-label">Công trình <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.constructionCode }"
          v-model="formData.constructionCode"
          @change="validateField('constructionCode')"
        >
          <option value="">Chọn công trình</option>
          <!-- Options sẽ được thêm từ parent component -->
        </select>
        <div class="invalid-feedback">{{ errors.constructionCode }}</div>
      </div>

      <!-- Loại vấn đề -->
      <div class="col-md-6">
        <label class="form-label">Loại vấn đề <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.issueType }"
          v-model="formData.issueType"
          @change="validateField('issueType')"
        >
          <option value="">Chọn loại vấn đề</option>
          <option v-for="type in issueTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.issueType }}</div>
      </div>

      <!-- Mức độ ảnh hưởng -->
      <div class="col-md-6">
        <label class="form-label">Mức độ ảnh hưởng <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.severity }"
          v-model="formData.severity"
          @change="validateField('severity')"
        >
          <option value="">Chọn mức độ ảnh hưởng</option>
          <option v-for="level in severityLevels" :key="level.value" :value="level.value">
            {{ level.label }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.severity }}</div>
      </div>

      <!-- Mô tả vấn đề -->
      <div class="col-12">
        <label class="form-label">Mô tả vấn đề <span class="text-danger">*</span></label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.description }"
          v-model="formData.description"
          @blur="validateField('description')"
          @input="validateField('description')"
          rows="4"
          maxlength="5000"
          placeholder="Nhập mô tả chi tiết về vấn đề (tối thiểu 10 ký tự)"
        ></textarea>
        <div class="invalid-feedback">{{ errors.description }}</div>
        <small class="text-muted">{{ formData.description?.length || 0 }}/5000 ký tự</small>
      </div>

      <!-- Hình ảnh -->
      <div class="col-12">
        <label class="form-label">Hình ảnh</label>
        <input 
          type="file" 
          class="form-control" 
          :class="{ 'is-invalid': errors.images }"
          @change="handleImageChange"
          multiple
          accept="image/*"
        />
        <div class="invalid-feedback">{{ errors.images }}</div>
        <small class="text-muted">Tối đa 10 file, mỗi file không quá 10MB. Chỉ chấp nhận file ảnh (jpg, png, gif, webp)</small>
        <div v-if="formData.images && formData.images.length > 0" class="mt-2">
          <small class="text-success">Đã chọn {{ formData.images.length }} file</small>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
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
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select {
  height: 45px;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

textarea.form-control {
  min-height: 100px;
  resize: vertical;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
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

.text-muted {
  color: #6c757d;
  font-size: 0.875rem;
}

.text-success {
  color: #28a745;
  font-size: 0.875rem;
}
</style>
