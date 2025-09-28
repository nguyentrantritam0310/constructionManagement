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
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import ReportDetailDialog from '../../components/common/ReportDetailDialog.vue'
import TechnicalReportForm from '../../components/technical-report/TechnicalReportForm.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'

const { showMessage } = useGlobalMessage()

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedReport = ref(null)
const reportFormData = ref({})
const showImportModal = ref(false)
const file = ref(null)

const searchQuery = ref('')
const statusFilter = ref('')
const levelFilter = ref('')
const problemTypeFilter = ref('')
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
      report.content?.toLowerCase().includes(query) ||
      report.problemType?.toLowerCase().includes(query)
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

  // Apply problem type filter
  if (problemTypeFilter.value) {
    result = result.filter(report => report.problemType === problemTypeFilter.value)
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
// Filter section visibility
const showFilter = ref(false)
const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  levelFilter.value = ''
  problemTypeFilter.value = ''
  dateRange.value = { start: '', end: '' }
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
  createMultipleReports,
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

const handleSubmit = async (formData) => {
  try {
    await createReport(formData)
    showCreateForm.value = false
    showMessage('Báo cáo đã được tạo thành công', 'success')
    await fetchReportsByKiThuat() // Refresh the list
  } catch (err) {
    console.error('Error creating report:', err)
    showMessage('Có lỗi xảy ra khi tạo báo cáo', 'error')
  }
}

const handleUpdateStatus = async (report) => {
  selectedReport.value = report
  showUpdateForm.value = true
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
    await fetchReportsByKiThuat()
  } catch (err) {
    console.error('Error updating report:', err)
    showMessage(err.message || 'Có lỗi xảy ra khi cập nhật báo cáo', 'error')
  }
}

const exportToExcel = async () => {
  if (filteredReports.value.length === 0) {
    showMessage('Không có dữ liệu để xuất.', 'info')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('TechnicalReports')

  worksheet.columns = [
    { header: 'Mã báo cáo', key: 'id', width: 15 },
    { header: 'Công trình', key: 'constructionName', width: 30 },
    { header: 'Mô tả', key: 'content', width: 50 },
    { header: 'Mức độ', key: 'level', width: 15 },
    { header: 'Trạng thái', key: 'status', width: 20 },
    { header: 'Ngày tạo', key: 'reportDate', width: 20 }
  ]

  filteredReports.value.forEach(report => {
    worksheet.addRow({
      ...report,
      status: getStatusLabel(report.statusLogs[0].status),
      reportDate: formatDate(report.reportDate)
    })
  })

  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
  })

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Bao_cao_ky_thuat.xlsx')
}

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook()
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')

  dataSheet.columns = [
    { header: 'ID Công trình', key: 'constructionID', width: 20 },
    { header: 'Mô tả', key: 'content', width: 50 },
    { header: 'Mức độ', key: 'level', width: 20 }
  ]
  dataSheet.getRow(1).eachCell(cell => { cell.font = { bold: true } })

  const instructionSheet = workbook.addWorksheet('Hướng dẫn')
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 30 },
    { header: 'Mô tả', key: 'description', width: 60 },
    { header: 'Bắt buộc', key: 'required', width: 15 },
    { header: 'Ví dụ', key: 'example', width: 30 }
  ]
  instructionSheet.getRow(1).eachCell(cell => { cell.font = { bold: true } })
  instructionSheet.addRows([
    { column: 'ID Công trình', description: 'ID của công trình liên quan.', required: 'Có', example: '12' },
    { column: 'Mô tả', description: 'Mô tả chi tiết về vấn đề kỹ thuật.', required: 'Có', example: 'Phát hiện vết nứt trên dầm chính' },
    { column: 'Mức độ', description: 'Mức độ nghiêm trọng của vấn đề. Chấp nhận các giá trị: Thấp, Trung bình, Cao, Nghiêm trọng.', required: 'Có', example: 'Cao' }
  ])

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Bao_Cao_Ky_Thuat.xlsx')
}

const handleFileUpload = (event) => {
  const target = event.target
  if (target && target.files) {
    file.value = target.files[0]
  }
}

