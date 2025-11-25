<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useUser } from '../../composables/useUser'
import { useAuth } from '../../composables/useAuth'
import { usePermissions } from '../../composables/usePermissions'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import LeaveForm from '@/components/common/leave/LeaveForm.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ApprovalNoteModal from '@/components/common/ApprovalNoteModal.vue'
import ApprovalHistoryModal from '@/components/common/ApprovalHistoryModal.vue'
import TourGuide from '@/components/common/TourGuide.vue'
import AIChatbotButton from '@/components/common/AIChatbotButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

// Composables
const {
  leaveRequests,
  loading,
  fetchLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  submitLeaveRequestForApproval,
  approveLeaveRequest,
  rejectLeaveRequest,
  returnLeaveRequest
} = useLeaveRequest()

const { fetchUsers } = useUser()

// Auth composable for role checking
const { currentUser, refreshUserInfo } = useAuth()

// Permissions composable for centralized permission management
const { 
  canView, 
  canCreate, 
  canEditItem, 
  canDeleteItem, 
  canSubmitItem,
  canApproveItem,
  filterDataByPermission 
} = usePermissions()

// Leave types will be loaded from API in LeaveForm component

// Table columns
const leaveColumns = [
  { key: 'voucherCode', label: 'Số phiếu' },
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'userName', label: 'Tên nhân viên' },
  { key: 'leaveTypeName', label: 'Loại nghỉ phép' },
  { key: 'workShiftName', label: 'Ca làm việc' },
  { key: 'startDateTime', label: 'Ngày bắt đầu' },
  { key: 'endDateTime', label: 'Ngày kết thúc' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' }
]

// Form states
const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const showDeleteDialog = ref(false)
const selectedItem = ref(null)
const showFilter = ref(false)
const showImportModal = ref(false)
const showTourGuide = ref(false)

// Approval modal states
const showApprovalModal = ref(false)
const pendingAction = ref('') // 'approve', 'reject', 'return', 'submit'
const pendingVoucherCode = ref('')

// Approval history modal states
const showHistoryModal = ref(false)
const historyRequestType = ref('')
const historyRequestId = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(8)

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const leaveTypeFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  leaveTypeFilter.value = ''
  dateRange.value = { start: null, end: null }
  currentPage.value = 1
}

// Computed
const filteredLeaveRequests = computed(() => {
  if (!leaveRequests.value?.length) return []
  let result = filterDataByPermission('leave', leaveRequests.value)

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(request =>
      request.voucherCode?.toLowerCase().includes(query) ||
      request.employeeID?.toString().includes(query) ||
      request.userName?.toLowerCase().includes(query) ||
      request.leaveTypeName?.toLowerCase().includes(query) ||
      request.reason?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    const statusMap = {
      'Tạo mới': 0,
      'Chờ duyệt': 1,
      'Đã duyệt': 2,
      'Từ chối': 3
    }
    const statusValue = statusMap[statusFilter.value]
    if (statusValue !== undefined) {
      result = result.filter(request => request.approveStatus === statusValue)
    }
  }

  // Apply leave type filter
  if (leaveTypeFilter.value) {
    result = result.filter(request => request.leaveTypeID?.toString() === leaveTypeFilter.value)
  }

  // Apply date range filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(request => {
      const requestDate = new Date(request.startDateTime)
      return requestDate >= start && requestDate <= end
    })
  }

  return result
})

const paginatedLeaveData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredLeaveRequests.value.slice(start, start + itemsPerPage.value)
})

