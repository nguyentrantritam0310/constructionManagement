<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Quản lý hợp đồng lao động</h2>
      <div class="d-flex gap-2" v-if="activeTab === 'allContracts'">
        <ActionButton type="primary" icon="fas fa-plus me-2" @click="openAddContractForm">
          Thêm
        </ActionButton>
        <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
          Lọc
        </ActionButton>
        <ActionButton type="success" icon="fas fa-file-export me-2" @click="exportToExcel('contracts')">
          Xuất Excel
        </ActionButton>
        <ActionButton type="info" icon="fas fa-file-import me-2" @click="showImportModal = true">
          Nhập Excel
        </ActionButton>
      </div>
    </div>
    <TabBar :tabs="tabs" :activeTab="activeTab" @update:activeTab="activeTab = $event" />
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <DataTable :columns="columnsByTab" :data="paginatedContracts">
          <template #actions="{ item }">
            <div class="d-flex justify-content-start gap-2">
              <!-- Tab: Tất cả hợp đồng -->
              <template v-if="activeTab === 'allContracts'">
                <ActionButton type="success" icon="fas fa-pen-to-square" title="Sửa"
                  @click.stop="openUpdateForm(item.id)" />
                <ActionButton type="danger" icon="fas fa-trash" title="Xóa hợp đồng"
                  @click.stop="confirmDeleteContract(item)" />
              </template>

              <!-- Tab: Chưa lên hợp đồng -->
              <template v-else-if="activeTab === 'notCreated'">
                <ActionButton type="success" icon="fas fa-plus" title="Tạo hợp đồng"
                  @click.stop="createContractForEmployee(item)" size="sm">
                </ActionButton>
              </template>

              <!-- Tab: Hợp đồng hết hạn -->
              <template v-else-if="activeTab === 'expired'">
                <div class="d-flex gap-1">
                  <ActionButton type="warning" icon="fas fa-calendar-plus" title="Gia hạn hợp đồng"
                    @click.stop="extendContract(item)" size="sm">

                  </ActionButton>
                  <ActionButton type="danger" icon="fas fa-user-times" title="Cho nghỉ việc"
                    @click.stop="terminateEmployee(item)" size="sm">

                  </ActionButton>
                </div>
              </template>
            </div>
          </template>
          <template #approveStatus="{ item }">
            <ApprovalStatusLabel :status="item.approveStatus" />
          </template>
          <template #validityStatus="{ item }">
            <span :class="getValidityStatusClass(item.validityStatus)" class="validity-status">
              <i :class="getValidityStatusIcon(item.validityStatus)" class="me-1"></i>
              {{ item.validityStatus }}
            </span>
          </template>
          <template #startDate="{ item }">
            <span class="date-display">{{ item.startDateFormatted }}</span>
          </template>
          <template #endDate="{ item }">
            <span class="date-display">{{ item.endDateFormatted }}</span>
          </template>
          <template #daysToExpire="{ item }">
            <span :class="getDaysToExpireClass(item.daysToExpire)" class="days-to-expire">
              <i :class="getDaysToExpireIcon(item.daysToExpire)" class="me-1"></i>
              {{ item.daysToExpire }} ngày
            </span>
          </template>
        </DataTable>
      </div>
    </div>
    <div class="d-flex justify-content-end mt-3">
      <Pagination :total-items="paginatedContracts.length" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" />
    </div>
    <ModalDialog :show="showContractModal" title="Thêm/Cập nhật hợp đồng" size="xl" @update:show="closeContractModal">
      <ContractForm :mode="contractFormMode" :contract="selectedContractForm" :employees="employees"
        @submit="handleContractSubmit" @close="closeContractModal" />
    </ModalDialog>

    <!-- Delete Confirmation Modal -->
    <ModalDialog :show="showDeleteModal" title="Xác nhận xóa hợp đồng" size="md" @update:show="closeDeleteModal">
      <div class="text-center p-4">
        <div class="mb-3">
          <i class="fas fa-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        </div>
        <h5 class="mb-3">Bạn có chắc chắn muốn xóa hợp đồng này?</h5>
        <div class="alert alert-warning">
          <strong>Hợp đồng:</strong> {{ contractToDelete?.contractNumber }}<br>
          <strong>Nhân viên:</strong> {{ contractToDelete?.employeeName }}<br>
          <strong>Loại hợp đồng:</strong> {{ contractToDelete?.contractTypeName }}
        </div>
        <p class="text-muted mb-4">Hành động này không thể hoàn tác!</p>
        <div class="d-flex justify-content-center gap-3">
          <button type="button" class="btn btn-secondary" @click="closeDeleteModal">
            <i class="fas fa-times me-1"></i> Hủy
          </button>
          <button type="button" class="btn btn-danger" @click="deleteContract">
            <i class="fas fa-trash me-1"></i> Xóa
          </button>
        </div>
      </div>
    </ModalDialog>

    <!-- Status Change Modal removed - validity is now calculated based on date -->

    <!-- Extend Contract Modal -->
    <ModalDialog :show="showExtendModal" title="Gia hạn hợp đồng" size="md" @update:show="closeExtendModal">
      <div class="p-4">
        <div class="mb-3">
          <h6>Hợp đồng: {{ contractToExtend?.contractNumber }}</h6>
          <p class="text-muted">Nhân viên: {{ contractToExtend?.employeeName }}</p>
          <div class="alert alert-info">
            <strong>Ngày bắt đầu hiện tại:</strong> {{ contractToExtend?.startDate }}<br>
            <strong>Ngày hết hạn hiện tại:</strong> {{ contractToExtend?.endDate }}
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">Ngày bắt đầu mới:</label>
            <input type="date" class="form-control" v-model="newStartDate" :min="contractToExtend?.endDate">
          </div>
          <div class="col-md-6">
            <label class="form-label">Ngày hết hạn mới:</label>
            <input type="date" class="form-control" v-model="newEndDate"
              :min="newStartDate || contractToExtend?.endDate">
          </div>
        </div>

        <div class="d-flex justify-content-end gap-3">
          <button type="button" class="btn btn-secondary" @click="closeExtendModal">
            <i class="fas fa-times me-1"></i> Hủy
          </button>
          <button type="button" class="btn btn-warning" @click="handleExtendContract"
            :disabled="!newStartDate || !newEndDate">
            <i class="fas fa-calendar-plus me-1"></i> Gia hạn
          </button>
        </div>
      </div>
    </ModalDialog>

    <!-- Terminate Employee Modal -->
    <ModalDialog :show="showTerminateModal" title="Cho nhân viên nghỉ việc" size="md"
      @update:show="closeTerminateModal">
      <div class="text-center p-4">
        <div class="mb-3">
          <i class="fas fa-user-times text-danger" style="font-size: 3rem;"></i>
        </div>
        <h5 class="mb-3">Xác nhận cho nhân viên nghỉ việc</h5>
        <div class="alert alert-warning">
          <strong>Nhân viên:</strong> {{ employeeToTerminate?.employeeName }}<br>
          <strong>Mã nhân viên:</strong> {{ employeeToTerminate?.employeeID }}<br>
          <strong>Hợp đồng:</strong> {{ employeeToTerminate?.contractNumber }}
        </div>
        <p class="text-muted mb-4">Hành động này sẽ chấm dứt hợp đồng và thay đổi trạng thái nhân viên thành "Nghỉ
          việc".
        </p>
        <div class="d-flex justify-content-center gap-3">
          <button type="button" class="btn btn-secondary" @click="closeTerminateModal">
            <i class="fas fa-times me-1"></i> Hủy
          </button>
          <button type="button" class="btn btn-danger" @click="handleTerminateEmployee">
            <i class="fas fa-user-times me-1"></i> Xác nhận nghỉ việc
          </button>
        </div>
      </div>
    </ModalDialog>

    <!-- Import Excel Modal -->
    <ModalDialog v-model:show="showImportModal" title="Nhập hợp đồng lao động từ Excel" size="lg">
      <div class="p-4">
        <div class="alert alert-info">
          <h6><i class="fas fa-info-circle me-2"></i>Hướng dẫn nhập Excel</h6>
          <p class="mb-2">File Excel bao gồm các sheet sau:</p>
          <ul class="mb-0">
            <li><strong>Dữ liệu nhập:</strong> Thông tin hợp đồng lao động</li>
            <li><strong>Loại hợp đồng:</strong> Tra cứu ID của các loại hợp đồng</li>
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

    <GlobalMessageModal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/common/TabBar.vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import UpdateButton from '@/components/common/UpdateButton.vue'
