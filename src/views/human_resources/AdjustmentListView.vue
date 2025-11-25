<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import { usePayrollAdjustment } from '../../composables/usePayrollAdjustment'
import { usePermissions } from '../../composables/usePermissions'
import ModalDialog from '@/components/common/ModalDialog.vue'
import AdjustmentForm from '@/components/common/adjustment/AdjustmentForm.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ApprovalNoteModal from '@/components/common/ApprovalNoteModal.vue'
import ApprovalHistoryModal from '@/components/common/ApprovalHistoryModal.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import TourGuide from '@/components/common/TourGuide.vue'
import AIChatbotButton from '@/components/common/AIChatbotButton.vue'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const {
  payrollAdjustments,
  loading,
  fetchPayrollAdjustments,
  createPayrollAdjustment,
  updatePayrollAdjustment,
  deletePayrollAdjustment,
  submitPayrollAdjustmentForApproval,
  approvePayrollAdjustment,
  rejectPayrollAdjustment,
  returnPayrollAdjustment
} = usePayrollAdjustment()

const { 
  canCreate, 
  canEditItem, 
  canDeleteItem,
  canSubmitItem,
  canApproveItem
} = usePermissions()

onMounted(async () => {
  await fetchPayrollAdjustments()
})

const adjustmentColumns = [
  { key: 'voucherNo', label: 'Số phiếu' },
  { key: 'decisionDate', label: 'Ngày Quyết định' },
  { key: 'monthYear', label: 'Tháng - Năm' },
  { key: 'adjustmentTypeName', label: 'Khoản cộng trừ' },
  { key: 'adjustmentItemName', label: 'Hạng mục' },
  { key: 'totalValue', label: 'Tổng giá trị' },
  { key: 'employeeCount', label: 'Số nhân viên' },
  { key: 'reason', label: 'Lý do' },
  { key: 'approveStatus', label: 'Trạng thái' },
]

const showCreateForm = ref(false)
const showUpdateForm = ref(false)
const selectedItem = ref(null)
const showFilter = ref(false)
const showImportModal = ref(false)
const showTourGuide = ref(false)

// Approval modal states
const showApprovalModal = ref(false)
const pendingAction = ref('') // 'approve', 'reject', 'return', 'submit'
const pendingVoucherNo = ref('')

// Approval history modal states
const showHistoryModal = ref(false)
const historyRequestType = ref('')
const historyRequestId = ref('')

