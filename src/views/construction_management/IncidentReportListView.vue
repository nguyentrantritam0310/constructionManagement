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

const searchQuery = ref('')
const statusFilter = ref('')
const levelFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredReports = computed(() => {
  let result = [...reports.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(report =>
      report.id?.toString().includes(query) ||
      report.constructionName?.toLowerCase().includes(query) ||
      report.content?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(report => getStatusLabel(report.statusLogs[0].status) === statusFilter.value)
  }

  // Apply level filter
  if (levelFilter.value) {
    result = result.filter(report => report.level === levelFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(report => {
      const reportDate = new Date(report.reportDate)
      return reportDate >= start && reportDate <= end
    })
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  levelFilter.value = ''
  dateRange.value = {
    start: null,
    end: null
  }
}

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
    await updateReport(reportId, formData)
    showUpdateForm.value = false
    selectedReport.value = null
    reportFormData.value = {}
    showMessage('Cập nhật báo cáo thành công', 'success')
    await fetchReportsByThiCong()
  } catch (err) {
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

const handleResubmitSubmit = async (formData) => {
  try {
    const reportId = selectedReport.value.id
    await updateReport(reportId, formData)
    await updateReportStatus(reportId, 0, 'Báo cáo đã được gửi lại')
    showUpdateForm.value = false
    selectedReport.value = null
    reportFormData.value = {}
    showMessage('Gửi lại báo cáo thành công', 'success')
    await fetchReportsByThiCong()
  } catch (err) {
    showMessage(err.message || 'Có lỗi xảy ra khi gửi lại báo cáo', 'error')
  }
}

const handleEdit = (report) => {
  selectedReport.value = report
  reportFormData.value = { ...report }
  showUpdateForm.value = true
  showDetailDialog.value = false
}

const statusOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
  { value: 'Completed', label: 'Hoàn thành' }
]

const levelOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Thấp', label: 'Thấp' },
  { value: 'Trung bình', label: 'Trung bình' },
  { value: 'Cao', label: 'Cao' },
  { value: 'Nghiêm trọng', label: 'Nghiêm trọng' }
]

const isResubmitMode = computed(() => {
  if (selectedReport.value && selectedReport.value.statusLogs && selectedReport.value.statusLogs.length > 0) {
    return selectedReport.value.statusLogs[0].status === 2 // 2 là Rejected
  }
  return false
})
</script>

<template>
  <div class="management-report">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Báo Cáo Sự Cố Thi Công</h2>
      <ActionButton type="primary" icon="fas fa-plus" @click="showCreateForm = true">
        Tạo báo cáo mới
      </ActionButton>
    </div>

    <!-- Filter Section -->
    <div class="filter-section mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Tìm kiếm theo mã, tên công trình..."
            >
          </div>
        </div>
        <div class="col-md-2">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-tasks"></i>
            </span>
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
              <option value="Completed">Hoàn thành</option>
            </select>
          </div>
        </div>
        <div class="col-md-2">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-exclamation-triangle"></i>
            </span>
            <select class="form-control" v-model="levelFilter">
              <option value="">Tất cả mức độ</option>
              <option value="Thấp">Thấp</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Cao">Cao</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
            </select>
          </div>
        </div>
        <div class="col-md-2">
          <button class="btn btn-secondary w-100" @click="resetFilters">
            <i class="fas fa-undo me-2"></i>Đặt lại
          </button>
        </div>
        <div class="col-md-3">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-calendar"></i>
            </span>
            <input
              type="date"
              class="form-control"
              v-model="dateRange.start"
              placeholder="Từ ngày"
            >
          </div>
        </div>
        <div class="col-md-3">
          <div class="input-group">
            <span class="input-group-text">
              <i class="fas fa-calendar"></i>
            </span>
            <input
              type="date"
              class="form-control"
              v-model="dateRange.end"
              placeholder="Đến ngày"
            >
          </div>
        </div>
      </div>
    </div>

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
      :resubmitMode="isResubmitMode"
      @submit="handleUpdateSubmit"
      @resubmit="handleResubmitSubmit"
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
      :can-edit="true"
      @reject="handleReject"
      @approve="handleApprove"
      @resubmit="handleResubmitSubmit"
      @edit="handleEdit"
    />
  </div>
</template>

<style scoped>
.management-report {
  animation: fadeIn 0.3s ease-out;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.input-group-text {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem 0 0 0.5rem;
  padding: 0.5rem 1rem;
  color: #6c757d;
}

.input-group .form-control {
  border-radius: 0 0.5rem 0.5rem 0;
}

.btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
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