import ChangeStatusButton from '@/components/common/ChangeStatusButton.vue'
import ContractForm from '../../components/common/contract/ContractForm.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import { useContract } from '../../composables/useContract.js'
import { useEmployee } from '../../composables/useEmployee.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'
// Dữ liệu hardcode cho các loại hợp đồng, hình thức và phụ cấp
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'
import { CONTRACT_STATUS, CONTRACT_STATUS_LABELS, CONTRACT_APPROVE_STATUS } from '../../constants/status.js'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

const activeTab = ref('allContracts')

const tabs = [
  { key: 'allContracts', label: 'Hợp đồng lao động', icon: 'fas fa-file-contract' },
  { key: 'notCreated', label: 'Chưa lên hợp đồng', icon: 'fas fa-user-plus' },
  { key: 'expired', label: 'Hợp đồng hết hạn', icon: 'fas fa-calendar-times' }
]
const {
  contracts,
  employeesWithoutContract,
  loading,
  error,
  fetchAllContracts,
  calculateEmployeesWithoutContract,
  deleteContract: deleteContractFromStore
} = useContract()
const { employees, fetchAllEmployees } = useEmployee()
const { showMessage } = useGlobalMessage()

// Data is now fetched from API in ContractForm component

// Import contract service
import { contractService } from '../../services/contractService'
import { employeeService } from '../../services/employeeService'

