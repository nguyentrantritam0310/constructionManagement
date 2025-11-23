<script setup>
import { ref, watch, onMounted, computed, inject, onUnmounted } from 'vue'
import FormField from './FormField.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import api from '../../api.js'

const { showMessage } = useGlobalMessage()

// Add utility function for handling file paths
const apiBaseUrl = computed(() => {
  const baseUrl = api.defaults.baseURL || ''
  if (!baseUrl) {
    console.warn('API base URL is not defined')
    return ''
  }
  // Remove /api from the end if it exists
  return baseUrl.endsWith('/api')
    ? baseUrl.slice(0, -4)
    : baseUrl
})

const getFileUrl = (filePath) => {
  if (!filePath) return ''
  // Remove leading slash if exists
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  return `${apiBaseUrl.value}/${cleanPath}`
}

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
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const { constructions, fetchConstructions } = useConstructionManagement()

onMounted(async () => {
  await fetchConstructions()
})

const formData = ref({
  constructionID: '',
  reportType: props.reportType === 'technical' ? 'Sự cố kĩ thuật' : 'Sự cố thi công',
  content: '',
  level: '',
  images: null,
  newImages: null,
  deletedImagePaths: [],
  attachments: []
})

// Validation functions
const validateConstructionID = () => {
  const value = formData.value.constructionID
  if (!value) {
    errors.value.constructionID = 'Vui lòng chọn công trình'
    return false
  }
  errors.value.constructionID = ''
  return true
}

const validateLevel = () => {
  const value = formData.value.level
  if (!value) {
    errors.value.level = 'Vui lòng chọn mức độ ảnh hưởng'
    return false
  }
  const validLevels = ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng']
  if (!validLevels.includes(value)) {
    errors.value.level = 'Mức độ ảnh hưởng không hợp lệ'
    return false
  }
  errors.value.level = ''
  return true
}

const validateContent = () => {
  const value = formData.value.content?.trim()
  if (!value) {
    errors.value.content = 'Mô tả chi tiết không được để trống'
    return false
  }
  if (value.length < 10) {
    errors.value.content = 'Mô tả chi tiết phải có ít nhất 10 ký tự'
    return false
  }
  if (value.length > 5000) {
    errors.value.content = 'Mô tả chi tiết không được vượt quá 5000 ký tự'
    return false
  }
  if (!regexPatterns.content.test(value)) {
    errors.value.content = 'Mô tả chi tiết chứa ký tự không hợp lệ'
    return false
  }
  errors.value.content = ''
  return true
}

const validateImages = () => {
  const images = formData.value.images
  const newImages = formData.value.newImages
  
  const filesToCheck = images instanceof FileList ? images : (newImages instanceof FileList ? newImages : null)
  
  if (filesToCheck && filesToCheck.length > 0) {
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = Array.from(filesToCheck).filter(file => !validTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      errors.value.images = 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'
      return false
    }
    // Validate file size (max 5MB per file)
    const oversizedFiles = Array.from(filesToCheck).filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      errors.value.images = 'Mỗi file ảnh không được vượt quá 5MB'
      return false
    }
    // Validate total number of files (max 20)
    if (filesToCheck.length > 20) {
      errors.value.images = 'Tối đa 20 file ảnh'
      return false
    }
  }
  errors.value.images = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'constructionID':
      validateConstructionID()
      break
    case 'level':
      validateLevel()
      break
    case 'content':
      validateContent()
      break
    case 'images':
      validateImages()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateConstructionID(),
    validateLevel(),
    validateContent(),
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

