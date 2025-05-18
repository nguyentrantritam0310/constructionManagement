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
  }
})

const emit = defineEmits(['submit', 'cancel'])

const { constructions, fetchConstructions } = useConstructionManagement()

onMounted(async () => {
  await fetchConstructions()
})

const formData = ref({
  constructionID: '',
  reportType: props.reportType === 'technical' ? 'Sự cố kĩ thuật' : 'Sự cố thi công',
  content: '',
  level: '',
  images: [],
  newImages: [],
  deletedImagePaths: [],
  attachments: []
})

// Watch for changes in report prop
watch(() => props.report, (newReport) => {
  if (newReport && Object.keys(newReport).length > 0) {
    console.log('Report data received:', newReport) // Debug
    formData.value = {
      id: newReport.id,
      constructionID: newReport.constructionID,
      reportType: newReport.reportType,
      content: newReport.content,
      level: newReport.level,
      status: newReport.statusLogs?.[0]?.status,
      images: [],
      newImages: [],
      deletedImagePaths: []
    }
    // Handle attachments with proper path formatting
    if (newReport.attachments && newReport.attachments.length > 0) {
      formData.value.attachments = newReport.attachments.map(att => ({
        ...att,
        filePath: att.filePath.startsWith('/') ? att.filePath.slice(1) : att.filePath,
        displayUrl: getFileUrl(att.filePath)
      }))
    }
  }
}, { immediate: true })

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

const validateForm = () => {
  if (!formData.value.constructionID || !formData.value.content || !formData.value.level) {
    return false
  }
  return true
}

const handleSubmit = (e) => {
  e.preventDefault()
  console.log('🚀 Starting form submission')
  console.log('📝 Form mode:', props.mode)
  console.log('📋 Form data state:', {
    constructionID: {
      value: formData.value.constructionID,
      type: typeof formData.value.constructionID
    },
    reportType: {
      value: formData.value.reportType,
      type: typeof formData.value.reportType
    },
    content: {
      value: formData.value.content,
      type: typeof formData.value.content,
      length: formData.value.content?.length
    },
    level: {
      value: formData.value.level,
      type: typeof formData.value.level
    },
    status: {
      value: formData.value.status,
      type: typeof formData.value.status
    },
    images: {
      existing: formData.value.attachments?.length || 0,
      new: formData.value.newImages?.length || 0,
      deleted: formData.value.deletedImagePaths?.length || 0
    }
  })

  if (!validateForm()) {
    console.warn('❌ Form validation failed')
    console.log('Validation details:', {
      hasConstructionID: Boolean(formData.value.constructionID),
      hasContent: Boolean(formData.value.content),
      hasLevel: Boolean(formData.value.level)
    })
    showMessage('Vui lòng nhập đầy đủ thông tin bắt buộc', 'error')
    return
  }

  console.log('✅ Form validation passed')

  // Log image details
  if (formData.value.attachments?.length > 0) {
    console.log('📎 Existing attachments:', formData.value.attachments.map(att => ({
      id: att.id,
      filePath: att.filePath,
      displayUrl: att.displayUrl
    })))
  }

  if (formData.value.newImages?.length > 0) {
    console.log('🆕 New images:', formData.value.newImages.map(img => ({
      name: img.name,
      type: img.type,
      size: img.size,
      lastModified: img.lastModified
    })))
  }

  if (formData.value.deletedImagePaths?.length > 0) {
    console.log('🗑️ Deleted image paths:', formData.value.deletedImagePaths)
  }

  emit('submit', formData.value)
}

const getReportTypeLabel = () => {
  return props.reportType === 'incident' ? 'Báo cáo sự cố thi công' : 'Báo cáo vấn đề kỹ thuật'
}

const getStatusInfo = (status) => {
  return statusOptions.find(s => s.value === status) || statusOptions[0]
}

const getSeverityInfo = (severity) => {
  return severityLevels.find(s => s.value === severity) || severityLevels[0]
}

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
      formData.value.images = Array.from(files)
    } else {
      formData.value.newImages = Array.from(files)
    }

    // Thêm preview cho ảnh mới
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImages.value.push(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }
}

const handleDeleteImage = (imagePath) => {
  if (props.mode === 'update') {
    formData.value.deletedImagePaths.push(imagePath)
    formData.value.attachments = formData.value.attachments.filter(att => att.filePath !== imagePath)
  }
}

const handleImageError = (e) => {
  console.error('Failed to load image:', e.target.src)
  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'
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

    <form @submit="handleSubmit" class="form-body">
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

          <!-- Image Preview -->
          <div v-if="mode === 'update' && formData.attachments.length > 0" class="image-preview-container mt-2">
            <h6 class="mb-2">Ảnh hiện tại:</h6>
            <div class="row g-2">
              <div v-for="attachment in formData.attachments" :key="attachment.id" class="col-md-3 col-sm-4 col-6">
                <div class="image-preview">
                  <img :src="attachment.displayUrl" class="img-fluid rounded" alt="Current Image" @error="handleImageError">
                  <button type="button" class="btn btn-sm btn-danger remove-image" @click="handleDeleteImage(attachment.filePath)">
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
                  <img :src="image" class="img-fluid rounded" alt="Preview" @error="handleImageError">
                  <button type="button" class="btn btn-sm btn-danger remove-image" @click="previewImages.splice(index, 1)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div class="mt-4 d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
          Hủy
        </button>
        <button type="submit" class="btn btn-primary">
          {{ mode === 'create' ? 'Tạo báo cáo' : 'Cập nhật' }}
        </button>
      </div>
    </form>
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
  margin-top: 0.5rem;
}

.image-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
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
}
</style>