const adjustmentData = computed(() => {
  return payrollAdjustments.value.map(request => ({
    ...request,
    decisionDate: new Date(request.decisionDate)
      .toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    monthYear: `${String(request.Month || request.month).padStart(2, '0')}/${request.Year || request.year}`,
    totalValue: (request.Employees || request.employees)?.reduce((sum, e) => sum + Math.abs(e.Value || e.value), 0) || 0,
    employeeCount: (request.Employees || request.employees)?.length || 0,
    // Ensure backward compatibility for display
    month: request.Month || request.month,
    year: request.Year || request.year,
    adjustmentTypeID: request.AdjustmentTypeID || request.adjustmentTypeID,
    adjustmentItemID: request.AdjustmentItemID || request.adjustmentItemID,
    reason: request.Reason || request.reason,
    employees: request.Employees || request.employees
  }))
})

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const monthYearFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredAdjustmentData = computed(() => {
  let result = [...adjustmentData.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(adjustment =>
      adjustment.voucherNo?.toLowerCase().includes(query) ||
      adjustment.adjustmentTypeName?.toLowerCase().includes(query) ||
      adjustment.adjustmentItemName?.toLowerCase().includes(query) ||
      adjustment.reason?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    const statusMap = {
      'Pending': 1,
      'Approved': 2,
      'Rejected': 3,
      'Returned': 4
    }
    const statusValue = statusMap[statusFilter.value]
    if (statusValue) {
      result = result.filter(adjustment => adjustment.approveStatus === statusValue)
    }
  }

  // Apply month/year filter (format: YYYY-MM from input type="month")
  if (monthYearFilter.value) {
    const [year, month] = monthYearFilter.value.split('-')
    result = result.filter(adjustment => {
      const adjMonth = String(adjustment.month || adjustment.Month).padStart(2, '0')
      const adjYear = String(adjustment.year || adjustment.Year)
      return adjMonth === month && adjYear === year
    })
  }

  // Apply date range filter (decision date)
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(adjustment => {
      const decisionDate = new Date(adjustment.decisionDate || adjustment.DecisionDate)
      return decisionDate >= start && decisionDate <= end
    })
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  monthYearFilter.value = ''
  dateRange.value = { start: null, end: null }
  currentPage.value = 1
}

const handleCreate = async (formData) => {
  try {
    await createPayrollAdjustment(formData)
    showCreateForm.value = false
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleUpdate = async (formData) => {
  try {
    await updatePayrollAdjustment(formData.voucherNo, formData)
    showUpdateForm.value = false
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleSubmitForApproval = (voucherNo) => {
  pendingVoucherNo.value = voucherNo
  pendingAction.value = 'submit'
  showApprovalModal.value = true
}

const openApprovalModal = (voucherNo, action) => {
  pendingVoucherNo.value = voucherNo
  pendingAction.value = action
  showApprovalModal.value = true
}

const handleApprovalConfirm = async (notes) => {
  try {
    const voucherNo = pendingVoucherNo.value
    const action = pendingAction.value
    
    switch (action) {
      case 'submit':
        await submitPayrollAdjustmentForApproval(voucherNo, notes)
        showUpdateForm.value = false
        selectedItem.value = null
        break
      case 'approve':
        await approvePayrollAdjustment(voucherNo, notes)
        break
      case 'reject':
        await rejectPayrollAdjustment(voucherNo, notes)
        break
      case 'return':
        await returnPayrollAdjustment(voucherNo, notes)
        break
    }
    
    showApprovalModal.value = false
    pendingVoucherNo.value = ''
    pendingAction.value = ''
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleApprovalCancel = () => {
  showApprovalModal.value = false
  pendingVoucherNo.value = ''
  pendingAction.value = ''
}

const getApprovalModalTitle = () => {
  const titles = {
    submit: 'Gửi duyệt khoản cộng/trừ',
    approve: 'Duyệt khoản cộng/trừ',
    reject: 'Từ chối khoản cộng/trừ',
    return: 'Trả lại khoản cộng/trừ'
  }
  return titles[pendingAction.value] || 'Nhập ghi chú'
}

const openHistoryModal = (item) => {
  historyRequestType.value = 'PayrollAdjustment'
  historyRequestId.value = item.voucherNo
  showHistoryModal.value = true
}

const handleUndoSuccess = async () => {
  await fetchPayrollAdjustments()
}

const handleDelete = async (voucherNo) => {
  if (confirm('Bạn có chắc chắn muốn xóa khoản cộng trừ này?')) {
    try {
      await deletePayrollAdjustment(voucherNo)
    } catch (error) {
      // Error handling is done by composable
    }
  }
}

const openUpdateForm = (voucherNo) => {
  // Lấy dữ liệu gốc từ payrollAdjustments thay vì adjustmentData để có decisionDate ở định dạng gốc
  const originalData = payrollAdjustments.value.find(item => item.voucherNo === voucherNo)
  if (originalData) {
    selectedItem.value = { ...originalData }
  }
  showUpdateForm.value = true
}

const currentPage = ref(1)
const itemsPerPage = ref(8)
const paginatedAdjustmentData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredAdjustmentData.value.slice(start, start + itemsPerPage.value)
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

  // --- Sheet 1: Dữ liệu nhập ---
  const dataSheet = workbook.addWorksheet('Dữ liệu nhập')
  const headers = [
    { header: 'Số phiếu', key: 'voucherNo', width: 20 },
    { header: 'Ngày quyết định', key: 'decisionDate', width: 20 },
    { header: 'Tháng', key: 'month', width: 15 },
    { header: 'Năm', key: 'year', width: 15 },
    { header: 'ID Khoản cộng trừ', key: 'adjustmentTypeID', width: 20 },
    { header: 'ID Hạng mục', key: 'adjustmentItemID', width: 20 },
    { header: 'Lý do', key: 'reason', width: 30 },
  ]
  dataSheet.columns = headers

  applyHeaderStyle(dataSheet.getRow(1))

  // Add example row
  dataSheet.addRow({
    voucherNo: 'PC001',
    decisionDate: '2025-01-15',
    month: '1',
    year: '2025',
    adjustmentTypeID: '1',
    adjustmentItemID: '1',
    reason: 'Hoàn thành dự án đúng hạn'
  })

  // --- Sheet 2: Danh sách nhân viên ---
  const employeeSheet = workbook.addWorksheet('Danh sách nhân viên')
  const employeeHeaders = [
    { header: 'Mã nhân viên', key: 'employeeCode', width: 20 },
    { header: 'Họ tên', key: 'fullName', width: 30 },
    { header: 'Giá trị', key: 'value', width: 15 },
  ]
  employeeSheet.columns = employeeHeaders

  applyHeaderStyle(employeeSheet.getRow(1))

  // Add example employees
  employeeSheet.addRows([
    { employeeCode: 'EMP001', fullName: 'Nguyễn Văn A', value: '500000' },
    { employeeCode: 'EMP002', fullName: 'Trần Thị B', value: '300000' },
    { employeeCode: 'EMP003', fullName: 'Lê Văn C', value: '400000' },
  ])

  // --- Sheet 3: Khoản cộng trừ ---
  const adjustmentTypeSheet = workbook.addWorksheet('Khoản cộng trừ')
  const adjustmentTypeHeaders = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên khoản cộng trừ', key: 'name', width: 30 },
  ]
  adjustmentTypeSheet.columns = adjustmentTypeHeaders

  applyHeaderStyle(adjustmentTypeSheet.getRow(1))

  // Add example adjustment types
  adjustmentTypeSheet.addRows([
    { id: '1', name: 'Thưởng' },
    { id: '2', name: 'Phạt' },
    { id: '3', name: 'Phụ cấp' },
    { id: '4', name: 'Khấu trừ' },
  ])

  // --- Sheet 4: Hạng mục ---
  const adjustmentItemSheet = workbook.addWorksheet('Hạng mục')
  const adjustmentItemHeaders = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên hạng mục', key: 'name', width: 30 },
  ]
  adjustmentItemSheet.columns = adjustmentItemHeaders

  applyHeaderStyle(adjustmentItemSheet.getRow(1))

  // Add example adjustment items
  adjustmentItemSheet.addRows([
    { id: '1', name: 'Thưởng dự án' },
    { id: '2', name: 'Thưởng hiệu suất' },
    { id: '3', name: 'Phạt đi muộn' },
    { id: '4', name: 'Phụ cấp ăn trưa' },
  ])

  // --- Sheet 5: Hướng dẫn ---
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
    { column: 'Số phiếu', description: 'Mã số phiếu khoản cộng trừ.', required: 'Có', example: 'PC001' },
    { column: 'Ngày quyết định', description: 'Ngày ra quyết định (định dạng: YYYY-MM-DD).', required: 'Có', example: '2025-01-15' },
    { column: 'Tháng', description: 'Tháng áp dụng (1-12).', required: 'Có', example: '1' },
    { column: 'Năm', description: 'Năm áp dụng.', required: 'Có', example: '2025' },
    { column: 'ID Khoản cộng trừ', description: 'ID của khoản cộng trừ (tra cứu trong sheet "Khoản cộng trừ").', required: 'Có', example: '1' },
    { column: 'ID Hạng mục', description: 'ID của hạng mục (tra cứu trong sheet "Hạng mục").', required: 'Có', example: '1' },
    { column: 'Lý do', description: 'Lý do áp dụng khoản cộng trừ.', required: 'Có', example: 'Hoàn thành dự án đúng hạn' },
    { column: '', description: '', required: '', example: '' },
    { column: 'Danh sách nhân viên', description: 'Sheet "Danh sách nhân viên" chứa thông tin nhân viên và giá trị tương ứng.', required: '', example: '' },
    { column: 'Khoản cộng trừ', description: 'Sheet "Khoản cộng trừ" chứa danh sách các loại khoản cộng trừ.', required: '', example: '' },
    { column: 'Hạng mục', description: 'Sheet "Hạng mục" chứa danh sách các hạng mục chi tiết.', required: '', example: '' },
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

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'Mau_Nhap_Khoan_Cong_Tru.xlsx')
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
      
      // Process main data sheet
      const dataSheetName = workbook.SheetNames.find(name => name.includes('Dữ liệu nhập')) || workbook.SheetNames[0]
      const dataWorksheet = workbook.Sheets[dataSheetName]
      const adjustmentData = XLSX.utils.sheet_to_json(dataWorksheet)

      // Process employee sheet
      const employeeSheetName = workbook.SheetNames.find(name => name.includes('Danh sách nhân viên'))
      let employeeData = []
      if (employeeSheetName) {
        const employeeWorksheet = workbook.Sheets[employeeSheetName]
        employeeData = XLSX.utils.sheet_to_json(employeeWorksheet)
      }

      if (adjustmentData.length === 0) {
        alert('File Excel không có dữ liệu khoản cộng trừ.')
        return
      }

      if (employeeData.length === 0) {
        alert('File Excel không có dữ liệu nhân viên.')
        return
      }

      const adjustmentsToCreate = adjustmentData.map(row => ({
        voucherNo: row['Số phiếu'],
        decisionDate: row['Ngày quyết định'],
        month: row['Tháng'],
        year: row['Năm'],
        adjustmentTypeID: row['ID Khoản cộng trừ'],
        adjustmentItemID: row['ID Hạng mục'],
        reason: row['Lý do'],
        employees: employeeData.map(emp => ({
          employeeCode: emp['Mã nhân viên'],
          fullName: emp['Họ tên'],
          value: emp['Giá trị']
        }))
      })).filter(adj => adj.voucherNo && adj.decisionDate && adj.month && adj.year && adj.adjustmentTypeID && adj.adjustmentItemID && adj.reason)

      if (adjustmentsToCreate.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file.')
        return
      }

      await Promise.all(adjustmentsToCreate.map(adjustment => createPayrollAdjustment(adjustment)))

      alert(`Đã nhập thành công ${adjustmentsToCreate.length} khoản cộng trừ với ${employeeData.length} nhân viên.`)
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
  const worksheet = workbook.addWorksheet('PayrollAdjustments')

  worksheet.columns = adjustmentColumns.map(c => ({ header: c.label, key: c.key, width: 15 }))

  adjustmentData.value.forEach(row => {
    worksheet.addRow(row)
  })

  applyHeaderStyle(worksheet.getRow(1))

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber !== 1) {
      row.eachCell(applyDataStyle)
    }
  })

  autoFitColumns(worksheet)

  const buf = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buf]), 'PayrollAdjustments.xlsx')
}