// Function to prepare and emit form data
const emitFormData = () => {
  // Validate required fields first (chỉ để log warning, không chặn emit)
  const requiredFields = {
    constructionID: 'Construction ID',
    reportType: 'Report Type',
    content: 'Content',
    level: 'Level'
  }

  const missingFields = Object.entries(requiredFields)
    .filter(([key]) => !formData.value[key])
    .map(([, label]) => label)

  if (missingFields.length > 0) {
    console.warn('❌ Missing required fields:', missingFields.join(', '))
    // Không return ở đây để vẫn emit data khi user đang nhập
  }

  // Create a FormData object for file uploads
  const data = new FormData()

  // If in update mode, add ID first
  if (props.mode === 'update' && formData.value.id) {
    data.append('ID', String(formData.value.id))
    console.log('🔑 Adding report ID:', formData.value.id)
  }

  // Add basic fields with correct casing and type conversion
  data.append('ConstructionID', String(formData.value.constructionID))
  data.append('ReportType', formData.value.reportType)
  data.append('Content', formData.value.content)
  data.append('Level', formData.value.level)

  // Handle file uploads
  if (props.mode === 'create') {
    // For create mode, append all images
    if (formData.value.images instanceof FileList) {
      Array.from(formData.value.images).forEach(file => {
        data.append('Images', file)
        console.log('📎 Adding image:', file.name, 'Type:', file.type, 'Size:', file.size)
      })
    }
  } else {
    // Handle new images if any
    if (formData.value.newImages instanceof FileList) {
      Array.from(formData.value.newImages).forEach(file => {
        data.append('NewImages', file)
        console.log('📎 Adding new image:', file.name, 'Type:', file.type, 'Size:', file.size)
      })
    }

    // Always include DeletedImagePaths array
    const deletedPaths = formData.value.deletedImagePaths || []
    if (deletedPaths.length > 0) {
      deletedPaths.forEach(path => {
        const cleanPath = path.startsWith('/') ? path.slice(1) : path
        data.append('DeletedImagePaths', cleanPath)
        console.log('🗑️ Adding deleted path:', cleanPath)
      })
    } else {
      // Add empty string to ensure the field is included in the request
      data.append('DeletedImagePaths', '')
      console.log('ℹ️ No deleted paths')
    }

    // Add remaining attachments
    const attachments = formData.value.attachments || []
    if (attachments.length > 0) {
      attachments.forEach(att => {
        if (att.filePath) {
          const cleanPath = att.filePath.startsWith('/') ? att.filePath.slice(1) : att.filePath
          data.append('Attachments', cleanPath)
          console.log('📎 Keeping existing attachment:', cleanPath)
        }
      })
    } else {
      // Add empty string to ensure the field is included
      data.append('Attachments', '')
      console.log('ℹ️ No remaining attachments')
    }
  }

  // Log final FormData contents for debugging
  console.log('📤 Final FormData entries:')
  for (let [key, value] of data.entries()) {
    console.log(`${key}: ${value instanceof File ? `File(${value.name})` : value}`)
  }

  // Emit the FormData object
  emit('update:modelValue', data)
}

// Watch for changes in modelValue prop
watch(() => props.modelValue, (newValue) => {
  if (newValue && Object.keys(newValue).length > 0) {
    formData.value = { ...formData.value, ...newValue }
  }
}, { deep: true })

// Watch for changes in report prop
watch(() => props.report, (newReport) => {
  if (newReport && Object.keys(newReport).length > 0) {
    console.log('Report data received:', newReport)
    const updatedData = {
      id: newReport.id,
      constructionID: newReport.constructionID,
      reportType: newReport.reportType,
      content: newReport.content,
      level: newReport.level,
      status: newReport.statusLogs?.[0]?.status,
      images: null,
      newImages: null,
      deletedImagePaths: []
    }

    // Handle attachments with proper path formatting
    if (newReport.attachments && newReport.attachments.length > 0) {
      updatedData.attachments = newReport.attachments.map(att => ({
        ...att,
        filePath: att.filePath.startsWith('/') ? att.filePath.slice(1) : att.filePath,
        displayUrl: getFileUrl(att.filePath)
      }))
    } else {
      updatedData.attachments = []
    }

    formData.value = updatedData
    emitFormData()
  }
}, { immediate: true })

// Watch formData changes and emit updates
watch(formData, () => {
  emitFormData()
}, { deep: true })

const issueTypes = [
  { value: 'equipment', label: 'Lỗi thiết bị' },
  { value: 'material', label: 'Thiếu vật tư' },
  { value: 'construction', label: 'Sự cố công trình' },
  { value: 'other', label: 'Vấn đề khác' }
]

const severityLevels = [
  { value: 'Thấp', label: 'Thấp', color: 'success', icon: 'arrow-down' },
  { value: 'Trung bình', label: 'Trung bình', color: 'info', icon: 'equals' },
  { value: 'Cao', label: 'Cao', color: 'warning', icon: 'arrow-up' },
  { value: 'Nghiêm trọng', label: 'Nghiêm trọng', color: 'danger', icon: 'exclamation-triangle' }
]

const statusOptions = [
  { value: 'Pending', label: 'Chờ xử lý', color: 'warning', icon: 'clock' },
  { value: 'InProgress', label: 'Đang xử lý', color: 'info', icon: 'spinner' },
  { value: 'Resolved', label: 'Đã xử lý', color: 'success', icon: 'check-circle' },
  { value: 'Closed', label: 'Đã đóng', color: 'secondary', icon: 'archive' }
]

