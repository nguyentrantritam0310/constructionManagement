<script setup>
import { ref, watch, onMounted, computed } from 'vue'
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

// Function to prepare and emit form data
const emitFormData = () => {
  // Validate required fields first
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
    return
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

const handleImageError = (e) => {
  console.error('Failed to load image:', e.target.src)
  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
}

// Add back the utility functions
const getReportTypeLabel = () => {
  return props.reportType === 'incident' ? 'Báo cáo sự cố thi công' : 'Báo cáo vấn đề kỹ thuật'
}

const getStatusInfo = (status) => {
  return statusOptions.find(s => s.value === status) || statusOptions[0]
}

const getSeverityInfo = (severity) => {
  return severityLevels.find(s => s.value === severity) || severityLevels[0]
}
</script>

<template>
  <div class="report-form">
    <div class="form-header">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="text-primary mb-0">{{ getReportTypeLabel() }}</h4>
        <div v-if="mode === 'update'" class="d-flex gap-2">
          <div class="status-badge" :class="'bg-' + getStatusInfo(formData.level).color">
            <i :class="'fas fa-' + getStatusInfo(formData.level).icon"></i>
            <span>{{ getStatusInfo(formData.level).label }}</span>
          </div>
          <div class="status-badge" :class="'bg-' + getSeverityInfo(formData.level).color">
            <i :class="'fas fa-' + getSeverityInfo(formData.level).icon"></i>
            <span>{{ getSeverityInfo(formData.level).label }}</span>
          </div>
        </div>
      </div>
      <p class="text-muted mb-0">Vui lòng điền đầy đủ thông tin báo cáo</p>
    </div>

    <div class="form-body">
      <div class="row g-3">
        <div class="col-md-6">
          <FormField
            label="Công trình"
            type="select"
            v-model="formData.constructionID"
            :options="constructions.map(construction => ({
              value: construction.id,
              label: construction.constructionName
            }))"
            required
          >
            <template #option="{ option }">
              <div class="d-flex align-items-center">
                <i class="fas fa-building me-2"></i>
                <span>{{ option.label }}</span>
              </div>
            </template>
          </FormField>
        </div>

        <div class="col-md-6">
          <FormField
            label="Mức độ ảnh hưởng"
            type="select"
            v-model="formData.level"
            :options="severityLevels"
            required
          >
            <template #option="{ option }">
              <div class="d-flex align-items-center">
                <i :class="'fas fa-' + option.icon + ' me-2 text-' + option.color"></i>
                <span>{{ option.label }}</span>
              </div>
            </template>
          </FormField>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12">
          <FormField
            label="Mô tả chi tiết"
            type="textarea"
            v-model="formData.content"
            rows="4"
            required
            placeholder="Nhập mô tả chi tiết về vấn đề..."
          />
        </div>
      </div>

      <div class="row mt-3">
        <div class="col-12">
          <FormField
            label="Hình ảnh đính kèm"
            type="file"
            v-model="formData.images"
            multiple
            accept="image/*"
            @change="handleImageUpload"
          >
            <template #help>
              <small class="text-muted">Có thể tải lên nhiều hình ảnh (tối đa 5MB mỗi file)</small>
            </template>
          </FormField>

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
</style>