// Tour Guide Steps
const tourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là trang quản lý khoản cộng trừ. Tại đây bạn có thể xem, tạo, và quản lý các khoản cộng trừ lương của nhân viên.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ với các chức năng chính. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form tạo khoản cộng trừ mới. Bạn có thể nhập số phiếu, ngày quyết định, tháng/năm áp dụng, chọn khoản cộng trừ, hạng mục, lý do và thêm danh sách nhân viên với giá trị tương ứng. Sau khi điền đầy đủ thông tin, bấm "Lưu" để tạo khoản cộng trừ.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc khoản cộng trừ theo nhiều tiêu chí khác nhau như số phiếu, khoản cộng trừ, hạng mục, trạng thái, tháng/năm và khoảng thời gian.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo số phiếu, khoản cộng trừ, hạng mục. Chọn trạng thái từ dropdown. Chọn tháng/năm hoặc khoảng thời gian từ ngày đến ngày. Sau đó bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách khoản cộng trừ ra file Excel để lưu trữ hoặc xử lý thêm. Khi bấm vào đây, file Excel sẽ được tải xuống tự động.'
  },
  {
    target: '[data-tour="import-modal"]',
    message: 'Đây là modal nhập Excel. Bạn có thể tải file mẫu, điền thông tin khoản cộng trừ và danh sách nhân viên vào các sheet tương ứng, sau đó bấm "Xử lý" để import các khoản cộng trừ vào hệ thống.',
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
    target: '[data-tour="table"]',
    message: 'Đây là bảng danh sách khoản cộng trừ. Bạn có thể xem thông tin chi tiết về các khoản cộng trừ như số phiếu, ngày quyết định, tháng/năm, khoản cộng trừ, hạng mục, tổng giá trị, số nhân viên, lý do và trạng thái duyệt. Bạn có thể bấm vào một hàng để xem chi tiết.'
  },
  {
    target: '[data-tour="actions"]',
    message: 'Cột "Thao tác" chứa các nút để bạn thực hiện các hành động như: Sửa khoản cộng trừ, Xóa, Gửi duyệt, Duyệt, Từ chối hoặc Trả lại. Các nút sẽ hiển thị tùy theo quyền của bạn và trạng thái khoản cộng trừ.'
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều khoản cộng trừ hơn. Bạn có thể thấy số lượng khoản cộng trừ hiện tại và tổng số khoản cộng trừ. Đó là tất cả những gì tôi muốn giới thiệu với bạn!'
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
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0" data-tour="title">Danh sách khoản cộng trừ</h2>
      <div class="d-flex gap-2" data-tour="toolbar">
        <ActionButton 
          v-if="canCreate('payroll-adjustment')"
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
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
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
              placeholder="Tìm kiếm theo số phiếu, khoản cộng trừ, hạng mục..."
            >
          </div>
          <div class="col-md-2">
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
              <option value="Returned">Trả lại</option>
            </select>
          </div>
          <div class="col-md-2">
            <input
              type="month"
              class="form-control"
              v-model="monthYearFilter"
              placeholder="Tháng/Năm"
            >
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
          <div class="col-md-1">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <ModalDialog v-model:show="showCreateForm" title="Thêm khoản cộng trừ" size="lg" data-tour="create-form">
      <AdjustmentForm mode="create" @submit="handleCreate" @close="showCreateForm = false" />
    </ModalDialog>
    <ModalDialog v-model:show="showUpdateForm" title="Sửa khoản cộng trừ" size="lg">
      <AdjustmentForm mode="update" :adjustment="selectedItem" @submit="handleUpdate" @close="showUpdateForm = false" />
    </ModalDialog>
    
    <div class="table-responsive adjustment-table" data-tour="table">
      <DataTable :columns="adjustmentColumns" :data="paginatedAdjustmentData">
        <template #actions="{ item }">
          <div data-tour="actions">
          <div class="d-flex justify-content-start gap-2">
            <!-- Edit button based on centralized permissions -->
            <ActionButton 
              v-if="canEditItem('payroll-adjustment', item)" 
              icon="fas fa-edit" 
              type="success" 
              @click.stop="openUpdateForm(item.voucherNo)" 
              title="Sửa"
            ></ActionButton>
            <!-- Delete button based on centralized permissions -->
            <ActionButton 
              v-if="canDeleteItem('payroll-adjustment', item)" 
              type="danger" 
              @click.stop="handleDelete(item.voucherNo)" 
              icon="fas fa-trash" 
              title="Xóa"
            ></ActionButton>
            <!-- Submit for approval button -->
            <ActionButton 
              v-if="canSubmitItem('payroll-adjustment', item)" 
              type="primary" 
              @click.stop="handleSubmitForApproval(item.voucherNo)" 
              icon="fas fa-paper-plane" 
              title="Gửi duyệt"
            ></ActionButton>
            <!-- Approve button -->
            <ActionButton 
              v-if="canApproveItem('payroll-adjustment', item)" 
              type="success" 
              @click.stop="openApprovalModal(item.voucherNo, 'approve')" 
              icon="fas fa-check" 
              title="Duyệt"
            ></ActionButton>
            <!-- Reject button -->
            <ActionButton 
              v-if="canApproveItem('payroll-adjustment', item)" 
              type="danger" 
              @click.stop="openApprovalModal(item.voucherNo, 'reject')" 
              icon="fas fa-times" 
              title="Từ chối"
            ></ActionButton>
            <!-- Return button -->
            <ActionButton 
              v-if="canApproveItem('payroll-adjustment', item)" 
              type="warning" 
              @click.stop="openApprovalModal(item.voucherNo, 'return')" 
              icon="fas fa-undo" 
              title="Trả lại"
            ></ActionButton>
          </div>
          </div>
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
    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted">
        Hiển thị {{ paginatedAdjustmentData.length }} trên {{ filteredAdjustmentData.length }} khoản cộng trừ
      </div>
      <Pagination
        :totalItems="filteredAdjustmentData.length"
        :itemsPerPage="itemsPerPage"
        :currentPage="currentPage"
        @update:currentPage="currentPage = $event"
        data-tour="pagination"
      />
    </div>

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
  <ModalDialog v-model:show="showImportModal" title="Nhập khoản cộng trừ từ Excel" size="lg" data-tour="import-modal">
      <div class="p-4">
        <div class="alert alert-info">
          <h6><i class="fas fa-info-circle me-2"></i>Hướng dẫn nhập Excel</h6>
          <p class="mb-2">File Excel bao gồm các sheet sau:</p>
          <ul class="mb-0">
            <li><strong>Dữ liệu nhập:</strong> Thông tin khoản cộng trừ (sử dụng ID thay vì tên)</li>
            <li><strong>Danh sách nhân viên:</strong> Mã nhân viên, họ tên và giá trị tương ứng</li>
            <li><strong>Khoản cộng trừ:</strong> Tra cứu ID của các loại khoản cộng trừ</li>
            <li><strong>Hạng mục:</strong> Tra cứu ID của các hạng mục chi tiết</li>
            <li><strong>Hướng dẫn:</strong> Chi tiết về cách điền dữ liệu</li>
          </ul>
        </div>
        
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
  />
  <AIChatbotButton 
    message="Xin chào! Tôi có thể giúp gì cho bạn?" 
    title="Trợ lý AI"
    @guide-click="startTour"
  />
  </div>
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


