<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useUser } from '../../composables/useUser'
import { useAuth } from '../../composables/useAuth'
import { usePermissions } from '../../composables/usePermissions'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useLeaveType } from '../../composables/useLeaveType'
import { useWorkShift } from '../../composables/useWorkShift'
import ActionButton from '@/components/common/ActionButton.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import LeaveForm from '@/components/common/leave/LeaveForm.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ApprovalNoteModal from '@/components/common/ApprovalNoteModal.vue'
import ApprovalHistoryModal from '@/components/common/ApprovalHistoryModal.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

// Composables
const {
  leaveRequests,
  loading,
  fetchLeaveRequests,
  createLeaveRequest,
  createMultipleLeaveRequests,
  updateLeaveRequest,
  deleteLeaveRequest,
  submitLeaveRequestForApproval,
  approveLeaveRequest,
  rejectLeaveRequest,
  returnLeaveRequest
} = useLeaveRequest()

const { fetchUsers } = useUser()
const { showMessage } = useGlobalMessage()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { workshifts, fetchWorkShifts } = useWorkShift()

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
  filterDataByPermission,
  hasPermission
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
const showDetailForm = ref(false)
const showDeleteDialog = ref(false)
const selectedItem = ref(null)
const showFilter = ref(false)
const showImportModal = ref(false)

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
      result = result.filter(request => {
        // Handle both number and string approveStatus
        const requestStatus = request.approveStatus
        if (typeof requestStatus === 'number') {
          return requestStatus === statusValue
        }
        if (typeof requestStatus === 'string') {
          // Map string values to numbers for comparison
          const stringStatusMap = {
            'Tạo mới': 0,
            'Chờ duyệt': 1,
            'Đã duyệt': 2,
            'Từ chối': 3,
            'Created': 0,
            'Pending': 1,
            'Approved': 2,
            'Rejected': 3
          }
          return stringStatusMap[requestStatus] === statusValue
        }
        return false
      })
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

const openDetailForm = (item) => {
  selectedItem.value = item
  showDetailForm.value = true
}

const openDeleteDialog = (voucherCode) => {
  selectedItem.value = leaveRequests.value.find(item => item.voucherCode === voucherCode)
  showDeleteDialog.value = true
}


