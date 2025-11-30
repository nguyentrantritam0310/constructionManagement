<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDirectorProposal } from '../../composables/useDirectorProposal'
import { useManagementReport } from '../../composables/useManagementReport'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ReportForm from '../../components/common/ReportForm.vue'
import Pagination from '../../components/common/Pagination.vue'
import MaterialPlanApprovalList from '@/components/proposal-approval/MaterialPlanApprovalList.vue'
import ReportDetailDialog from '../../components/common/ReportDetailDialog.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import TourGuide from '../../components/common/TourGuide.vue'

const { showMessage } = useGlobalMessage()

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return reports.value.slice(start, end)
})

const paginatedTechnicalReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return technicalReports.value.slice(start, end)
})
const paginatedProgressReports = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return progressReports.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
}

const {
  loading,
  error,
  reports,
  formData,
  fetchReports,
  createReport,
  updateReport,
  updateReportStatus,
} = useManagementReport()

onMounted(async () => {
  await fetchReports()
  // Debug: Kiểm tra cấu trúc dữ liệu
  if (process.env.NODE_ENV === 'development' && reports.value && reports.value.length > 0) {
    console.log('Sample report data:', reports.value[0])
    console.log('StatusLogs structure:', reports.value[0]?.statusLogs || reports.value[0]?.StatusLogs)
    console.log('All reports:', reports.value.map(r => ({
      id: r.id || r.ID,
      hasStatusLogs: !!(r.statusLogs || r.StatusLogs),
      statusLogsCount: (r.statusLogs || r.StatusLogs)?.length || 0,
      firstStatus: (r.statusLogs || r.StatusLogs)?.[0]?.status || (r.statusLogs || r.StatusLogs)?.[0]?.Status
    })))
  }
})