const previewImages = ref([])

// Regex patterns cho validation
const regexPatterns = {
  // Mô tả: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu câu, dấu gạch ngang và gạch dưới, độ dài 10-5000
  content: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_,.\-!?;:()\[\]{}\"']{10,5000}$/
}

// Validation errors
const errors = ref({
  constructionID: '',
  level: '',
  content: '',
  images: ''
})

const handleImageUpload = (event) => {
  const files = event.target.files
  if (files) {
    // Log detailed file information
    Array.from(files).forEach((file, index) => {
      console.log(`File ${index + 1} details:`, {
        name: file.name,
        type: file.type,
        extension: file.name.split('.').pop(),
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      })
    })

    if (props.mode === 'create') {
      formData.value.images = files
    } else {
      formData.value.newImages = files
    }

    // Validate images
    validateField('images')

    // Update preview images for new uploads
    previewImages.value = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImages.value.push({
          url: e.target.result,
          file: file,
          isNew: true
        })
      }
      reader.readAsDataURL(file)
    })

    // Emit updated form data
    emitFormData()
  }
}

const handleDeleteImage = (imagePath, isNew = false) => {
  if (isNew) {
    // Remove from preview images if it's a new upload
    const fileIndex = previewImages.value.findIndex(img => img.url === imagePath)
    if (fileIndex !== -1) {
      previewImages.value.splice(fileIndex, 1)
      // Clear file input if all new images are removed
      if (previewImages.value.length === 0) {
        formData.value.newImages = null
      }
    }
  } else if (props.mode === 'update') {
    // Add to deletedImagePaths if it's an existing image
    if (!formData.value.deletedImagePaths) {
      formData.value.deletedImagePaths = []
    }
    formData.value.deletedImagePaths.push(imagePath)
    // Remove from attachments array
    formData.value.attachments = formData.value.attachments.filter(att => att.filePath !== imagePath)
    console.log('🗑️ Image marked for deletion:', imagePath)
    console.log('Current deletedImagePaths:', formData.value.deletedImagePaths)
  }
  // Emit updated form data
  emitFormData()
}

const PLACEHOLDER_SRC = '/img/image-not-found.png'

const handleImageError = (e) => {
  if (!e.target.src.includes('image-not-found.png')) {
    e.target.src = PLACEHOLDER_SRC
  }
}

// Add back the utility functions
const getReportTypeLabel = () => {
  return props.reportType === 'incident' ? 'Báo cáo sự cố thi công' : ''
}

const getStatusInfo = (status) => {
  switch (status) {
    case 0:
      return { value: 'Pending', label: 'Chờ xử lý', color: 'warning', icon: 'clock' }
    case 1:
      return { value: 'Approved', label: 'Đã duyệt', color: 'success', icon: 'check-circle' }
    case 2:
      return { value: 'Rejected', label: 'Đã từ chối', color: 'danger', icon: 'times-circle' }
    case 3:
      return { value: 'Completed', label: 'Hoàn thành', color: 'info', icon: 'check-double' }
    default:
      return { value: 'Pending', label: 'Chờ xử lý', color: 'warning', icon: 'clock' }
  }
}

const getSeverityInfo = (severity) => {
  return severityLevels.find(s => s.value === severity) || severityLevels[0]
}

// Expose validateForm để parent component có thể gọi
defineExpose({
  validateForm
})

// Register validate function với FormDialog nếu có
const registerValidate = inject('registerValidate', null)

onMounted(() => {
  // Đăng ký validate function sau khi component mounted
  if (registerValidate) {
    registerValidate(validateForm)
  }
})

onUnmounted(() => {
  // Unregister khi component unmount
  if (registerValidate) {
    registerValidate(null)
  }
})
</script>

