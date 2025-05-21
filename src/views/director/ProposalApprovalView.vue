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

onMounted(() => {
  fetchReports()
  console.log(reports.value)
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

const mainTab = ref('report') // 'report', 'material'
const reportTab = ref('technical') // 'technical', 'progress'

const showDetailModal = ref(false)
const detailReport = ref(null)

const handleRowClick = (item) => {
  detailReport.value = item
  showDetailModal.value = true
}

const handleApproveClick = async (event, report) => {
  event.stopPropagation()
  try {
    await updateReportStatus(report.id, 1)
    showMessage('Đã duyệt báo cáo thành công', 'success')
    await fetchReports()
  } catch (err) {
    console.error('Error approving report:', err)
    showMessage('Không thể duyệt báo cáo', 'error')
  }
}

const handleRejectClick = async (event, report) => {
  event.stopPropagation()
  try {
    await updateReportStatus(report.id, 2)
    showMessage('Đã từ chối báo cáo', 'success')
    await fetchReports()
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
</script>

<template>
  <div class="vertical-tabs-layout">
    <!-- Tabs dọc bên trái -->
    <div class="vertical-tabs">
      <button class="vertical-tab-btn" :class="{ active: mainTab === 'report' }" @click="mainTab = 'report'">
        <i class="fas fa-clipboard-list me-2"></i> Báo cáo
      </button>
      <div v-if="mainTab === 'report'" class="vertical-sub-tabs">
        <button class="vertical-sub-tab-btn" :class="{ active: reportTab === 'technical' }"
          @click="reportTab = 'technical'">
          <i class="fas fa-wrench me-1"></i> Sự cố kĩ thuật
        </button>
        <button class="vertical-sub-tab-btn" :class="{ active: reportTab === 'progress' }"
          @click="reportTab = 'progress'">
          <i class="fas fa-exclamation-triangle me-1"></i> Sự cố thi công
        </button>
      </div>
      <button class="vertical-tab-btn" :class="{ active: mainTab === 'material' }" @click="mainTab = 'material'">
        <i class="fas fa-boxes me-2"></i> Kế hoạch vật tư
      </button>
    </div>

    <!-- Nội dung bên phải -->
    <div class="vertical-tabs-content flex-grow-1">
      <transition name="fade" mode="out-in">
        <div v-if="mainTab === 'report'" key="report">
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
                class="report-table" @row-click="handleRowClick">
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
                  <div class="d-flex gap-2 justify-content-center">
                    <button
                      class="btn btn-sm"
                      :class="item.statusLogs[0].status === 0 ? 'btn-success' : 'btn-outline-success'"
                      @click="(e) => openNoteModal('approve', item, e)"
                      :disabled="item.statusLogs[0].status !== 0"
                      :title="item.statusLogs[0].status === 0 ? 'Duyệt báo cáo' : 'Báo cáo đã được xử lý'"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      class="btn btn-sm"
                      :class="item.statusLogs[0].status === 0 ? 'btn-danger' : 'btn-outline-danger'"
                      @click="(e) => openNoteModal('reject', item, e)"
                      :disabled="item.statusLogs[0].status !== 0"
                      :title="item.statusLogs[0].status === 0 ? 'Từ chối báo cáo' : 'Báo cáo đã được xử lý'"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </template>
              </DataTable>
              <DataTable v-else :columns="columns" :data="paginatedProgressReports" class="report-table"
                @row-click="handleRowClick">
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
                  <div class="d-flex gap-2 justify-content-center">
                    <button
                      class="btn btn-sm"
                      :class="item.statusLogs[0].status === 0 ? 'btn-success' : 'btn-outline-success'"
                      @click="(e) => openNoteModal('approve', item, e)"
                      :disabled="item.statusLogs[0].status !== 0"
                      :title="item.statusLogs[0].status === 0 ? 'Duyệt báo cáo' : 'Báo cáo đã được xử lý'"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      class="btn btn-sm"
                      :class="item.statusLogs[0].status === 0 ? 'btn-danger' : 'btn-outline-danger'"
                      @click="(e) => openNoteModal('reject', item, e)"
                      :disabled="item.statusLogs[0].status !== 0"
                      :title="item.statusLogs[0].status === 0 ? 'Từ chối báo cáo' : 'Báo cáo đã được xử lý'"
                    >
                      <i class="fas fa-times"></i>
                    </button>
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
                :items-per-page="itemsPerPage" :current-page="currentPage" @update:currentPage="handlePageChange" />
            </div>
          </div>
        </div>
        <div v-else-if="mainTab === 'material'" key="material">
          <MaterialPlanApprovalList />
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
        :title="noteAction === 'approve' ? 'Giải pháp đề xuất' : 'Lí do từ chối báo cáo'"
      >
        <div>
          <textarea
            v-model="noteText"
            class="form-control"
            rows="3"
            :placeholder="noteAction === 'approve' ? 'Nhập giải pháp đề xuất...' : 'Nhập lí do từ chối...'"
          ></textarea>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-secondary" @click="showNoteModal = false">Hủy</button>
            <button class="btn btn-primary" @click="handleNoteConfirm">Xác nhận</button>
          </div>
        </div>
      </ModalDialog>
    </div>
  </div>
</template>

<style scoped>
/* Tabs */
.main-tabs {
  display: flex;
  border-bottom: 2px solid #e3f0fa;
  background: transparent;
  margin-bottom: 0.5rem;
  gap: 0;
}

.main-tab-btn {
  border: none;
  background: none;
  padding: 0.7rem 1.4rem 0.6rem 1.4rem;
  font-weight: 500;
  font-size: 1rem;
  color: #555;
  border-bottom: 2.5px solid transparent;
  border-radius: 0;
  transition: color 0.2s, border-bottom 0.2s, background 0.2s;
  margin-right: 0.2rem;
  outline: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.main-tab-btn.active {
  color: #1976d2;
  background: #f6fbff;
  border-bottom: 2.5px solid #1976d2;
  font-weight: 600;
}

.main-tab-btn:not(.active):hover {
  background: #f1f5fa;
  color: #1976d2;
}

.sub-tabs {
  display: flex;
  border-bottom: 1.5px solid #e3f0fa;
  margin-bottom: 1.2rem;
  gap: 0;
}

.sub-tab-btn {
  border: none;
  background: none;
  padding: 0.5rem 1.1rem 0.4rem 1.1rem;
  font-weight: 500;
  font-size: 0.98rem;
  color: #555;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  transition: color 0.2s, border-bottom 0.2s, background 0.2s;
  margin-right: 0.1rem;
  outline: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sub-tab-btn.active {
  color: #1976d2;
  background: #f6fbff;
  border-bottom: 2px solid #1976d2;
  font-weight: 600;
}

.sub-tab-btn:not(.active):hover {
  background: #f1f5fa;
  color: #1976d2;
}

/* Table wrapper */
.table-wrapper {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 1.2rem 1rem 0.5rem 1rem;
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

/* Vertical Tabs */
.vertical-tabs-layout {
  display: flex;
  min-height: 600px;
  gap: 2rem;
}

.vertical-tabs {
  min-width: 220px;
  background: #fafdff;
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 2rem 1rem 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.vertical-tab-btn {
  border: none;
  background: none;
  padding: 0.9rem 1.2rem;
  font-size: 1.08rem;
  color: #555;
  border-radius: 0.8rem;
  text-align: left;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
}

.vertical-tab-btn.active {
  background: #e3f0fa;
  color: #1976d2;
  font-weight: 600;
}

.vertical-tab-btn:not(.active):hover {
  background: #f1f5fa;
  color: #1976d2;
}

.vertical-sub-tabs {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.vertical-sub-tab-btn {
  border: none;
  background: none;
  padding: 0.6rem 1.1rem;
  font-size: 0.98rem;
  color: #555;
  border-radius: 0.7rem;
  text-align: left;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
  margin-bottom: 0.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.vertical-sub-tab-btn.active {
  background: #f6fbff;
  color: #1976d2;
  font-weight: 600;
}

.vertical-sub-tab-btn:not(.active):hover {
  background: #f1f5fa;
  color: #1976d2;
}

.vertical-tabs-content {
  flex: 1;
  min-width: 0;
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
</style>
