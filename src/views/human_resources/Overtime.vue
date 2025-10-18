<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import { useAuth } from '../../composables/useAuth'
import ModalDialog from '@/components/common/ModalDialog.vue'
import OvertimeForm from '@/components/common/overtime/OvertimeForm.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const {
  overtimeRequests,
  loading,
  fetchOvertimeRequests,
  createOvertimeRequest,
  updateOvertimeRequest,
  deleteOvertimeRequest
} = useOvertimeRequest()

// Auth composable for role checking
const { currentUser, canViewAll, canEdit, refreshUserInfo } = useAuth()

onMounted(async () => {
  await fetchOvertimeRequests()
})

const overtimeColumns = [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'userName', label: 'Tên nhân viên' },
  { key: 'overtimeTypeName', label: 'Loại tăng ca' },
  { key: 'overtimeFormName', label: 'Hình thức tăng ca' },
  { key: 'coefficient', label: 'Hệ số' },
  { key: 'startDateTime', label: 'Ngày bắt đầu' },
  { key: 'endDateTime', label: 'Ngày kết thúc' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' }
]

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedItem = ref(null)
const showFilter = ref(false)
const showImportModal = ref(false)

const handleCreate = async (formData) => {
  try {
    await createOvertimeRequest(formData)
    showCreateForm.value = false
  } catch (error) {
    console.error('Error creating overtime request:', error)
  }
}

const handleUpdate = async (formData) => {
  try {
    await updateOvertimeRequest(formData.voucherCode, formData)
    showUpdateForm.value = false
  } catch (error) {
    console.error('Error updating overtime request:', error)
  }
}

const handleSubmitForApproval = async (voucherCode) => {
  try {
    // Update status to "Chờ duyệt" (status = 1)
    await updateOvertimeRequest(voucherCode, { approveStatus: 1 })
    showUpdateForm.value = false
    selectedItem.value = null
  } catch (error) {
    console.error('Error submitting for approval:', error)
  }
}

const handleDelete = async (voucherCode) => {
  if (confirm('Bạn có chắc chắn muốn xóa đơn tăng ca này?')) {
    try {
      await deleteOvertimeRequest(voucherCode)
    } catch (error) {
      console.error('Error deleting overtime request:', error)
    }
  }
}

const openUpdateForm = (voucherCode) => {
  selectedItem.value = overtimeRequests.value.find(item => item.voucherCode === voucherCode)
  showUpdateForm.value = true
}

const getStatusText = (status) => {
  const statusMap = {
    0: 'Tạo mới',
    1: 'Chờ duyệt', 
    2: 'Đã duyệt',
    3: 'Từ chối'
  }
  return statusMap[status] || 'Không xác định'
}

const currentPage = ref(1)
const itemsPerPage = ref(8)

// Filter overtime requests based on user role
const filteredOvertimeRequests = computed(() => {
  console.log('=== OVERTIME FILTER DEBUG ===')
  console.log('Current user:', currentUser.value)
  console.log('Can view all:', canViewAll.value)
  console.log('Can edit:', canEdit.value)
  console.log('Overtime requests count:', overtimeRequests.value?.length || 0)
  
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) return []
  
  if (canViewAll.value) {
    // HR staff and Director can see all overtime requests
    console.log('User can view all - returning all requests')
    return overtimeRequests.value
  } else {
    // Regular employees can only see their own overtime requests
    console.log('User can only view own - filtering by employeeID:', currentUser.value?.id)
    const filtered = overtimeRequests.value.filter(request => 
      request.employeeID === currentUser.value?.id
    )
    console.log('Filtered requests count:', filtered.length)
    return filtered
  }
})

const paginatedOvertimeData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredOvertimeRequests.value.slice(start, start + itemsPerPage.value)
})

// Excel import functions
const file = ref(null)

const handleFileUpload = (event) => {
  const target = event.target
  if (target && target.files) {
    file.value = target.files[0]
  }
}

