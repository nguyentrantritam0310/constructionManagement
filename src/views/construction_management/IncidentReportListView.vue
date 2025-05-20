<script setup>
import { ref, onMounted, computed } from 'vue'
import { useManagementReport } from '../../composables/useManagementReport'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'

import StatusBadge from '../../components/common/StatusBadge.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ReportForm from '../../components/common/ReportForm.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateReportForm from '../../components/incident-report/UpdateReportForm.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ReportDetailDialog from '../../components/common/ReportDetailDialog.vue'
import UpdateButton from '../../components/common/UpdateButton.vue'

const { showMessage } = useGlobalMessage()


const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)
const showDetailDialog = ref(false)
const detailReport = ref(null)
const reportFormData = ref({})

const filteredReports = ref([])

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredReports.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}
const {
  loading,
  error,
  reports,
  formData,
  fetchReportsByThiCong,
  createReport,
  updateReport,
  updateReportStatus
} = useManagementReport()

onMounted(() => {
  fetchReportsByThiCong()
})
const columns = [
  { key: 'id', label: 'Mã báo cáo' },
  { key: 'constructionName', label: 'Công trình' },
  { key: 'content', label: 'Mô tả' },
  { key: 'level', label: 'Mức độ' },
  { key: 'statusLogs[0].status', label: 'Trạng thái' },
  { key: 'reportDate', label: 'Ngày báo cáo' }
]

const problemTypes = [
  { value: 'Chậm tiến độ', label: 'Chậm tiến độ' },
  { value: 'Thiếu vật liệu', label: 'Thiếu vật liệu' },
  { value: 'Sự cố thiết bị', label: 'Sự cố thiết bị' },
  { value: 'Vấn đề khác', label: 'Vấn đề khác' }
]

const securityLevels = [
  { value: 'Thấp', label: 'Thấp' },
  { value: 'Trung bình', label: 'Trung bình' },
  { value: 'Cao', label: 'Cao' },
  { value: 'Nghiêm trọng', label: 'Nghiêm trọng' }
]
const validateForm = () => {
  if (!newReport.value.constructionCode || !newReport.value.problemType ||
    !newReport.value.content || !newReport.value.level) {
    return false
  }
  return true
}
const handleSubmit = async (formData) => {
  try {
    await createReport(formData)
    showCreateForm.value = false
    showMessage('Báo cáo đã được tạo thành công', 'success')
    await fetchReportsByThiCong() // Refresh the list
  } catch (err) {
    console.error('Error creating report:', err)
    showMessage('Có lỗi xảy ra khi tạo báo cáo', 'error')
  }
}
const handleUpdateStatus = (report) => {
  selectedReport.value = report
  showUpdateForm.value = true
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const handleUpdateSubmit = async (formData) => {
  try {
    const reportId = selectedReport.value.id
    console.log('🔄 Updating report:', reportId)
    console.log('📦 Form data contents:')
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? `File(${value.name})` : value}`)
    }

    await updateReport(reportId, formData)
    showUpdateForm.value = false
    selectedReport.value = null
    reportFormData.value = {}
    showMessage('Cập nhật báo cáo thành công', 'success')
    await fetchReportsByThiCong()
  } catch (err) {
    console.error('Error updating report:', err)
    showMessage(err.message || 'Có lỗi xảy ra khi cập nhật báo cáo', 'error')
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Approved'
    case 2:
      return 'Rejected'
    case 3:
      return 'Completed'
    default:
      return 'Không xác định'
  }
}

const handleRowClick = (item) => {
  detailReport.value = item
  showDetailDialog.value = true
}

const handleReject = async (report) => {
  try {
    await updateReportStatus(report.id, 'Rejected')
    showMessage('Đã từ chối báo cáo', 'success')
    await fetchReportsByThiCong()
  } catch (err) {
    console.error('Error rejecting report:', err)
    showMessage('Không thể từ chối báo cáo', 'error')
  }
}

const handleApprove = async (report) => {
  try {
    await updateReportStatus(report.id, 'Approved')
    showMessage('Đã duyệt báo cáo', 'success')
    await fetchReportsByThiCong()
  } catch (err) {
    console.error('Error approving report:', err)
    showMessage('Không thể duyệt báo cáo', 'error')
  }
}
</script>

<template>
  <div class="management-report">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Báo Cáo Sự Cố Thi Công</h2>
      <ActionButton type="primary" icon="fas fa-plus" @click="showCreateForm = true">
        Tạo báo cáo mới
      </ActionButton>
    </div>

    <!-- Advanced Filter -->
    <AdvancedFilter :items="reports" :searchFields="['constructionName', 'content', 'problemType']"
      dateField="reportDate" statusField="statusLogs[0].status" v-model:filteredItems="filteredReports" />
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <DataTable :columns="columns" :data="paginatedReports" class="report-table" @row-click="handleRowClick">
      <template #problemType="{ item }">
        <span :class="'badge bg-' + (item.problemType === 'Chậm tiến độ' ? 'warning' :
          item.problemType === 'Thiếu vật liệu' ? 'info' :
            item.problemType === 'Sự cố thiết bị' ? 'danger' : 'secondary')">
          {{ item.problemType }}
        </span>
      </template>

      <template #level="{ item }">
        <span :class="'badge bg-' + (item.level === 'Nghiêm trọng' ? 'danger' :
          item.level === 'Cao' ? 'warning' :
            item.level === 'Trung bình' ? 'info' : 'success')">
          {{ item.level }}
        </span>
      </template>

      <template #statusLogs[0].status="{ item }">
        <StatusBadge :status="getStatusLabel(item.statusLogs[0].status)" />
      </template>

      <template #reportDate="{ item }">
        {{ formatDate(item.reportDate) }}
      </template>

      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <UpdateButton @click.stop="handleUpdateStatus(item)" />
        </div>
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedReports.length }} trên {{ filteredReports.length }} báo cáo
      </div>
      <Pagination :total-items="filteredReports.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Form tạo báo cáo mới -->
    <FormDialog
      v-model:show="showCreateForm"
      title="Tạo Báo Cáo Mới"
      submitText="Tạo báo cáo"
      :formData="reportFormData"
      @submit="handleSubmit"
    >
      <ReportForm
        mode="create"
        reportType="incident"
        v-model="reportFormData"
      />
    </FormDialog>

    <!-- Form cập nhật báo cáo -->
    <FormDialog
      v-model:show="showUpdateForm"
      title="Cập Nhật Báo Cáo"
      submitText="Cập nhật"
      :formData="reportFormData"
      @submit="handleUpdateSubmit"
    >
      <ReportForm
        mode="update"
        reportType="incident"
        :report="selectedReport"
        v-model="reportFormData"
      />
    </FormDialog>

    <ReportDetailDialog
      v-if="detailReport"
      v-model:show="showDetailDialog"
      :report="detailReport"
      @reject="handleReject"
      @approve="handleApprove"
    />
  </div>
</template>

<style scoped>
.management-report {
  animation: fadeIn 0.3s ease-out;
}

.report-table {
  margin-bottom: 2rem;
}

.gap-2 {
  gap: 0.5rem;
}

.action-btn {
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
  color: #007bff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