// Methods
const handleCreate = async (formData) => {
  try {
    await createLeaveRequest(formData)
    showCreateForm.value = false
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleUpdate = async (formData) => {
  try {
    await updateLeaveRequest(formData.voucherCode, formData)
    showUpdateForm.value = false
    selectedItem.value = null
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleSubmitForApproval = (voucherCode) => {
  pendingVoucherCode.value = voucherCode
  pendingAction.value = 'submit'
  showApprovalModal.value = true
}

const openApprovalModal = (voucherCode, action) => {
  pendingVoucherCode.value = voucherCode
  pendingAction.value = action
  showApprovalModal.value = true
}

const handleApprovalConfirm = async (notes) => {
  try {
    const voucherCode = pendingVoucherCode.value
    const action = pendingAction.value
    
    switch (action) {
      case 'submit':
        await submitLeaveRequestForApproval(voucherCode, notes)
        showUpdateForm.value = false
        selectedItem.value = null
        break
      case 'approve':
        await approveLeaveRequest(voucherCode, notes)
        break
      case 'reject':
        await rejectLeaveRequest(voucherCode, notes)
        break
      case 'return':
        await returnLeaveRequest(voucherCode, notes)
        break
    }
    
    showApprovalModal.value = false
    pendingVoucherCode.value = ''
    pendingAction.value = ''
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleApprovalCancel = () => {
  showApprovalModal.value = false
  pendingVoucherCode.value = ''
  pendingAction.value = ''
}

const getApprovalModalTitle = () => {
  const titles = {
    submit: 'Gửi duyệt đơn nghỉ phép',
    approve: 'Duyệt đơn nghỉ phép',
    reject: 'Từ chối đơn nghỉ phép',
    return: 'Trả lại đơn nghỉ phép'
  }
  return titles[pendingAction.value] || 'Nhập ghi chú'
}

const openHistoryModal = (item) => {
  historyRequestType.value = 'LeaveRequest'
  historyRequestId.value = item.voucherCode
  showHistoryModal.value = true
}

const handleUndoSuccess = async () => {
  await fetchLeaveRequests()
}

const handleDelete = async (voucherCode) => {
  try {
    await deleteLeaveRequest(voucherCode)
    showDeleteDialog.value = false
    selectedItem.value = null
  } catch (error) {
    // Error handling is done by composable
  }
}

const openUpdateForm = (voucherCode) => {
  selectedItem.value = leaveRequests.value.find(item => item.voucherCode === voucherCode)
  showUpdateForm.value = true
}

const openDeleteDialog = (voucherCode) => {
  selectedItem.value = leaveRequests.value.find(item => item.voucherCode === voucherCode)
  showDeleteDialog.value = true
}

// Tour Guide Steps
const tourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý đơn nghỉ phép. Tại đây bạn có thể xem, tạo, và quản lý các đơn nghỉ phép của nhân viên.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ với các chức năng chính. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form tạo đơn nghỉ phép mới. Bạn có thể chọn nhân viên, loại nghỉ phép, ca làm việc, ngày bắt đầu, ngày kết thúc và lý do nghỉ phép. Sau khi điền đầy đủ thông tin, bấm "Lưu" để tạo đơn.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc đơn nghỉ phép theo nhiều tiêu chí khác nhau như số phiếu, mã nhân viên, loại nghỉ phép, trạng thái và khoảng thời gian.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo số phiếu, mã nhân viên, tên. Chọn loại nghỉ phép và trạng thái từ dropdown. Chọn khoảng thời gian từ ngày đến ngày. Sau đó bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách đơn nghỉ phép ra file Excel để lưu trữ hoặc xử lý thêm. Khi bấm vào đây, file Excel sẽ được tải xuống tự động.'
  },
  {
    target: '[data-tour="import-modal"]',
    message: 'Đây là modal nhập Excel. Bạn có thể chọn file Excel từ máy tính, sau đó bấm "Nhập dữ liệu" để import các đơn nghỉ phép vào hệ thống.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(4)'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Hướng dẫn" (nút này) sẽ mở lại tour hướng dẫn để bạn xem lại các tính năng của trang này bất cứ lúc nào.'
  },
  {
    target: '[data-tour="actions"]',
    message: 'Cột "Thao tác" chứa các nút để bạn thực hiện các hành động như: Sửa đơn nghỉ phép, Xóa đơn, Gửi duyệt, Duyệt, Từ chối hoặc Trả lại đơn. Các nút sẽ hiển thị tùy theo quyền của bạn và trạng thái đơn.'
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều đơn nghỉ phép hơn. Bạn có thể thấy số lượng đơn nghỉ phép hiện tại và tổng số đơn nghỉ phép. Đó là tất cả những gì tôi muốn giới thiệu với bạn!'
  }
]

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Mở filter section nếu chưa mở để có thể highlight
  if (!showFilter.value) {
    showFilter.value = true
  }
  // Đợi một chút để UI render xong
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('vi-VN')
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
    { header: 'Loại nghỉ phép', key: 'leaveTypeName', width: 25 },
    { header: 'Ca làm việc', key: 'workShiftName', width: 20 },
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
    leaveTypeName: 'Nghỉ phép năm',
    workShiftName: 'Ca ngày',
    startDateTime: '2025-01-15 08:00:00',
    endDateTime: '2025-01-15 17:00:00',
    reason: 'Nghỉ phép cá nhân'
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
    { column: 'Loại nghỉ phép', description: 'Loại nghỉ phép được áp dụng.', required: 'Có', example: 'Nghỉ phép năm' },
    { column: 'Ca làm việc', description: 'Ca làm việc của nhân viên.', required: 'Không', example: 'Ca ngày' },
    { column: 'Ngày bắt đầu', description: 'Ngày và giờ bắt đầu nghỉ phép (định dạng: YYYY-MM-DD HH:mm:ss).', required: 'Có', example: '2025-01-15 08:00:00' },
    { column: 'Ngày kết thúc', description: 'Ngày và giờ kết thúc nghỉ phép (định dạng: YYYY-MM-DD HH:mm:ss).', required: 'Có', example: '2025-01-15 17:00:00' },
    { column: 'Lý do', description: 'Lý do nghỉ phép.', required: 'Có', example: 'Nghỉ phép cá nhân' },
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
  saveAs(new Blob([buf]), 'Mau_Nhap_Don_Nghi_Phep.xlsx')
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

      const leaveRequestsToCreate = jsonData.map(row => ({
        employeeID: row['Mã nhân viên'],
        leaveTypeName: row['Loại nghỉ phép'],
        workShiftName: row['Ca làm việc'],
        startDateTime: row['Ngày bắt đầu'],
        endDateTime: row['Ngày kết thúc'],
        reason: row['Lý do'],
      })).filter(request => request.employeeID && request.leaveTypeName && request.startDateTime && request.endDateTime && request.reason)

      if (leaveRequestsToCreate.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file.')
        return
      }

      await Promise.all(leaveRequestsToCreate.map(request => createLeaveRequest(request)))

      alert(`Đã nhập thành công ${leaveRequestsToCreate.length} đơn nghỉ phép.`)
      file.value = null
      showImportModal.value = false
    } catch (error) {
      alert('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.')
    }
  }
  reader.readAsArrayBuffer(file.value)
}

const applyHeaderStyle = (row) => {
  row.eachCell(cell => {
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
}

const applyDataStyle = (cell) => {
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  cell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
}

const autoFitColumns = (worksheet) => {
  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString() : ''
      maxLength = Math.max(maxLength, val.length)
    })
    column.width = maxLength + 2
  })
}

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('LeaveRequests')

  worksheet.columns = leaveColumns.map(c => ({ header: c.label, key: c.key, width: 15 }))

  filteredLeaveRequests.value.forEach(row => {
    worksheet.addRow({
      ...row,
      startDateTime: formatDateTime(row.startDateTime),
      endDateTime: formatDateTime(row.endDateTime)
    })
  })

  applyHeaderStyle(worksheet.getRow(1))

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber !== 1) {
      row.eachCell(applyDataStyle)
    }
  })

  autoFitColumns(worksheet)

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'LeaveRequests.xlsx')
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchLeaveRequests(),
    fetchUsers()
  ])
})