const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`
  }
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
  // Fetch data if not already loaded
  if (!leaveTypes.value || leaveTypes.value.length === 0) {
    await fetchLeaveTypes()
  }
  if (!workshifts.value || workshifts.value.length === 0) {
    await fetchWorkShifts()
  }

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
    leaveTypeName: leaveTypes.value.length > 0 ? leaveTypes.value[0].leaveTypeName : 'Nghỉ phép năm',
    workShiftName: workshifts.value.length > 0 ? workshifts.value[0].shiftName : 'Ca ngày',
    startDateTime: '2025-01-15 08:00:00',
    endDateTime: '2025-01-15 17:00:00',
    reason: 'Nghỉ phép cá nhân'
  })

  // --- Sheet 2: Danh sách loại nghỉ phép ---
  if (leaveTypes.value && leaveTypes.value.length > 0) {
    const leaveTypeSheet = workbook.addWorksheet('Danh sách loại nghỉ phép')
    leaveTypeSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tên loại nghỉ phép', key: 'leaveTypeName', width: 30 },
    ]
    
    leaveTypeSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    leaveTypes.value.forEach(lt => {
      leaveTypeSheet.addRow({
        id: lt.id,
        leaveTypeName: lt.leaveTypeName
      })
    })
  }

  // --- Sheet 3: Danh sách ca làm việc ---
  if (workshifts.value && workshifts.value.length > 0) {
    const workShiftSheet = workbook.addWorksheet('Danh sách ca làm việc')
    workShiftSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tên ca làm việc', key: 'shiftName', width: 30 },
    ]
    
    workShiftSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    workshifts.value.forEach(ws => {
      workShiftSheet.addRow({
        id: ws.id,
        shiftName: ws.shiftName
      })
    })
  }

  // --- Sheet 4: Hướng dẫn ---
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
    { column: 'Loại nghỉ phép', description: 'Tên loại nghỉ phép (xem sheet "Danh sách loại nghỉ phép").', required: 'Có', example: 'Nghỉ phép năm' },
    { column: 'Ca làm việc', description: 'Tên ca làm việc (xem sheet "Danh sách ca làm việc"). Có thể để trống.', required: 'Không', example: 'Ca ngày' },
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

const processImport = async () => {
  if (!file.value) {
    showMessage('Vui lòng chọn một file Excel.', 'warning')
    return
  }

  // Fetch data if not already loaded
  if (!leaveTypes.value || leaveTypes.value.length === 0) {
    await fetchLeaveTypes()
  }
  if (!workshifts.value || workshifts.value.length === 0) {
    await fetchWorkShifts()
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
        showMessage('File Excel không có dữ liệu.', 'error')
        return
      }

      // Validation errors
      const validationErrors = []
      const leaveRequestsToCreate = []

      jsonData.forEach((row, index) => {
        const rowNum = index + 2 // +2 because Excel rows start at 1 and we skip header
        const employeeID = row['Mã nhân viên']?.toString().trim()
        const leaveTypeName = row['Loại nghỉ phép']?.toString().trim()
        const workShiftName = row['Ca làm việc']?.toString().trim() || null
        const startDateTime = row['Ngày bắt đầu']?.toString().trim()
        const endDateTime = row['Ngày kết thúc']?.toString().trim()
        const reason = row['Lý do']?.toString().trim()

        // Validate required fields
        if (!employeeID) {
          validationErrors.push(`Dòng ${rowNum}: Mã nhân viên là bắt buộc`)
          return
        }
        if (!leaveTypeName) {
          validationErrors.push(`Dòng ${rowNum}: Loại nghỉ phép là bắt buộc`)
          return
        }
        if (!startDateTime) {
          validationErrors.push(`Dòng ${rowNum}: Ngày bắt đầu là bắt buộc`)
          return
        }
        if (!endDateTime) {
          validationErrors.push(`Dòng ${rowNum}: Ngày kết thúc là bắt buộc`)
          return
        }
        if (!reason) {
          validationErrors.push(`Dòng ${rowNum}: Lý do là bắt buộc`)
          return
        }

        // Validate date format
        const startDate = new Date(startDateTime)
        const endDate = new Date(endDateTime)
        if (isNaN(startDate.getTime())) {
          validationErrors.push(`Dòng ${rowNum}: Ngày bắt đầu không hợp lệ (${startDateTime})`)
          return
        }
        if (isNaN(endDate.getTime())) {
          validationErrors.push(`Dòng ${rowNum}: Ngày kết thúc không hợp lệ (${endDateTime})`)
          return
        }
        if (startDate >= endDate) {
          validationErrors.push(`Dòng ${rowNum}: Ngày bắt đầu phải trước ngày kết thúc`)
          return
        }

        // Validate leave type exists
        const leaveType = leaveTypes.value.find(lt => lt.leaveTypeName === leaveTypeName)
        if (!leaveType) {
          validationErrors.push(`Dòng ${rowNum}: Loại nghỉ phép "${leaveTypeName}" không tồn tại trong hệ thống`)
          return
        }

        // Validate work shift exists (if provided)
        let workShiftID = null
        if (workShiftName) {
          const workShift = workshifts.value.find(ws => ws.shiftName === workShiftName)
          if (!workShift) {
            validationErrors.push(`Dòng ${rowNum}: Ca làm việc "${workShiftName}" không tồn tại trong hệ thống`)
            return
          }
          workShiftID = workShift.id
        }

        leaveRequestsToCreate.push({
          employeeID,
          leaveTypeID: leaveType.id,
          workShiftID,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          reason
        })
      })

      if (validationErrors.length > 0) {
        const errorMessage = `Có ${validationErrors.length} lỗi validation:\n${validationErrors.slice(0, 10).join('\n')}${validationErrors.length > 10 ? `\n... và ${validationErrors.length - 10} lỗi khác` : ''}`
        showMessage(errorMessage, 'error')
        return
      }

      if (leaveRequestsToCreate.length === 0) {
        showMessage('Không tìm thấy dữ liệu hợp lệ trong file.', 'error')
        return
      }

      // Import leave requests
      await createMultipleLeaveRequests(leaveRequestsToCreate)
      showMessage(`Đã nhập thành công ${leaveRequestsToCreate.length} đơn nghỉ phép.`, 'success')

      file.value = null
      showImportModal.value = false
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error)
      showChatbotMessage.value = false
      showMessage('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.', 'error')
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

// Computed để kiểm tra quyền truy cập (reactive với currentUser)
const hasAccess = computed(() => {
  const role = currentUser.value?.role
  console.log('=== LEAVE PAGE ACCESS CHECK ===')
  console.log('Current user:', currentUser.value)
  console.log('User role:', role)
  console.log('Can view leave:', canView('leave'))
  console.log('Has view_own permission:', hasPermission('leave', 'view_own'))
  return canView('leave')
})

// Lifecycle
onMounted(async () => {
  // Đảm bảo user info được cập nhật từ API để có role chính xác
  await refreshUserInfo()
  
  await Promise.all([
    fetchLeaveRequests(),
    fetchUsers(),
    fetchLeaveTypes(),
    fetchWorkShifts()
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
  <div v-if="!hasAccess" class="container-fluid py-4">
    <div class="alert alert-danger text-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      Bạn không có quyền truy cập trang này.
      <div class="mt-2 small">
        <strong>Role hiện tại:</strong> {{ currentUser?.role || 'Chưa xác định' }}
      </div>
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
      <DataTable :columns="leaveColumns" :data="paginatedLeaveData" @row-click="openDetailForm">
        <template #voucherCode="{ item }">
          <span class="voucher-code">{{ item.voucherCode }}</span>
        </template>
        <template #employeeID="{ item }">
          <strong>{{ item.employeeID }}</strong>
        </template>
        <template #userName="{ item }">
          <strong>{{ item.userName }}</strong>
        </template>
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
          <div class="date-time-wrapper">
            <span class="date-part">{{ formatDateTime(item.startDateTime).date }}</span>
            <span class="time-part">{{ formatDateTime(item.startDateTime).time }}</span>
          </div>
        </template>
        <template #endDateTime="{ item }">
          <div class="date-time-wrapper">
            <span class="date-part">{{ formatDateTime(item.endDateTime).date }}</span>
            <span class="time-part">{{ formatDateTime(item.endDateTime).time }}</span>
          </div>
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
  
  <!-- Detail Form Modal -->
  <ModalDialog v-model:show="showDetailForm" title="Chi tiết đơn nghỉ phép" size="lg">
    <LeaveForm 
      mode="detail" 
      :leave="selectedItem"
      @close="showDetailForm = false"
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

/* Voucher code styling - màu xanh, in đậm */
.voucher-code {
  color: #0d6efd;
  font-weight: 700;
  font-size: 0.95rem;
}

/* Employee ID và User Name - in đậm */
:deep(.table td) strong {
  font-weight: 700;
  color: #2c3e50;
}

/* Date time styling - định dạng đẹp và gọn */
.date-time-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.date-part {
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
}

.time-part {
  color: #6c757d;
  font-weight: 500;
  white-space: nowrap;
}

</style>

