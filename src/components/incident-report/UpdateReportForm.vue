<script setup>
import { ref, watch } from 'vue'
import ActionButton from '../common/ActionButton.vue'
import StatusBadge from '../common/StatusBadge.vue'

const props = defineProps({
  report: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  description: '',
  status: '',
  updateNote: '',
  newImages: []
})

// Khởi tạo form data từ report
watch(() => props.report, (newReport) => {
  if (newReport) {
    formData.value = {
      description: newReport.description,
      status: newReport.status,
      updateNote: '',
      newImages: []
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
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
  { value: 'critical', label: 'Nghiêm trọng' }
]

const statusOptions = [
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'In Progress', label: 'Đang xử lý' },
  { value: 'Resolved', label: 'Đã giải quyết' },
  { value: 'Closed', label: 'Đã đóng' }
]

const handleSubmit = () => {
  if (!formData.value.description.trim() || !formData.value.status) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }

  const updateData = {
    ...props.report,
    ...formData.value,
    lastUpdated: new Date().toISOString(),
    updates: [
      ...(props.report.updates || []),
      {
        date: new Date().toISOString(),
        note: formData.value.updateNote,
        status: formData.value.status
      }
    ]
  }

  emit('submit', updateData)
}
</script>

<template>
  <div class="update-report-form">
    <div class="report-info mb-4">
      <div class="row">
        <div class="col-md-6">
          <div class="info-group">
            <label class="form-label">Công trình:</label>
            <p class="mb-1">{{ report.projectName }}</p>
          </div>
          <div class="info-group">
            <label class="form-label">Loại vấn đề:</label>
            <span class="badge bg-info">
              {{ issueTypes.find(t => t.value === report.issueType)?.label }}
            </span>
          </div>
        </div>
        <div class="col-md-6">
          <div class="info-group">
            <label class="form-label">Mức độ:</label>
            <span :class="'badge bg-' + (report.severity === 'critical' ? 'danger' :
                                       report.severity === 'high' ? 'warning' :
                                       report.severity === 'medium' ? 'info' : 'success')">
              {{ severityLevels.find(s => s.value === report.severity)?.label }}
            </span>
          </div>
          <div class="info-group">
            <label class="form-label">Trạng thái hiện tại:</label>
            <StatusBadge :status="report.status" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="mb-3">
        <label class="form-label">Mô tả vấn đề</label>
        <textarea
          v-model="formData.description"
          class="form-control"
          rows="4"
          placeholder="Cập nhật mô tả chi tiết..."
        ></textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Trạng thái mới</label>
        <select v-model="formData.status" class="form-select">
          <option value="">-- Chọn trạng thái --</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Ghi chú cập nhật</label>
        <textarea
          v-model="formData.updateNote"
          class="form-control"
          rows="3"
          placeholder="Nhập ghi chú về cập nhật này..."
        ></textarea>
      </div>

      <div class="mb-3">
        <label class="form-label">Thêm hình ảnh mới</label>
        <input type="file" class="form-control" multiple accept="image/*">
      </div>

      <!-- Lịch sử cập nhật -->
      <div class="update-history mb-4">
        <h6 class="mb-3">Lịch sử cập nhật</h6>
        <div class="timeline">
          <div v-for="(update, index) in report.updates" :key="index" class="timeline-item">
            <div class="timeline-date">
              {{ new Date(update.date).toLocaleDateString('vi-VN') }}
            </div>
            <div class="timeline-content">
              <StatusBadge :status="update.status" />
              <p class="mb-0 mt-2">{{ update.note }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <ActionButton
          type="secondary"
          @click="$emit('cancel')"
        >
          Hủy
        </ActionButton>
        <ActionButton
          type="primary"
          @click="handleSubmit"
        >
          Cập nhật
        </ActionButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.update-report-form {
  padding: 1rem;
}

.info-group {
  margin-bottom: 1rem;
}

.info-group label {
  font-weight: 500;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.timeline {
  border-left: 2px solid #dee2e6;
  padding-left: 1.5rem;
  margin-left: 0.5rem;
}

.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.75rem;
  top: 0.25rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #007bff;
  border: 2px solid #fff;
}

.timeline-date {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.timeline-content {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>