// Thêm các hàm còn thiếu cho contract operations
const createContract = async (contractData) => {
  try {
    const response = await contractService.createContract(contractData)
    await fetchAllContracts() // Refresh data
    return response
  } catch (error) {
    console.error('Error creating contract:', error)
    throw error
  }
}

const updateContract = async (contractData) => {
  try {
    console.log('=== UPDATE CONTRACT CALLED ===')
    console.log('Contract data received:', contractData)
    console.log('Contract data keys:', Object.keys(contractData))
    console.log('Contract data values:', Object.values(contractData))
    console.log('=== END UPDATE CONTRACT DEBUG ===')
    
    const response = await contractService.updateContract(contractData)
    await fetchAllContracts() // Refresh data
    return response
  } catch (error) {
    console.error('Error updating contract:', error)
    throw error
  }
}

const formatContractForSubmit = (data) => {
  // Format data for API submission
  const formattedData = {
    contractNumber: data.contractNumber,
    contractTypeID: data.contractTypeID,
    employeeID: data.employeeID,
    startDate: data.startDate,
    endDate: data.endDate,
    contractSalary: parseFloat(data.contractSalary) || 0,
    insuranceSalary: parseFloat(data.insuranceSalary) || 0,
    approveStatus: data.approveStatus || 0, // Use the approveStatus from ContractForm (already converted to int)
    allowances: (data.allowances || []).map(allowance => ({
      allowanceID: allowance.allowanceID,
      value: parseFloat(allowance.value) || 0,
      // Add ContractID for update operations if it exists
      ...(data.id && { contractID: data.id })
    }))
  }

  // Add ID for update operations
  if (data.id) {
    formattedData.id = data.id
  }

  // Remove fields that don't exist in ContractDTOPUT
  delete formattedData.contractTypeName
  delete formattedData.employeeName
  delete formattedData.validityStatus
  delete formattedData.daysToExpire
  delete formattedData.startDateFormatted
  delete formattedData.endDateFormatted

  console.log('=== FORMAT CONTRACT FOR SUBMIT DEBUG ===')
  console.log('Original data:', data)
  console.log('Formatted data:', formattedData)
  console.log('Formatted data keys:', Object.keys(formattedData))
  console.log('=== END FORMAT DEBUG ===')

  return formattedData
}
onMounted(async () => {
  await Promise.all([
    fetchAllContracts(),
    fetchAllEmployees()
  ])
  
  // Debug logging after data is loaded
  console.log('=== LABOR CONTRACT VIEW DEBUG ===')
  console.log('Contracts loaded:', contracts.value?.length || 0)
  console.log('Employees loaded:', employees.value?.length || 0)
  console.log('Sample contract:', contracts.value?.[0])
  console.log('Sample employee:', employees.value?.[0])
})
const today = new Date()
const endDt = null
const contractsData = computed(() => {
  const today = new Date()
  return contracts.value.map((c, index) => {
    const end = new Date(c.endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))

    // Calculate validity status based on date
    const validityStatus = end > today ? 'Còn hiệu lực' : 'Hết hiệu lực'

    return {
      ...c,
      stt: index + 1,
      daysToExpire: daysLeft,
      validityStatus: validityStatus,
      // Format dates for display
      startDateFormatted: formatDateTime(c.startDate),
      endDateFormatted: formatDateTime(c.endDate)
    }
  })
})