const columns = [
  { key: 'id', label: 'Mã báo cáo' },
  { key: 'constructionName', label: 'Công trình' },
  { key: 'content', label: 'Mô tả' },
  { key: 'level', label: 'Mức độ' },
  { key: 'statusLogs[0].status', label: 'Trạng thái' },
  { key: 'reportDate', label: 'Ngày tạo' },
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

const handleSubmit = async () => {
  if (!validateForm()) {
    alert('Vui lòng nhập đầy đủ thông tin bắt buộc')
    return
  }

  try {
    await createReport(newReport.value)
    showCreateForm.value = false
    alert('Báo cáo đã được gửi thành công')
  } catch (err) {
    console.error('Error creating report:', err)
    alert('Có lỗi xảy ra khi gửi báo cáo')
  }
}

const handleUpdateStatus = async (report) => {
  selectedReport.value = report
  showUpdateForm.value = true
}

const handleUpdateSubmit = async (updatedReport) => {
  try {
    await updateReport(updatedReport.id, updatedReport)
    showUpdateForm.value = false
    selectedReport.value = null
    alert('Cập nhật báo cáo thành công')
  } catch (err) {
    console.error('Error updating report:', err)
    alert('Có lỗi xảy ra khi cập nhật báo cáo')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN')
}

const getStatusLabel = (status) => {
  switch (status) {
    case 0:
      return 'Chờ duyệt'
    case 1:
      return 'Đã duyệt'
    case 2:
      return 'Đã từ chối'
    case 3:
      return 'Hoàn thành'
    default:
      return 'Không xác định'
  }
}

const getReportStatus = (report) => {
  // Xử lý cả camelCase và PascalCase - kiểm tra tất cả các khả năng
  const statusLogs = report.statusLogs || report.StatusLogs || report.statusLogs || []
  
  // Debug chi tiết
  if (process.env.NODE_ENV === 'development') {
    const reportId = report.id || report.ID || report.Id
    if (!statusLogs || !Array.isArray(statusLogs) || statusLogs.length === 0) {
      console.warn(`⚠️ Report ${reportId} không có statusLogs:`, {
        id: reportId,
        hasStatusLogs: !!report.statusLogs,
        hasStatusLogsCapital: !!report.StatusLogs,
        statusLogsType: typeof report.statusLogs,
        statusLogsValue: report.statusLogs,
        allKeys: Object.keys(report)
      })
    } else {
      console.log(`✅ Report ${reportId} có ${statusLogs.length} statusLogs:`, {
        firstLog: statusLogs[0],
        firstStatus: statusLogs[0]?.status ?? statusLogs[0]?.Status
      })
    }
  }
  
  if (!statusLogs || !Array.isArray(statusLogs) || statusLogs.length === 0) {
    return 0 // Mặc định là Pending nếu không có statusLogs
  }
  
  // Lấy status từ log đầu tiên (đã được sắp xếp theo ngày giảm dần từ backend)
  const firstLog = statusLogs[0]
  if (!firstLog) {
    return 0
  }
  
  // Thử nhiều cách để lấy status
  let status = firstLog.status ?? firstLog.Status ?? firstLog.status ?? 0
  
  // Nếu status là string, thử parse
  if (typeof status === 'string') {
    // Xử lý enum string như "Pending", "Approved", etc.
    const statusMap = {
      'Pending': 0,
      'Approved': 1,
      'Rejected': 2,
      'Completed': 3,
      '0': 0,
      '1': 1,
      '2': 2,
      '3': 3
    }
    status = statusMap[status] ?? parseInt(status, 10)
  }
  
  // Đảm bảo status là số hợp lệ
  const statusNumber = typeof status === 'number' ? status : parseInt(status, 10)
  
  if (isNaN(statusNumber) || statusNumber < 0 || statusNumber > 3) {
    console.warn('⚠️ Status không hợp lệ:', {
      originalStatus: firstLog.status ?? firstLog.Status,
      parsedStatus: statusNumber,
      reportId: report.id || report.ID,
      firstLog: firstLog
    })
    return 0 // Mặc định là Pending
  }
  
  return statusNumber
}

const mainTab = ref('report') // 'report', 'material'
const reportTab = ref('technical') // 'technical', 'progress'

const showDetailModal = ref(false)
const detailReport = ref(null)

const handleRowClick = (item) => {
  detailReport.value = item
  showDetailModal.value = true
}

const handleApproveClick = async (report, note = '') => {
  try {
    await updateReportStatus(report.id, 1, note)
    showMessage('Đã duyệt báo cáo thành công', 'success')
    await fetchReports()
    showDetailModal.value = false
  } catch (err) {
    console.error('Error approving report:', err)
    showMessage('Không thể duyệt báo cáo', 'error')
  }
}

const handleRejectClick = async (report, note = '') => {
  try {
    await updateReportStatus(report.id, 2, note)
    showMessage('Đã từ chối báo cáo', 'success')
    await fetchReports()
    showDetailModal.value = false
  } catch (err) {
    console.error('Error rejecting report:', err)
    showMessage('Không thể từ chối báo cáo', 'error')
  }
}

const technicalReports = computed(() =>
  reports.value.filter(r => r.reportType === "Sự cố kĩ thuật")
)
const progressReports = computed(() =>
  reports.value.filter(r => r.reportType === "Sự cố thi công")
)

const showNoteModal = ref(false)
const noteAction = ref(null)
const noteReport = ref(null)
const noteText = ref('')

const openNoteModal = (action, report, event) => {
  if (event) event.stopPropagation()
  noteAction.value = action
  noteReport.value = report
  noteText.value = ''
  showNoteModal.value = true
}

const handleNoteConfirm = async () => {
  if (!noteReport.value) return
  try {
    const status = noteAction.value === 'approve' ? 1 : 2
    await updateReportStatus(noteReport.value.id, status, noteText.value)
    showMessage(
      noteAction.value === 'approve'
        ? 'Đã duyệt báo cáo thành công'
        : 'Đã từ chối báo cáo',
      'success'
    )
    await fetchReports()
  } catch (err) {
    showMessage('Có lỗi xảy ra', 'error')
  } finally {
    showNoteModal.value = false
    noteReport.value = null
    noteAction.value = null
    noteText.value = ''
  }
}

const showTourGuide = ref(false)
</script>

<template>
  <div class="container-fluid py-4" data-tour="title">
    <!-- Tabs ngang ở trên -->
    <div class="tabs-wrapper">
      <div class="proposal-tabs-bar" data-tour="main-tabs">
        <div class="tab-group">
          <button 
            class="tab-bar-item" 
            :class="{ active: mainTab === 'report' }" 
            @click="mainTab = 'report'" 
            data-tour="report-tab"
          >
            <i class="fas fa-clipboard-list me-2"></i> Báo cáo
          </button>
          <!-- Sub-tabs cho tab Báo cáo -->
          <div v-if="mainTab === 'report'" class="sub-tabs-wrapper" data-tour="sub-tabs">
            <button 
              class="sub-tab-bar-item" 
              :class="{ active: reportTab === 'technical' }"
              @click="reportTab = 'technical'" 
              data-tour="technical-tab"
            >
              <i class="fas fa-wrench me-1"></i> Sự cố kĩ thuật
            </button>
            <button 
              class="sub-tab-bar-item" 
              :class="{ active: reportTab === 'progress' }"
              @click="reportTab = 'progress'" 
              data-tour="progress-tab"
            >
              <i class="fas fa-exclamation-triangle me-1"></i> Sự cố thi công
            </button>
          </div>
        </div>
        <button 
          class="tab-bar-item" 
          :class="{ active: mainTab === 'material' }" 
          @click="mainTab = 'material'" 
          data-tour="material-tab"
        >
          <i class="fas fa-boxes me-2"></i> Kế hoạch vật tư
        </button>
      </div>
    </div>

    <!-- Nội dung -->
    <div class="tabs-content">
      <transition name="fade" mode="out-in">
        <div v-if="mainTab === 'report'" key="report" data-tour="title">
          <div class="technical-report">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>
            <div class="table-wrapper">
              <DataTable v-if="reportTab === 'technical'" :columns="columns" :data="paginatedTechnicalReports"
                class="report-table" @row-click="handleRowClick" data-tour="table">
                <template #level="{ item }">
                  <StatusBadge :status="item.level" />
                </template>

                <template #statusLogs[0].status="{ item }">
                  <StatusBadge :status="getStatusLabel(getReportStatus(item))" />
                </template>

                <template #reportDate="{ item }">
                  {{ formatDate(item.reportDate) }}
                </template>

                <template #actions="{ item }">
                  <div class="d-flex justify-content-start gap-2">
                    <ActionButton 
                      v-if="getReportStatus(item) === 0"
                      type="success" 
                      icon="fas fa-check" 
                      @click.stop="(e) => openNoteModal('approve', item, e)"
                      title="Duyệt"
                      data-tour="approve-button"
                    ></ActionButton>
                    <ActionButton 
                      v-if="getReportStatus(item) === 0"
                      type="danger" 
                      icon="fas fa-times" 
                      @click.stop="(e) => openNoteModal('reject', item, e)"
                      title="Từ chối"
                      data-tour="reject-button"
                    ></ActionButton>
                  </div>
                </template>
              </DataTable>
              <DataTable v-else :columns="columns" :data="paginatedProgressReports" class="report-table"
                @row-click="handleRowClick" data-tour="table">
                <template #level="{ item }">
                  <StatusBadge :status="item.level" />
                </template>

                <template #statusLogs[0].status="{ item }">
                  <StatusBadge :status="getStatusLabel(getReportStatus(item))" />
                </template>

                <template #reportDate="{ item }">
                  {{ formatDate(item.reportDate) }}
                </template>

                <template #actions="{ item }">
                  <div class="d-flex justify-content-start gap-2">
                    <ActionButton 
                      v-if="getReportStatus(item) === 0"
                      type="success" 
                      icon="fas fa-check" 
                      @click.stop="(e) => openNoteModal('approve', item, e)"
                      title="Duyệt"
                      data-tour="approve-button"
                    ></ActionButton>
                    <ActionButton 
                      v-if="getReportStatus(item) === 0"
                      type="danger" 
                      icon="fas fa-times" 
                      @click.stop="(e) => openNoteModal('reject', item, e)"
                      title="Từ chối"
                      data-tour="reject-button"
                    ></ActionButton>
                  </div>
                </template>
              </DataTable>
            </div>
            <!-- Phân trang -->
            <div class="d-flex justify-content-between align-items-center mt-4">
              <div class="text-muted">
                Hiển thị {{
                  reportTab === 'technical'
                    ? paginatedTechnicalReports.length
                    : paginatedProgressReports.length
                }} trên {{
                  reportTab === 'technical'
                    ? technicalReports.length
                    : progressReports.length
                }} báo cáo
              </div>
              <Pagination :total-items="reportTab === 'technical' ? technicalReports.length : progressReports.length"
                :items-per-page="itemsPerPage" :current-page="currentPage" @update:currentPage="handlePageChange" data-tour="pagination" />
            </div>
          </div>
        </div>
        <div v-else-if="mainTab === 'material'" key="material" data-tour="title">
          <div data-tour="material-content">
            <MaterialPlanApprovalList />
          </div>
        </div>
      </transition>
      <!-- Modal chi tiết báo cáo giữ nguyên -->
      <ReportDetailDialog
        v-if="detailReport"
        v-model:show="showDetailModal"
        :report="detailReport"
        :show-actions="true"
        @reject="handleRejectClick"
        @approve="handleApproveClick"
      />
      <ModalDialog
        v-if="showNoteModal"
        :show="showNoteModal"
        @update:show="showNoteModal = $event"
        :title="noteAction === 'approve' ? 'Duyệt báo cáo' : 'Từ chối báo cáo'"
      >
        <div class="status-note-input">
          <div class="form-group">
            <label class="form-label">
              {{ noteAction === 'approve' ? 'Giải pháp đề xuất:' : 'Lý do từ chối:' }}
            </label>
            <textarea
              v-model="noteText"
              class="form-control"
              rows="4"
              :placeholder="noteAction === 'approve' ? 'Nhập giải pháp đề xuất...' : 'Nhập lý do từ chối...'"
            ></textarea>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" @click="showNoteModal = false">Hủy</button>
            <button 
              class="btn" 
              :class="noteAction === 'approve' ? 'btn-primary' : 'btn-danger'"
              @click="handleNoteConfirm"
            >
              {{ noteAction === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối' }}
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
    
  </div>
</template>

<style scoped>
/* Tabs Wrapper */
.tabs-wrapper {
  margin-bottom: 1.5rem;
}

/* Horizontal Tabs - Main Tabs (giống ShiftAssignmentView) */
.proposal-tabs-bar {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.tab-group {
  display: flex;
  flex-direction: column;
  position: relative;
}

.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
  display: flex;
  align-items: center;
}

.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}

.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

/* Sub Tabs Wrapper */
.sub-tabs-wrapper {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  padding-left: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
  border-top: 1px solid #e9ecef;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sub-tab-bar-item {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6c757d;
  background: transparent;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.sub-tab-bar-item.active {
  background: #0d6efd;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
}

.sub-tab-bar-item:not(.active):hover {
  background: #e7f1ff;
  color: #0d6efd;
}

/* Table wrapper */
.table-wrapper {
  margin-bottom: 2rem;
}

/* Modal chi tiết */
.report-detail-modal {
  background: #fafdff;
  border-radius: 1.2rem;
  padding: 1.2rem 1rem 0.5rem 1rem;
}

.report-detail-modal .header {
  border-bottom: 1.5px solid #e3f0fa;
  margin-bottom: 1.2rem;
  padding-bottom: 1rem;
}

.report-detail-modal .badge-type {
  background: #e3f0fa;
  color: #1976d2;
  font-weight: 500;
  font-size: 0.98rem;
  padding: 0.45em 1em;
  border-radius: 1.2em;
}

.report-detail-modal .badge-level {
  font-weight: 500;
  font-size: 0.98rem;
  padding: 0.45em 1em;
  border-radius: 1.2em;
}

.report-detail-modal .badge-level.Cao {
  background: #fff3cd;
  color: #856404;
}

.report-detail-modal .badge-level.Trung\ bình {
  background: #d1ecf1;
  color: #0c5460;
}

.report-detail-modal .badge-level.Thấp {
  background: #d4edda;
  color: #155724;
}

.report-detail-modal .badge-level.Nghiêm\ trọng {
  background: #f8d7da;
  color: #721c24;
}

.report-detail-modal .img-sample img {
  border-radius: 10px;
  border: 1.5px solid #e0e0e0;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.report-detail-modal .img-sample img:hover {
  transform: scale(1.04);
  box-shadow: 0 6px 24px rgba(21, 101, 192, 0.12);
}

.report-detail-modal .img-upload-date {
  margin-top: 0.5rem;
}

/* Tabs Content */
.tabs-content {
  width: 100%;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
  transition: all 0.2s;
}

.btn-sm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.gap-2 {
  gap: 0.5rem;
}

/* Status note input modal styling */
.status-note-input {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
}

.status-note-input .form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.status-note-input .form-control {
  resize: none;
  border-radius: 0.375rem;
  border-color: #ced4da;
}

.status-note-input .form-control:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style>
