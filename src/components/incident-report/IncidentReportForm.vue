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

const emit = defineEmits(['submit', 'resubmit', 'cancel'])

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
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
  { value: 'critical', label: 'Nghiêm trọng' }
]

const statusOptions = [
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'InProgress', label: 'Đang xử lý' },
  { value: 'Resolved', label: 'Đã xử lý' },
  { value: 'Closed', label: 'Đã đóng' }
]

const isRejected = computed(() => {
  if (props.report && props.report.statusLogs && props.report.statusLogs.length > 0) {
    // Lấy trạng thái mới nhất
    const latestStatus = props.report.statusLogs[0].status
    return latestStatus === 2 // 2 là Rejected
  }
  return false
})

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
  if (isRejected.value) {
    emit('resubmit', formData.value)
  } else {
    emit('submit', formData.value)
  }
}

const getReportTypeLabel = () => {
  return props.reportType === 'incident' ? 'Báo cáo sự cố thi công' : 'Báo cáo vấn đề kỹ thuật'
}

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'medium': return 'info'
    case 'low': return 'success'
    default: return 'secondary'
  }
}
</script>

<template>
  <div class="report-form">
    <div class="form-header mb-4">
      <h4 class="text-primary">{{ getReportTypeLabel() }}</h4>
      <p class="text-muted">Vui lòng điền đầy đủ thông tin báo cáo</p>
    </div>

    <div class="form-body">
      <div class="row">
        <div class="col-md-6">
          <FormField
            label="Công trình"
            type="select"
            v-model="formData.constructionCode"
            :options="[]"
            required
            class="mb-3"
          />

          <FormField
            label="Loại vấn đề"
            type="select"
            v-model="formData.issueType"
            :options="issueTypes"
            required
            class="mb-3"
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Mức độ ảnh hưởng"
            type="select"
            v-model="formData.severity"
            :options="severityLevels"
            required
            class="mb-3"
          >
            <template #option="{ option }">
              <span :class="'badge bg-' + getSeverityColor(option.value)">
                {{ option.label }}
              </span>
            </template>
          </FormField>

          <FormField
            label="Trạng thái"
            type="select"
            v-model="formData.status"
            :options="statusOptions"
            required
            class="mb-3"
          />
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <FormField
            label="Mô tả chi tiết"
            type="textarea"
            v-model="formData.description"
            rows="4"
            required
            class="mb-3"
            placeholder="Nhập mô tả chi tiết về vấn đề..."
          />
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <FormField
            label="Hình ảnh đính kèm"
            type="file"
            v-model="formData.images"
            multiple
            accept="image/*"
            class="mb-3"
          >
            <template #help>
              <small class="text-muted">Có thể tải lên nhiều hình ảnh (tối đa 5MB mỗi file)</small>
            </template>
          </FormField>
        </div>
      </div>
    </div>

    <div class="form-footer mt-4 d-flex justify-content-end gap-2">
      <!-- Xóa các nút ở đây, chỉ để lại trường nhập liệu -->
    </div>
  </div>
</template>

<style scoped>
.report-form {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.form-body {
  padding: 1rem 0;
}

.form-footer {
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.badge {
  padding: 0.5em 0.8em;
  font-weight: 500;
}

.btn {
  padding: 0.5rem 1.5rem;
  font-weight: 500;
}

.btn i {
  font-size: 0.9em;
}
</style>
