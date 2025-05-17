<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDirectorProposal } from '../../composables/useDirectorProposal'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ReportForm from '../../components/common/ReportForm.vue'
import Pagination from '../../components/common/Pagination.vue'
import MaterialPlanApprovalList from '@/components/proposal-approval/MaterialPlanApprovalList.vue'

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
  updateReportStatus
} = useDirectorProposal()

onMounted(() => {
  fetchReports()
  console.log(reports.value)
})

const columns = [
  { key: 'id', label: 'Mã báo cáo' },
  { key: 'constructionName', label: 'Công trình' },
  { key: 'problemType', label: 'Loại vấn đề' },
  { key: 'content', label: 'Mô tả' },
  { key: 'level', label: 'Mức độ' },
  { key: 'statusLogs[0].status', label: 'Trạng thái' },
  { key: 'reportDate', label: 'Ngày tạo' }
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
      return 'Chờ phê duyệt'
    case 1:
      return 'Đã phê duyệt'
    case 2:
      return 'Đã từ chối'
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

const handleReject = (report) => {
  // TODO: Gọi API từ chối báo cáo
  alert('Từ chối báo cáo #' + report.id)
  showDetailModal.value = false
}

const handleApprove = (report) => {
  // TODO: Gọi API duyệt báo cáo
  alert('Duyệt báo cáo #' + report.id)
  showDetailModal.value = false
}

const technicalReports = computed(() =>
  reports.value.filter(r => r.reportType === "Vấn đề kỹ thuật") // hoặc điều kiện phù hợp
)
const progressReports = computed(() =>
  reports.value.filter(r => r.reportType === "Sự cố thi công") // hoặc điều kiện phù hợp
)

const sampleImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80"
]
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
          <i class="fas fa-tools me-1"></i> Vấn đề kỹ thuật
        </button>
        <button class="vertical-sub-tab-btn" :class="{ active: reportTab === 'progress' }"
          @click="reportTab = 'progress'">
          <i class="fas fa-chart-line me-1"></i> Tiến độ thi công
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
            <!-- Advanced Filter -->

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
                class="report-table" @row-click="handleRowClick" />
              <DataTable v-else :columns="columns" :data="paginatedProgressReports" class="report-table"
                @row-click="handleRowClick" />
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
      <ModalDialog v-model:show="showDetailModal" title="Chi Tiết Báo Cáo" size="lg">
        <template v-if="detailReport">
          <div class="report-detail-modal">
            <!-- Header: Ngày tạo + Công trình + badge + trạng thái -->
            <div class="header mb-4 pb-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between">
                <div>
                  <div class="text-muted small mb-1">
                    <i class="fas fa-calendar-alt me-1"></i>Ngày tạo:
                    <span class="fw-medium">{{ formatDate(detailReport.reportDate) }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-3 flex-wrap">
                    <i class="fas fa-building fa-2x text-primary"></i>
                    <div>
                      <div class="fw-bold fs-5 mb-1">{{ detailReport.constructionName }}</div>
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="badge badge-type">
                          <i class="fas fa-exclamation-circle me-1"></i>
                          {{ detailReport.problemType }}
                        </span>
                        <span class="badge badge-level" :class="detailReport.level">
                          <i class="fas fa-signal me-1"></i>
                          {{ detailReport.level }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-flex align-items-center gap-2 mt-3 mt-md-0">
                  <span class="text-muted small"><i class="fas fa-info-circle me-1"></i>Trạng thái:</span>
                  <StatusBadge :status="getStatusLabel(detailReport.statusLogs[0].status)" />
                </div>
              </div>
            </div>
            <!-- Mô tả full width -->
            <div class="row mb-3">
              <div class="col-12 mb-3">
                <div class="text-muted small mb-1"><i class="fas fa-align-left me-1"></i>Mô tả vấn đề</div>
                <div class="bg-light rounded p-3">{{ detailReport.content }}</div>
              </div>
            </div>
            <!-- Ảnh đính kèm -->
            <div class="mb-3">
              <div class="text-muted small mb-2"><i class="fas fa-images me-1"></i>Ảnh đính kèm</div>
              <div class="row g-3">
                <div v-for="i in 5" :key="i" class="col-12 col-md-4">
                  <div class="img-sample position-relative">
                    <img :src="detailReport.attachments && detailReport.attachments[i - 1] && detailReport.attachments[i - 1].filePath
                      ? detailReport.attachments[i - 1].filePath
                      : sampleImages[i - 1]" alt="Ảnh mẫu" class="img-fluid shadow-sm" />
                    <div class="img-upload-date text-muted small text-center mt-2">
                      <i class="fas fa-clock me-1"></i>
                      {{
                        detailReport.attachments && detailReport.attachments[i - 1] && detailReport.attachments[i -
                          1].filePath
                          ? (detailReport.attachments[i - 1].uploadDate ? formatDate(detailReport.attachments[i -
                            1].uploadDate) : 'Chưa cập nhật')
                          : 'Chưa cập nhật'
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Nút thao tác -->
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button class="btn btn-outline-danger" @click="handleReject(detailReport)">
                <i class="fas fa-times-circle me-1"></i> Từ chối
              </button>
              <button class="btn btn-primary" @click="handleApprove(detailReport)">
                <i class="fas fa-check-circle me-1"></i> Duyệt
              </button>
            </div>
          </div>
        </template>
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
</style>