// Format date to dd/mm/yyyy HH:mm
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

// Get validity status class and icon
const getValidityStatusClass = (status) => {
  return status === 'Còn hiệu lực' ? 'validity-active' : 'validity-expired'
}

const getValidityStatusIcon = (status) => {
  return status === 'Còn hiệu lực' ? 'fas fa-check-circle' : 'fas fa-times-circle'
}

// Get days to expire class and icon
const getDaysToExpireClass = (days) => {
  if (days <= 0) return 'days-expired'
  if (days <= 7) return 'days-warning'
  if (days <= 30) return 'days-caution'
  return 'days-normal'
}

const getDaysToExpireIcon = (days) => {
  if (days <= 0) return 'fas fa-exclamation-triangle'
  if (days <= 7) return 'fas fa-clock'
  if (days <= 30) return 'fas fa-calendar-check'
  return 'fas fa-calendar-alt'
}

const employeesData = computed(() => {
  return employees.value.map((machine, index) => ({
    ...machine,
    stt: index + 1,
  }))
})


// Sử dụng contractsData để có trường daysToExpire cho bảng
const expiredContracts = computed(() => {
  return contractsData.value.filter(c => c.daysToExpire <= 10)
})

const notCreatedContracts = computed(() => {
  // Tính toán nhân viên chưa có hợp đồng từ dữ liệu local
  const employeesWithoutContractData = calculateEmployeesWithoutContract(employees.value)
  
  console.log('=== NOT CREATED CONTRACTS DEBUG ===')
  console.log('Total employees:', employees.value?.length || 0)
  console.log('Total contracts:', contracts.value?.length || 0)
  console.log('Sample employee data:', employees.value?.[0])
  console.log('Sample contract data:', contracts.value?.[0])
  console.log('Employee IDs in contracts:', contracts.value?.map(c => c.employeeID))
  console.log('Employee IDs in employees:', employees.value?.map(e => e.id))
  console.log('Employees without contract:', employeesWithoutContractData?.length || 0)
  console.log('Sample employee without contract:', employeesWithoutContractData?.[0])

  return employeesWithoutContractData.map((employee, index) => {
    const processedEmployee = {
      id: employee.id || employee.employeeID || `emp_${index}`, // Fallback cho id
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      email: employee.email || '',
      phone: employee.phone || '',
      birthday: employee.birthday ? new Date(employee.birthday).toLocaleDateString('vi-VN') : '',
      joinDate: employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('vi-VN') : '',
      stt: index + 1,
    }
    
    if (index === 0) {
      console.log('First processed employee:', processedEmployee)
      console.log('Original employee keys:', Object.keys(employee))
      console.log('Original employee values:', employee)
    }
    
    return processedEmployee
  })
})

const contractColumns = [
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'approveStatus', label: 'Trạng thái duyệt' },
  { key: 'validityStatus', label: 'Hiệu lực' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
]

const notCreatedColumns = [
  { key: 'id', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'birthday', label: 'Ngày sinh' },
  { key: 'joinDate', label: 'Ngày vào làm' },
]

const expiredColumns = [
  { key: 'employeeID', label: 'Mã nhân viên' },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
  { key: 'validityStatus', label: 'Hiệu lực' },
  { key: 'daysToExpire', label: 'Số ngày đến hạn' },
]