// Handle refresh content event from MainLayout
const handleRefreshContent = async () => {
  await Promise.all([
    fetchLeaveRequests(),
    fetchUsers()
  ])
}

// Expose function to parent component
defineExpose({
  handleRefreshContent
})
</script>

<template>
  <!-- Kiểm tra quyền xem trước khi hiển thị trang -->
  <div v-if="!canView('leave')" class="container-fluid py-4">
    <div class="alert alert-danger text-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Bạn không có quyền truy cập trang này.
    </div>
  </div>
  
  <div v-else class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0" data-tour="title">Danh sách đơn nghỉ phép</h2>
      <div class="d-flex gap-2" data-tour="toolbar">
        <ActionButton 
          v-if="canCreate('leave')" 
          type="primary" 
          icon="fas fa-plus me-2" 
          @click="showCreateForm = true"
        >
          Thêm
        </ActionButton>
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel">
          Xuất Excel
        </ActionButton>
        <ActionButton 
          v-if="canCreate('leave')" 
          type="info" 
          icon="fas fa-file-import me-2" 
          @click="showImportModal = true"
        >
          Nhập Excel
        </ActionButton>
      </div>
    </div>
    
    <!-- Filter Section -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter">
        <div class="row g-3">
          <div class="col-md-3">
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              placeholder="Tìm kiếm theo số phiếu, mã nhân viên, tên..."
            >
          </div>
          <div class="col-md-2">
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Tạo mới">Tạo mới</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Từ chối">Từ chối</option>
            </select>
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.start"
              placeholder="Từ ngày"
            >
          </div>
          <div class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.end"
              placeholder="Đến ngày"
            >
          </div>
          <div class="col-md-3">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Loading indicator -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>
    
    <!-- Data table -->
    <div v-else class="table-responsive adjustment-table" data-tour="table">
      <DataTable :columns="leaveColumns" :data="paginatedLeaveData">
        <template #actions="{ item }">
          <div class="d-flex justify-content-start gap-2" data-tour="actions">
            <!-- Edit button based on centralized permissions -->
            <ActionButton 
              v-if="canEditItem('leave', item)" 
              icon="fas fa-edit" 
              type="success" 
              @click.stop="openUpdateForm(item.voucherCode)" 
              title="Sửa"
            ></ActionButton>
            <!-- Delete button based on centralized permissions -->
            <ActionButton 
              v-if="canDeleteItem('leave', item)" 
              type="danger" 
              @click.stop="openDeleteDialog(item.voucherCode)" 
              icon="fas fa-trash" 
              title="Xóa"
            ></ActionButton>
            <!-- Submit for approval button -->
            <ActionButton 
              v-if="canSubmitItem('leave', item)" 
              type="primary" 
              @click.stop="handleSubmitForApproval(item.voucherCode)" 
              icon="fas fa-paper-plane" 
              title="Gửi duyệt"
            ></ActionButton>
            <!-- Approve button -->
            <ActionButton 
              v-if="canApproveItem('leave', item)" 
              type="success" 
              @click.stop="openApprovalModal(item.voucherCode, 'approve')" 
              icon="fas fa-check" 
              title="Duyệt"
            ></ActionButton>
            <!-- Reject button -->
            <ActionButton 
              v-if="canApproveItem('leave', item)" 
              type="danger" 
              @click.stop="openApprovalModal(item.voucherCode, 'reject')" 
              icon="fas fa-times" 
              title="Từ chối"
            ></ActionButton>
            <!-- Return button -->
            <ActionButton 
              v-if="canApproveItem('leave', item)" 
              type="warning" 
              @click.stop="openApprovalModal(item.voucherCode, 'return')" 
              icon="fas fa-undo" 
              title="Trả lại"
            ></ActionButton>
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
        <template #startDateTime="{ item }">
          {{ formatDateTime(item.startDateTime) }}
        </template>
        <template #endDateTime="{ item }">
          {{ formatDateTime(item.endDateTime) }}
        </template>
        <template #workShiftName="{ item }">
          {{ item.workShiftName || 'N/A' }}
        </template>
        <template #approveStatus="{ item }">
          <span
            @click.stop="openHistoryModal(item)"
            style="cursor: pointer; text-decoration: underline;"
            title="Xem lịch sử duyệt"
          >
            <ApprovalStatusLabel :status="item.approveStatus" />
          </span>
        </template>
      </DataTable>
    </div>
    
    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-3" data-tour="pagination">
      <div class="text-muted">
        Hiển thị {{ paginatedLeaveData.length }} trên {{ filteredLeaveRequests.length }} đơn nghỉ phép
      </div>
      <Pagination 
        :totalItems="filteredLeaveRequests.length" 
        :itemsPerPage="itemsPerPage" 
        :currentPage="currentPage"
        @update:currentPage="currentPage = $event" 
      />
    </div>
  </div>
  
  <!-- Create Form Modal -->
  <ModalDialog v-model:show="showCreateForm" title="Thêm đơn nghỉ phép" size="lg" data-tour="create-form">
    <LeaveForm 
      mode="create" 
      @submit="handleCreate" 
      @close="showCreateForm = false" 
    />
  </ModalDialog>
  
  <!-- Update Form Modal -->
  <ModalDialog v-model:show="showUpdateForm" title="Sửa đơn nghỉ phép" size="lg">
    <LeaveForm 
      mode="update" 
      :leave="selectedItem"
      @submit="handleUpdate" 
      @close="showUpdateForm = false"
      @submit-for-approval="handleSubmitForApproval"
    />
  </ModalDialog>
  
  <!-- Delete Confirmation Modal -->
  <ModalDialog v-model:show="showDeleteDialog" title="Xác nhận xóa" size="md">
    <div class="text-center">
      <p>Bạn có chắc chắn muốn xóa đơn nghỉ phép <strong>{{ selectedItem?.voucherCode }}</strong>?</p>
      <div class="d-flex justify-content-center gap-2 mt-3">
        <button class="btn btn-outline-secondary" @click="showDeleteDialog = false">
          Hủy
        </button>
        <button class="btn btn-danger" @click="handleDelete(selectedItem?.voucherCode)">
          Xóa
        </button>
      </div>
    </div>
  </ModalDialog>

  <!-- Approval Note Modal -->
  <ApprovalNoteModal
    :show="showApprovalModal"
    :title="getApprovalModalTitle()"
    :action="pendingAction"
    @confirm="handleApprovalConfirm"
    @cancel="handleApprovalCancel"
    @update:show="showApprovalModal = $event"
  />

  <!-- Approval History Modal -->
  <ApprovalHistoryModal
    :show="showHistoryModal"
    :requestType="historyRequestType"
    :requestId="historyRequestId"
    @update:show="showHistoryModal = $event"
    @undo-success="handleUndoSuccess"
  />

  <!-- Import Excel Modal -->
  <ModalDialog v-model:show="showImportModal" title="Nhập đơn nghỉ phép từ Excel" size="lg" data-tour="import-modal">
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

  <!-- Tour Guide -->
  <TourGuide
    :show="showTourGuide"
    :steps="tourSteps"
    @update:show="showTourGuide = $event"
    @complete="handleTourComplete"
    v-if="showTourGuide"
  />

  <!-- AI Chatbot Assistant Button -->
  <AIChatbotButton 
    @guide-click="startTour"
  />
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
  box-shadow: 0 2px 12px rgba(13, 110, 253, 0.07);
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

.table-action-btn {
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 1.15rem;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.table-action-btn.delete {
  color: #ff6b6b;
}

.table-action-btn:hover {
  background: #e9ecef;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-section .form-control {
  height: 42px;
  border-radius: 0.5rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.filter-section .form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}

.filter-section .btn-secondary {
  background-color: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
}

.filter-section .btn-secondary:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
  color: #495057;
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


</style>

