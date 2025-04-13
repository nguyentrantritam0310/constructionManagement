<script setup>
import { ref } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import UpdateReportForm from '../../components/technical-report/UpdateReportForm.vue'

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)

const reports = ref([
  {
    id: 1,
    projectCode: 'PRJ001',
    projectName: 'Khu chung cư The Sun',
    issueType: 'equipment',
    description: 'Máy trộn bê tông gặp sự cố',
    severity: 'high',
    status: 'Pending',
    reportDate: '2024-03-15',
    images: [],
    updates: []
  }
])

const columns = [
  { key: 'projectName', label: 'Công trình' },
  { key: 'issueType', label: 'Loại vấn đề' },
  { key: 'description', label: 'Mô tả' },
  { key: 'severity', label: 'Mức độ' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'reportDate', label: 'Ngày báo cáo' }
]

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

const newReport = ref({
  projectCode: '',
  projectName: '',
  issueType: '',
  description: '',
  severity: '',
  images: []
})

const validateForm = () => {
  if (!newReport.value.projectCode || !newReport.value.issueType ||
      !newReport.value.description || !newReport.value.severity) {
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }

  const report = {
    ...newReport.value,
    id: Date.now(),
    status: 'Pending',
    reportDate: new Date().toISOString().split('T')[0],
    updates: []
  }

  reports.value.unshift(report)
  showCreateForm.value = false
  alert('Báo cáo đã được gửi thành công')
}

const handleUpdateStatus = (report) => {
  selectedReport.value = report
  showUpdateForm.value = true
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const handleUpdateSubmit = (updatedReport) => {
  const index = reports.value.findIndex(r => r.id === updatedReport.id)
  if (index !== -1) {
    reports.value[index] = updatedReport
    showUpdateForm.value = false
    selectedReport.value = null
    alert('Cập nhật báo cáo thành công')
  }
}
</script>

<template>
  <div class="technical-report">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Báo Cáo Sự Cố Và Vấn Đề Kỹ Thuật</h2>
      <ActionButton
        type="primary"
        icon="fas fa-plus"
        @click="showCreateForm = true"
      >
        Tạo báo cáo mới
      </ActionButton>
    </div>

    <DataTable
      :columns="columns"
      :data="reports"
      class="report-table"
    >
      <template #issueType="{ item }">
        <span :class="'badge bg-' + (item.issueType === 'equipment' ? 'warning' :
                                   item.issueType === 'material' ? 'info' :
                                   item.issueType === 'construction' ? 'danger' : 'secondary')">
          {{ issueTypes.find(t => t.value === item.issueType)?.label }}
        </span>
      </template>

      <template #severity="{ item }">
        <span :class="'badge bg-' + (item.severity === 'critical' ? 'danger' :
                                   item.severity === 'high' ? 'warning' :
                                   item.severity === 'medium' ? 'info' : 'success')">
          {{ severityLevels.find(s => s.value === item.severity)?.label }}
        </span>
      </template>

      <template #status="{ item }">
        <StatusBadge :status="item.status" />
      </template>

      <template #reportDate="{ item }">
        {{ formatDate(item.reportDate) }}
      </template>

      <template #actions="{ item }">
        <ActionButton
          type="primary"
          icon="fas fa-edit"
          tooltip="Cập nhật trạng thái"
          @click="handleUpdateStatus(item)"
        />
      </template>
    </DataTable>

    <!-- Form tạo báo cáo mới -->
    <ModalDialog
      v-model:show="showCreateForm"
      title="Tạo Báo Cáo Mới"
      size="lg"
    >
      <div class="p-3">
        <div class="mb-3">
          <label class="form-label">Công trình</label>
          <select v-model="newReport.projectCode" class="form-select">
            <option value="">-- Chọn công trình --</option>
            <option value="PRJ001">Khu chung cư The Sun</option>
            <option value="PRJ002">Cao ốc văn phòng Star</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Loại vấn đề</label>
          <select v-model="newReport.issueType" class="form-select">
            <option value="">-- Chọn loại vấn đề --</option>
            <option v-for="type in issueTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Mức độ ảnh hưởng</label>
          <select v-model="newReport.severity" class="form-select">
            <option value="">-- Chọn mức độ --</option>
            <option v-for="level in severityLevels" :key="level.value" :value="level.value">
              {{ level.label }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Mô tả vấn đề</label>
          <textarea
            v-model="newReport.description"
            class="form-control"
            rows="4"
            placeholder="Mô tả chi tiết vấn đề..."
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Hình ảnh</label>
          <input type="file" class="form-control" multiple accept="image/*">
        </div>

        <div class="d-flex justify-content-end gap-2">
          <ActionButton
            type="secondary"
            @click="showCreateForm = false"
          >
            Hủy
          </ActionButton>
          <ActionButton
            type="primary"
            @click="handleSubmit"
          >
            Gửi báo cáo
          </ActionButton>
        </div>
      </div>
    </ModalDialog>

    <!-- Form cập nhật báo cáo -->
    <ModalDialog
      v-if="selectedReport"
      v-model:show="showUpdateForm"
      title="Cập Nhật Báo Cáo"
      size="lg"
    >
      <UpdateReportForm
        :report="selectedReport"
        @submit="handleUpdateSubmit"
        @cancel="showUpdateForm = false"
      />
    </ModalDialog>
  </div>
</template>

<style scoped>
.technical-report {
  animation: fadeIn 0.3s ease-out;
}

.report-table {
  margin-bottom: 2rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