const currentPage = ref(1)
const itemsPerPage = 20

const paginatedContracts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  if (activeTab.value === 'allContracts') return contractsData.value.slice(start, end)
  if (activeTab.value === 'notCreated') return notCreatedContracts.value.slice(start, end)
  if (activeTab.value === 'expired') return expiredContracts.value.slice(start, end)
  return []
})

const columnsByTab = computed(() => {
  if (activeTab.value === 'allContracts') return contractColumns
  if (activeTab.value === 'notCreated') return notCreatedColumns
  if (activeTab.value === 'expired') return expiredColumns
  return []
})

const handlePageChange = (page) => {
  currentPage.value = page
}

// Excel export function
const exportToExcel = async (type) => {
  const workbook = new ExcelJS.Workbook()
  let worksheet, dataToExport, columnsToExport

  if (activeTab.value === 'allContracts') {
    worksheet = workbook.addWorksheet('LaborContracts')
    dataToExport = contractsData.value
    columnsToExport = contractColumns
  } else if (activeTab.value === 'notCreated') {
    worksheet = workbook.addWorksheet('EmployeesWithoutContract')
    dataToExport = notCreatedContracts.value
    columnsToExport = notCreatedColumns
  } else if (activeTab.value === 'expired') {
    worksheet = workbook.addWorksheet('ExpiredContracts')
    dataToExport = expiredContracts.value
    columnsToExport = expiredColumns
  }

  // Thêm header
  worksheet.columns = columnsToExport.map(c => ({ header: c.label, key: c.key, width: 15 }))

  // Thêm dữ liệu
  dataToExport.forEach((row, index) => {
    worksheet.addRow(row)
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
  const fileName = activeTab.value === 'allContracts' ? 'LaborContracts.xlsx' :
    activeTab.value === 'notCreated' ? 'EmployeesWithoutContract.xlsx' :
      'ExpiredContracts.xlsx'
  saveAs(new Blob([buf]), fileName)
}

const showContractModal = ref(false)
const selectedContractForm = ref(null)
const contractFormMode = ref('create')
const showFilter = ref(false)
const showImportModal = ref(false)

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
    { header: 'Số hợp đồng', key: 'contractNumber', width: 20 },
    { header: 'ID Loại hợp đồng', key: 'contractTypeID', width: 20 },
    { header: 'Mã nhân viên', key: 'employeeID', width: 20 },
    { header: 'Ngày bắt đầu', key: 'startDate', width: 20 },
    { header: 'Ngày kết thúc', key: 'endDate', width: 20 },
    { header: 'Lương hợp đồng', key: 'contractSalary', width: 20 },
    { header: 'Lương bảo hiểm', key: 'insuranceSalary', width: 20 },
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
    contractNumber: 'HD001',
    contractTypeID: '1',
    employeeID: 'EMP001',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    contractSalary: '15000000',
    insuranceSalary: '15000000'
  })

  // --- Sheet 2: Loại hợp đồng ---
  const contractTypeSheet = workbook.addWorksheet('Loại hợp đồng')
  const contractTypeHeaders = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Tên loại hợp đồng', key: 'name', width: 30 },
  ]
  contractTypeSheet.columns = contractTypeHeaders

  // Style header
  contractTypeSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Add example contract types
  contractTypeSheet.addRows([
    { id: '1', name: 'Hợp đồng lao động xác định thời hạn' },
    { id: '2', name: 'Hợp đồng lao động không xác định thời hạn' },
    { id: '3', name: 'Hợp đồng thử việc' },
  ])

  // --- Sheet 3: Hướng dẫn ---
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
    { column: 'Số hợp đồng', description: 'Mã số hợp đồng lao động.', required: 'Có', example: 'HD001' },
    { column: 'ID Loại hợp đồng', description: 'ID của loại hợp đồng (tra cứu trong sheet "Loại hợp đồng").', required: 'Có', example: '1' },
    { column: 'Mã nhân viên', description: 'Mã định danh của nhân viên trong hệ thống.', required: 'Có', example: 'EMP001' },
    { column: 'Ngày bắt đầu', description: 'Ngày bắt đầu hợp đồng (định dạng: YYYY-MM-DD).', required: 'Có', example: '2025-01-01' },
    { column: 'Ngày kết thúc', description: 'Ngày kết thúc hợp đồng (định dạng: YYYY-MM-DD).', required: 'Có', example: '2025-12-31' },
    { column: 'Lương hợp đồng', description: 'Mức lương theo hợp đồng (VND).', required: 'Có', example: '15000000' },
    { column: 'Lương bảo hiểm', description: 'Mức lương đóng bảo hiểm (VND).', required: 'Có', example: '15000000' },
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
  saveAs(new Blob([buf]), 'Mau_Nhap_Hop_Dong_Lao_Dong.xlsx')
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

      const contractsToCreate = jsonData.map(row => ({
        contractNumber: row['Số hợp đồng'],
        contractTypeID: row['ID Loại hợp đồng'],
        employeeID: row['Mã nhân viên'],
        startDate: row['Ngày bắt đầu'],
        endDate: row['Ngày kết thúc'],
        contractSalary: row['Lương hợp đồng'],
        insuranceSalary: row['Lương bảo hiểm'],
        approveStatus: 0, // Default to Created
        allowances: [] // Empty allowances for now
      })).filter(contract => contract.contractNumber && contract.contractTypeID && contract.employeeID && contract.startDate && contract.endDate && contract.contractSalary && contract.insuranceSalary)

      if (contractsToCreate.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong file.')
        return
      }

      // Create contracts
      for (const contract of contractsToCreate) {
        await createContract(contract)
      }

      alert(`Đã nhập thành công ${contractsToCreate.length} hợp đồng lao động.`)
      file.value = null
      showImportModal.value = false
    } catch (error) {
      console.error('Lỗi khi xử lý file Excel:', error)
      alert('Định dạng file Excel không hợp lệ hoặc có lỗi xảy ra.')
    }
  }
  reader.readAsArrayBuffer(file.value)
}