const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook()

  // --- Sheet 1: Dữ liệu ---
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')
  const headers = [
    { header: 'Mã nhân viên', key: 'employeeID', width: 20 },
    { header: 'Loại tăng ca', key: 'overtimeTypeName', width: 25 },
    { header: 'Hình thức tăng ca', key: 'overtimeFormName', width: 25 },
    { header: 'Hệ số', key: 'coefficient', width: 15 },
    { header: 'Ngày bắt đầu', key: 'startDateTime', width: 20 },
    { header: 'Ngày kết thúc', key: 'endDateTime', width: 20 },
    { header: 'Lý do', key: 'reason', width: 30 },
  ]
  dataSheet.columns = headers

  // Style header
  dataSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Add example row
  dataSheet.addRow({
    employeeID: 'EMP001',
    overtimeTypeName: 'Tăng ca ngày',
    overtimeFormName: 'Tăng ca thường',
    coefficient: '1.5',
    startDateTime: '2025-01-15 18:00:00',
    endDateTime: '2025-01-15 22:00:00',
    reason: 'Hoàn thành dự án'
  })

  // --- Sheet 2: Hướng dẫn ---
  const instructionSheet = workbook.addWorksheet('Hướng dẫn')
  instructionSheet.columns = [
    { header: 'Tên cột', key: 'column', width: 30 },
    { header: 'Mô tả', key: 'description', width: 50 },
    { header: 'Bắt buộc', key: 'required', width: 15 },
    { header: 'Ví dụ', key: 'example', width: 30 },
  ]

  // Style header for instruction sheet
  instructionSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
  })

  // Add instruction data
  instructionSheet.addRows([
    { column: 'Mã nhân viên', description: 'Mã định danh của nhân viên trong hệ thống.', required: 'Có', example: 'EMP001' },
    { column: 'Loại tăng ca', description: 'Loại tăng ca được áp dụng.', required: 'Có', example: 'Tăng ca ngày' },
    { column: 'Hình thức tăng ca', description: 'Hình thức tăng ca.', required: 'Có', example: 'Tăng ca thường' },
    { column: 'Hệ số', description: 'Hệ số tính lương tăng ca.', required: 'Có', example: '1.5' },
    { column: 'Ngày bắt đầu', description: 'Ngày và giờ bắt đầu tăng ca (định dạng: YYYY-MM-DD HH:mm:ss).', required: 'Có', example: '2025-01-15 18:00:00' },
    { column: 'Ngày kết thúc', description: 'Ngày và giờ kết thúc tăng ca (định dạng: YYYY-MM-DD HH:mm:ss).', required: 'Có', example: '2025-01-15 22:00:00' },
    { column: 'Lý do', description: 'Lý do tăng ca.', required: 'Có', example: 'Hoàn thành dự án' },
  ])

  // Auto-fit columns for instruction sheet
  instructionSheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, val.length)
    })
    column.width = Math.max(column.width, maxLength + 2)
  })

  // Generate and download file
  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Don_Tang_Ca.xlsx')
}

const processImport = () => {
  if (!file.value) {
    alert('Vui lòng chọn một file Excel.')
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        alert('File Excel không có dữ liệu.')
        return
      }

      const overtimeRequestsToCreate = jsonData.map(row => ({
        employeeID: row['Mã nhân viên'],
        overtimeTypeName: row['Loại tăng ca'],
        overtimeFormName: row['Hình thức tăng ca'],
        coefficient: row['Hệ số'],
        startDateTime: row['Ngày bắt đầu'],
        endDateTime: row['Ngày kết thúc'],
        reason: row['Lý do'],
      })).filter(request => request.employeeID && request.overtimeTypeName && request.overtimeFormName && request.coefficient && request.startDateTime && request.endDateTime && request.reason)

      if (overtimeRequestsToCreate.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file.')
        return
      }

      // Create overtime requests
      for (const request of overtimeRequestsToCreate) {
        await createOvertimeRequest(request)
      }

      alert(`Đã nhập thành công ${overtimeRequestsToCreate.length} đơn tăng ca.`)
      file.value = null
      showImportModal.value = false
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error)
      alert('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.')
    }
  }
  reader.readAsArrayBuffer(file.value)
}