const processImport = () => {
  if (!file.value) {
    showMessage('Vui lòng chọn một file Excel.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        showMessage('File Excel không có dữ liệu.', 'error');
        return;
      }

      const reportsToCreate = jsonData.map(row => ({
        constructionID: Number(row['ID Công trình']),
        content: row['Mô tả'],
        level: row['Mức độ'],
        reportType: 'Sự cố kĩ thuật', // Hardcoded for this view
      })).filter(r => r.constructionID && r.content && r.level);

      if (reportsToCreate.length === 0) {
        showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error');
        return;
      }

      await createMultipleReports(reportsToCreate);
      await fetchReportsByKiThuat();
      file.value = null;
      showImportModal.value = false;
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error);
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error');
    }
  };
  reader.readAsArrayBuffer(file.value);
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
    await fetchReportsByKiThuat()
  } catch (err) {
    showMessage(err.message || 'Có lỗi xảy ra khi gửi lại báo cáo', 'error')
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

const showDetailModal = ref(false)
const detailReport = ref(null)

const handleRowClick = (item) => {
  detailReport.value = item
  showDetailModal.value = true
}

const handleReject = async (report) => {
  try {
    await updateReportStatus(report.id, 'Rejected')
    showMessage('Đã từ chối báo cáo', 'success')
    await fetchReportsByKiThuat()
  } catch (err) {
    console.error('Error rejecting report:', err)
    showMessage('Không thể từ chối báo cáo', 'error')
  }
}

const handleApprove = async (report) => {
  try {
    await updateReportStatus(report.id, 'Approved')
    showMessage('Đã duyệt báo cáo', 'success')
    await fetchReportsByKiThuat()
  } catch (err) {
    console.error('Error approving report:', err)
    showMessage('Không thể duyệt báo cáo', 'error')
  }
}

const handleResubmit = async (report) => {
  try {
    await updateReportStatus(report.id, 0, 'Báo cáo đã được gửi lại')
    showMessage('Đã gửi lại báo cáo thành công', 'success')
    await fetchReportsByKiThuat()
  } catch (err) {
    console.error('Error resubmitting report:', err)
    showMessage('Không thể gửi lại báo cáo', 'error')
  }
}

const handleEdit = (report) => {
  selectedReport.value = report
  reportFormData.value = { ...report }
  showUpdateForm.value = true
  showDetailModal.value = false
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
  <div class="technical-report container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Báo Cáo Vấn Đề Kỹ Thuật</h1>
      <div class="d-flex gap-2">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="showCreateForm = true">
         Thêm
      </ActionButton>
      <!-- Icon bộ lọc -->
      <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
        Lọc
      </ActionButton>
      <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel">
        Xuất Excel
      </ActionButton>
      <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
        Nhập Excel
      </ActionButton>
      </div>
    </div>
    <!-- Filter Section -->
    <!-- Phần filter ẩn/hiện có transition -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter">
        <div class="row g-3">
          <div class="col-md-3">
            <input type="text" class="form-control" v-model="searchQuery" placeholder="Tìm kiếm...">
          </div>
          <div class="col-md-2">
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
              <option value="Completed">Hoàn thành</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-control" v-model="levelFilter">
              <option value="">Tất cả mức độ</option>
              <option value="Thấp">Thấp</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Cao">Cao</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
            </select>
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" v-model="dateRange.start" placeholder="Từ ngày">
          </div>
          <div class="col-md-2">
            <input type="date" class="form-control" v-model="dateRange.end" placeholder="Đến ngày">
          </div>
          <div class="col-md-1">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>
            </button>
          </div>
        </div>
      </div>
    </transition>

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

      <template #statusLogs[0].status="{ item }">
        <StatusBadge :status="getStatusLabel(item.statusLogs[0].status)" />
      </template>

      <template #reportDate="{ item }">
        {{ formatDate(item.reportDate) }}
      </template>

      <template #actions="{ item }">
        <UpdateButton @click="handleUpdateStatus(item)" />
        <ChangeStatusButton @click.stop="openStatusDialog(item)" />

      </template>

    </DataTable>

    <ReportDetailDialog v-if="detailReport" v-model:show="showDetailModal" :report="detailReport" :can-edit="true"
      @reject="handleReject" @approve="handleApprove" @resubmit="handleResubmit" @edit="handleEdit" />

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedReports.length }} trên {{ filteredReports.length }} báo cáo
      </div>
      <Pagination :total-items="filteredReports.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>

    <!-- Form tạo báo cáo mới -->
    <FormDialog v-model:show="showCreateForm" title="Tạo Báo Cáo Mới" submitText="Tạo báo cáo"
      :formData="reportFormData" @submit="handleSubmit">
      <ReportForm mode="create" reportType="technical" v-model="reportFormData" />
    </FormDialog>

    <!-- Form cập nhật báo cáo -->
    <FormDialog v-model:show="showUpdateForm" title="Cập Nhật Báo Cáo" submitText="Cập nhật" :formData="reportFormData"
      :resubmitMode="isResubmitMode" @submit="handleUpdateSubmit" @resubmit="handleResubmitSubmit">
      <ReportForm mode="update" reportType="technical" :report="selectedReport" v-model="reportFormData" />
    </FormDialog>

    <!-- Import Excel Modal -->
    <ModalDialog v-model:show="showImportModal" title="Nhập báo cáo kỹ thuật từ Excel" size="lg">
      <div class="p-4">
        <p>Vui lòng tải file mẫu và điền thông tin theo đúng định dạng được cung cấp trong sheet "Hướng dẫn".</p>
        <ActionButton type="secondary" icon="fas fa-download me-2" @click="downloadExcelTemplate">
          Tải file mẫu
        </ActionButton>
        <div class="mt-4">
          <input type="file" accept=".xlsx, .xls" @change="handleFileUpload" />
        </div>
        <div class="mt-4">
          <button class="btn btn-primary" :disabled="!file" @click="processImport">
            Xử lý nhập
          </button>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style scoped>
.technical-report {
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

/* .btn {
  height: 42px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
} */

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

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
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