// Delete confirmation dialog
const showDeleteModal = ref(false)
const contractToDelete = ref(null)

// Extend contract
const newStartDate = ref('')
const newEndDate = ref('')

const openAddContractForm = () => {
  selectedContractForm.value = null
  contractFormMode.value = 'create'
  showContractModal.value = true
}
const openUpdateForm = (id) => {
  const contract = contracts.value.find(c => c.id === id)
  selectedContractForm.value = contract
  contractFormMode.value = 'update'
  showContractModal.value = true
}
const closeContractModal = () => {
  showContractModal.value = false
  selectedContractForm.value = null
}
const handleContractSubmit = async (data) => {
  try {
    const formattedData = formatContractForSubmit(data)

    if (contractFormMode.value === 'create') {
      await createContract(formattedData)
      showMessage('Tạo hợp đồng thành công!', 'success')
    } else {
      await updateContract(formattedData)
      showMessage('Cập nhật hợp đồng thành công!', 'success')
    }

    closeContractModal()
  } catch (err) {
    console.error('Error submitting contract:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

// Delete contract functions
const confirmDeleteContract = (contract) => {
  contractToDelete.value = contract
  showDeleteModal.value = true
}

const deleteContract = async () => {
  try {
    if (contractToDelete.value) {
      await deleteContractFromStore(contractToDelete.value.id)
    }
    closeDeleteModal()
  } catch (err) {
    console.error('Error deleting contract:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  contractToDelete.value = null
}

// Status change functions
const showStatusModal = ref(false)
const contractToUpdateStatus = ref(null)

const openStatusDialog = (contract) => {
  contractToUpdateStatus.value = contract
  showStatusModal.value = true
}

// Validity status is now calculated based on date, no need for manual update

const closeStatusModal = () => {
  showStatusModal.value = false
  contractToUpdateStatus.value = null
}

// Create contract for employee without contract
const createContractForEmployee = (employee) => {
  selectedContractForm.value = {
    employeeID: employee.id,
    employeeName: employee.employeeName
  }
  contractFormMode.value = 'create'
  showContractModal.value = true
}

// Extend contract modal
const showExtendModal = ref(false)
const contractToExtend = ref(null)

const extendContract = (contract) => {
  contractToExtend.value = contract
  // Set current end date as default start date for new contract period
  newStartDate.value = contract.endDate
  newEndDate.value = ''
  showExtendModal.value = true
}

const handleExtendContract = async () => {
  try {
    if (contractToExtend.value && newStartDate.value && newEndDate.value) {
      const updatedContract = {
        ...contractToExtend.value,
        startDate: newStartDate.value,
        endDate: newEndDate.value
      }
      
      console.log('=== EXTEND CONTRACT DEBUG ===')
      console.log('Contract to extend:', contractToExtend.value)
      console.log('Updated contract before format:', updatedContract)
      
      const formattedData = formatContractForSubmit(updatedContract)
      await updateContract(formattedData)
      showMessage('Gia hạn hợp đồng thành công!', 'success')
    }
    closeExtendModal()
  } catch (err) {
    console.error('Error extending contract:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const closeExtendModal = () => {
  showExtendModal.value = false
  contractToExtend.value = null
  newStartDate.value = ''
  newEndDate.value = ''
}

// Terminate employee modal
const showTerminateModal = ref(false)
const employeeToTerminate = ref(null)

const terminateEmployee = (contract) => {
  employeeToTerminate.value = {
    ...contract,
    employeeID: contract.employeeID,
    employeeName: contract.employeeName
  }
  showTerminateModal.value = true
}

const handleTerminateEmployee = async () => {
  try {
    if (employeeToTerminate.value) {
      // Update contract end date to today to make it expired
      const contractToUpdate = {
        ...employeeToTerminate.value,
        endDate: new Date().toISOString().split('T')[0]
      }
      
      // Format the contract data properly for API submission
      const formattedData = formatContractForSubmit(contractToUpdate)
      await updateContract(formattedData)

      // Update employee status to resigned
      try {
        await employeeService.updateEmployeeStatus(employeeToTerminate.value.employeeID, 'Resigned')
        showMessage('Cho nhân viên nghỉ việc thành công! Hợp đồng đã chấm dứt và trạng thái nhân viên đã được cập nhật.', 'success')
      } catch (employeeError) {
        console.error('Error updating employee status:', employeeError)
        showMessage('Hợp đồng đã chấm dứt nhưng có lỗi khi cập nhật trạng thái nhân viên.', 'warning')
      }
    }
    closeTerminateModal()
  } catch (err) {
    console.error('Error terminating employee:', err)
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const closeTerminateModal = () => {
  showTerminateModal.value = false
  employeeToTerminate.value = null
}
</script>

<style scoped>
.contract-tabs .nav-link {
  min-width: 180px;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
}

.contract-tabs .nav-link.active {
  background: #e9ecef;
  border-bottom: 2px solid #0d6efd;
  color: #0d6efd;
}

.contract-tabs .badge {
  font-size: 0.95em;
  vertical-align: middle;
}

.card {
  border-radius: 0.75rem;
  border: none;
}

.card-body {
  padding: 0;
}

/* Date display styling */


/* Validity status styling */
.validity-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.validity-active {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
  border: 1px solid #c3e6cb;
  box-shadow: 0 2px 4px rgba(21, 87, 36, 0.1);
}

.validity-expired {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  border: 1px solid #f5c6cb;
  box-shadow: 0 2px 4px rgba(114, 28, 36, 0.1);
}

/* Days to expire styling */
.days-to-expire {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid;
}

.days-normal {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  color: #0c5460;
  border-color: #bee5eb;
}

.days-caution {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border-color: #ffeaa7;
}

.days-warning {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  border-color: #f5c6cb;
}

.days-expired {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border-color: #c82333;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Action button improvements */
.btn-icon {
  transition: all 0.3s ease;
}

.btn-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-icon.size-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .contract-tabs .nav-link {
    font-size: 0.95rem;
    min-width: 120px;
    padding: 0.5rem 0.5rem;
  }

  .card {
    border-radius: 0.5rem;
  }


  .validity-status,
  .days-to-expire {
    font-size: 0.8rem;
    padding: 3px 8px;
  }
}
</style>