// Excel export function
const exportToExcel = async (type) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('OvertimeRequests')

  // Thêm header
  worksheet.columns = overtimeColumns.map(c => ({ header: c.label, key: c.key, width: 15 }))

  // Thêm dữ liệu
  filteredOvertimeRequests.value.forEach((row, index) => {
    worksheet.addRow({
      ...row,
      startDateTime: new Date(row.startDateTime).toLocaleString('vi-VN'),
      endDateTime: new Date(row.endDateTime).toLocaleString('vi-VN')
    })
  })

  // Style header
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })

  // Style dữ liệu
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell(cell => {
      if (rowNumber !== 1) { // skip header
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    })
  })

  // Auto-fit chiều ngang cho từng cột
  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, val.length)
    })
    column.width = maxLength + 2 // padding để text không sát
  })

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'OvertimeRequests.xlsx')
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="adjustment-title mb-0">Danh sách đơn tăng ca</h4>
      <div class="d-flex gap-2">
        <ActionButton 
          v-if="canEdit || !canViewAll" 
          type="primary" 
          icon="fas fa-plus me-2" 
          @click="showCreateForm = true"
        >
          Thêm
        </ActionButton>
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel('overtime')">
          Xuất Excel
        </ActionButton>
        <ActionButton 
          v-if="canEdit || !canViewAll" 
          type="info" 
          icon="fas fa-file-import me-2" 
          @click="showImportModal = true"
        >
          Nhập Excel
        </ActionButton>
        <ActionButton 
          type="secondary" 
          icon="fas fa-sync me-2" 
          @click="refreshUserInfo"
          title="Làm mới thông tin người dùng"
        >
          Refresh
        </ActionButton>
      </div>
    </div>
    <div class="table-responsive adjustment-table">
      <DataTable :columns="overtimeColumns" :data="paginatedOvertimeData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2">
            <!-- Always show edit button for own requests or if can edit -->
            <ActionButton 
              v-if="canEdit || item.employeeID === currentUser?.id"
              type="success" 
              icon="fas fa-edit" 
              title="Sửa" 
              @click="openUpdateForm(item.voucherCode)" 
            />
            <!-- Always show delete button for own requests or if can edit -->
            <ActionButton 
              v-if="canEdit || item.employeeID === currentUser?.id"
              type="danger" 
              icon="fas fa-trash" 
              title="Xóa" 
              @click="handleDelete(item.voucherCode)" 
            />
            <!-- Always show status -->
            <span class="badge" :class="{
              'bg-secondary': item.approveStatus == 0 || item.approveStatus === '0',
              'bg-warning': item.approveStatus == 1 || item.approveStatus === '1',
              'bg-success': item.approveStatus == 2 || item.approveStatus === '2',
              'bg-danger': item.approveStatus == 3 || item.approveStatus === '3'
            }">
              {{ getStatusText(item.approveStatus) }}
            </span>
          </div>
        </template>
        <template #approveStatus="{ item }">
          <ApprovalStatusLabel :status="item.approveStatus" />
        </template>
        <template #startDateTime="{ item }">
          {{ new Date(item.startDateTime).toLocaleString('vi-VN') }}
        </template>
        <template #endDateTime="{ item }">
          {{ new Date(item.endDateTime).toLocaleString('vi-VN') }}
        </template>
      </DataTable>
    </div>
    <Pagination
    :totalItems="filteredOvertimeRequests.length"
    :itemsPerPage="itemsPerPage"
    :currentPage="currentPage"
    @update:currentPage="currentPage = $event"
    />
  </div>
  <ModalDialog v-model:show="showCreateForm" title="Thêm đơn tăng ca" size="lg">
    <OvertimeForm mode="create" @submit="handleCreate" @close="showCreateForm = false" />
  </ModalDialog>
  <ModalDialog v-model:show="showUpdateForm" title="Sửa đơn tăng ca" size="lg">
    <OvertimeForm 
      mode="update" 
      :overtime="selectedItem" 
      @submit="handleUpdate" 
      @close="showUpdateForm = false"
      @submit-for-approval="handleSubmitForApproval"
    />
  </ModalDialog>

  <!-- Import Excel Modal -->
  <ModalDialog v-model:show="showImportModal" title="Nhập đơn tăng ca từ Excel" size="lg">
    <div class="p-4">
      <p>Vui lòng tải file mẫu và điền thông tin theo đúng định dạng được cung cấp trong sheet "Hướng dẫn".</p>
      <ActionButton type="secondary" icon="fas fa-download me-2" @click="downloadExcelTemplate">
        Tải file mẫu
      </ActionButton>

      <hr class="my-4">

      <h5>Tải lên file đã điền</h5>
      <div class="input-group">
        <input type="file" class="form-control" @change="handleFileUpload" accept=".xlsx, .xls">
        <button class="btn btn-primary" @click="processImport" :disabled="!file">
          <i class="fas fa-upload me-2"></i>
          Xử lý
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.adjustment-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d6efd;
  letter-spacing: 0.5px;
}
.adjustment-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(13,110,253,0.07);
  padding: 0;
  margin-bottom: 0;
}
.table th {
  background-color: #f5f7fa;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  min-width: 100px;
  font-size: 1rem;
  font-weight: 600;
  color: #0d6efd;
}
.table td,
.table th {
  padding: 0.75rem;
  vertical-align: middle;
}
.table tr {
  transition: background 0.18s;
}
.table tr:hover {
  background: #f0f6ff;
}
</style>

