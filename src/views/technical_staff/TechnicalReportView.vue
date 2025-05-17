<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTechnicalReport } from '../../composables/useTechnicalReport'
import DataTable from '../../components/common/DataTable.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import StatusBadge from '../../components/common/StatusBadge.vue'
import UpdateReportForm from '../../components/technical-report/UpdateReportForm.vue'
import AdvancedFilter from '../../components/common/AdvancedFilter.vue'
import FormDialog from '../../components/common/FormDialog.vue'
import ReportForm from '../../components/common/ReportForm.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useManagementReport } from '../../composables/useManagementReport'

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)

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
  fetchReportsByKiThuat,
  createReport,
  updateReport,
  updateReportStatus
} = useManagementReport()

onMounted(() => {
  fetchReportsByKiThuat()
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

const showDetailModal = ref(false)
const detailReport = ref(null)

const handleRowClick = (item) => {
  detailReport.value = item
  showDetailModal.value = true
}

const sampleImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1523413363574-c30aa1c2a516?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80"
]
</script>

<template>
  <div class="technical-report">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Báo Cáo Vấn Đề Kỹ Thuật</h2>
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

    <DataTable @row-click="handleRowClick" v-else :columns="columns" :data="paginatedReports" class="report-table">
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

      <template #status="{ item }">
        <StatusBadge :status="getStatusLabel(item.statusLogs[0].status)" />
      </template>

      <template #reportDate="{ item }">
        {{ formatDate(item.reportDate) }}
      </template>

      <template #actions="{ item }">
        <ActionButton type="primary" icon="fas fa-edit" tooltip="Cập nhật trạng thái"
          @click="handleUpdateStatus(item)" />
      </template>
    </DataTable>

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

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedReports.length }} trên {{ filteredReports.length }} báo cáo
      </div>
      <Pagination :total-items="filteredReports.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Form tạo báo cáo mới -->
    <FormDialog v-model:show="showCreateForm" title="Tạo Báo Cáo Mới">
      <ReportForm mode="create" reportType="technical" @submit="handleSubmit" @cancel="showCreateForm = false" />
    </FormDialog>

    <!-- Form cập nhật báo cáo -->
    <FormDialog v-model:show="showUpdateForm" title="Cập Nhật Báo Cáo">
      <ReportForm mode="update" reportType="technical" :report="selectedReport" @submit="handleUpdateSubmit"
        @cancel="showUpdateForm = false" />
    </FormDialog>
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
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
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
</style>