<template>
  <div class="report-form">
    <div class="form-header">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="text-primary mb-0">{{ getReportTypeLabel() }}</h4>
        <div v-if="mode === 'update'" class="d-flex gap-2">
          <div class="status-badge" :class="'bg-' + getStatusInfo(formData.status).color">
            <i :class="'fas fa-' + getStatusInfo(formData.status).icon"></i>
            <span>{{ getStatusInfo(formData.status).label }}</span>
          </div>
          <div class="status-badge" :class="'bg-' + getSeverityInfo(formData.level).color">
            <i :class="'fas fa-' + getSeverityInfo(formData.level).icon"></i>
            <span>{{ getSeverityInfo(formData.level).label }}</span>
          </div>
        </div>
      </div>
      <p v-if="props.reportType === 'incident'" class="text-muted mb-0">Vui lòng điền đầy đủ thông tin báo cáo</p>
    </div>

    <div class="form-body">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Công trình <span class="text-danger">*</span></label>
          <select 
            class="form-select" 
            :class="{ 'is-invalid': errors.constructionID }"
            v-model="formData.constructionID"
            @change="validateField('constructionID')"
          >
            <option value="">Chọn công trình</option>
            <option v-for="construction in constructions" :key="construction.id" :value="construction.id">
              {{ construction.constructionName }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errors.constructionID }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label">Mức độ ảnh hưởng <span class="text-danger">*</span></label>
          <select 
            class="form-select" 
            :class="{ 'is-invalid': errors.level }"
            v-model="formData.level"
            @change="validateField('level')"
          >
            <option value="">Chọn mức độ ảnh hưởng</option>
            <option v-for="level in severityLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errors.level }}</div>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12">
          <label class="form-label">Mô tả chi tiết <span class="text-danger">*</span></label>
          <textarea 
            class="form-control" 
            :class="{ 'is-invalid': errors.content }"
            v-model="formData.content"
            @blur="validateField('content')"
            @input="validateField('content')"
            rows="4"
            maxlength="5000"
            placeholder="Nhập mô tả chi tiết về vấn đề (tối thiểu 10 ký tự)"
          ></textarea>
          <div class="invalid-feedback">{{ errors.content }}</div>
          <small class="text-muted">{{ formData.content?.length || 0 }}/5000 ký tự</small>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12">
          <label class="form-label">Hình ảnh đính kèm</label>
          <input 
            type="file" 
            class="form-control" 
            :class="{ 'is-invalid': errors.images }"
            @change="handleImageUpload"
            multiple
            accept="image/*"
          />
          <div class="invalid-feedback">{{ errors.images }}</div>
          <small class="text-muted">Tối đa 20 file, mỗi file không quá 5MB. Chỉ chấp nhận file ảnh (jpg, png, gif, webp)</small>

          <!-- Existing Images Preview -->
          <div v-if="mode === 'update' && formData.attachments?.length > 0" class="image-preview-container mt-2">
            <h6 class="mb-2">Ảnh hiện tại:</h6>
            <div class="row g-2">
              <div v-for="attachment in formData.attachments" :key="attachment.id" class="col-md-3 col-sm-4 col-6">
                <div class="image-preview">
                  <img
                    :src="attachment.displayUrl"
                    class="img-fluid rounded"
                    alt="Current Image"
                    @error="handleImageError"
                  >
                  <button
                    type="button"
                    class="btn btn-sm btn-danger remove-image"
                    @click="handleDeleteImage(attachment.filePath)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- New Images Preview -->
          <div v-if="previewImages.length > 0" class="image-preview-container mt-2">
            <h6 class="mb-2">{{ mode === 'update' ? 'Ảnh mới:' : 'Xem trước:' }}</h6>
            <div class="row g-2">
              <div v-for="(image, index) in previewImages" :key="index" class="col-md-3 col-sm-4 col-6">
                <div class="image-preview">
                  <img
                    :src="image.url"
                    class="img-fluid rounded"
                    alt="Preview"
                    @error="handleImageError"
                  >
                  <button
                    type="button"
                    class="btn btn-sm btn-danger remove-image"
                    @click="handleDeleteImage(image.url, true)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-form {
  background: #fff;
  border-radius: 8px;
}

.form-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.form-body {
  padding: 1rem 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  color: #fff;
  font-size: 0.9rem;
}

.status-badge i {
  margin-right: 0.5rem;
}

.status-badge.bg-warning {
  background-color: #ffc107 !important;
  color: #000;
}

.status-badge.bg-info {
  background-color: #0dcaf0 !important;
  color: #000;
}

.status-badge.bg-success {
  background-color: #198754 !important;
}

.status-badge.bg-danger {
  background-color: #dc3545 !important;
}

.status-badge.bg-secondary {
  background-color: #6c757d !important;
}

.image-preview-container {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.image-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.image-preview:hover {
  border-color: #dee2e6;
  transform: translateY(-2px);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-image:hover {
  background: #dc3545;
  color: white;
  transform: scale(1.1);
}

.image-preview-container h6 {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
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
</style>
