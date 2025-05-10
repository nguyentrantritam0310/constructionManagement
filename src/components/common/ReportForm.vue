<script setup>
import { ref, watch } from 'vue'
import FormField from './FormField.vue'

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

const formData = ref({
  constructionCode: '',
  constructionName: '',
  issueType: '',
  description: '',
  severity: '',
  status: 'Pending',
  images: []
})

// Watch for changes in report prop
watch(() => props.report, (newReport) => {
  if (newReport && Object.keys(newReport).length > 0) {
    formData.value = { ...newReport }
  }
}, { immediate: true })

const issueTypes = [
  { value: 'equipment', label: 'Lỗi thiết bị' },
  { value: 'material', label: 'Thiếu vật tư' },
  { value: 'construction', label: 'Sự cố công trình' },
  { value: 'other', label: 'Vấn đề khác' }
]

const severityLevels = [
  { value: 'low', label: 'Thấp', color: 'success', icon: 'arrow-down' },
  { value: 'medium', label: 'Trung bình', color: 'info', icon: 'equals' },
  { value: 'high', label: 'Cao', color: 'warning', icon: 'arrow-up' },
  { value: 'critical', label: 'Nghiêm trọng', color: 'danger', icon: 'exclamation-triangle' }
]

const statusOptions = [
  { value: 'Pending', label: 'Chờ xử lý', color: 'warning', icon: 'clock' },
  { value: 'InProgress', label: 'Đang xử lý', color: 'info', icon: 'spinner' },
  { value: 'Resolved', label: 'Đã xử lý', color: 'success', icon: 'check-circle' },
  { value: 'Closed', label: 'Đã đóng', color: 'secondary', icon: 'archive' }
]

const validateForm = () => {
  if (!formData.value.constructionCode || !formData.value.issueType ||
    !formData.value.description || !formData.value.severity) {
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
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
    previewImages.value = []
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader()
      reader.onload = (e) => {
        previewImages.value.push(e.target.result)
      }
      reader.readAsDataURL(files[i])
    }
  }
}
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
          <div class="status-badge" :class="'bg-' + getSeverityInfo(formData.severity).color">
            <i :class="'fas fa-' + getSeverityInfo(formData.severity).icon"></i>
            <span>{{ getSeverityInfo(formData.severity).label }}</span>
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
            v-model="formData.constructionCode"
            :options="[]"
            required
          />

          <FormField
            label="Loại vấn đề"
            type="select"
            v-model="formData.issueType"
            :options="issueTypes"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            v-if="mode === 'create'"
            label="Mức độ ảnh hưởng"
            type="select"
            v-model="formData.severity"
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
            v-model="formData.description"
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
          <div v-if="previewImages.length > 0" class="image-preview-container mt-2">
            <div class="row g-2">
              <div v-for="(image, index) in previewImages" :key="index" class="col-md-3 col-sm-4 col-6">
                <div class="image-preview">
                  <img :src="image" class="img-fluid rounded" alt="Preview">
                  <button class="btn btn-sm btn-danger remove-image" @click="previewImages.splice(index, 1)">
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
