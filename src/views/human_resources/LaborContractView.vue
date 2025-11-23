<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0" data-tour="title">Quản lý hợp đồng lao động</h2>
      <div class="d-flex gap-2">
        <div v-if="activeTab === 'allContracts'" class="d-flex gap-2" data-tour="toolbar">
          <ActionButton 
            v-if="canCreate('personnel-contract')"
            type="primary" 
            icon="fas fa-plus me-2" 
            @click="openAddContractForm"
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
        <div v-else class="d-flex gap-2" data-tour="toolbar">
          <ActionButton type="warning" icon="fas fa-filter me-2" @click="showFilter = !showFilter">
            Lọc
          </ActionButton>
        </div>
      </div>
    </div>
    <TabBar :tabs="tabs" :activeTab="activeTab" @update:activeTab="activeTab = $event" data-tour="tabs" />
    
    <!-- Filter Section -->
    <transition name="slide-fade">
      <div class="filter-section mb-4" v-show="showFilter" data-tour="filter">
        <div class="row g-3">
          <div class="col-md-3">
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              :placeholder="activeTab === 'allContracts' ? 'Tìm kiếm theo số hợp đồng, tên nhân viên...' : 
                           activeTab === 'notCreated' ? 'Tìm kiếm theo mã, tên nhân viên, email...' : 
                           'Tìm kiếm theo mã nhân viên, tên nhân viên...'"
            >
          </div>
          <div v-if="activeTab === 'allContracts'" class="col-md-2">
            <select class="form-control" v-model="statusFilter">
              <option value="">Tất cả trạng thái duyệt</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
              <option value="Returned">Trả lại</option>
            </select>
          </div>
          <div v-if="activeTab === 'allContracts'" class="col-md-2">
            <select class="form-control" v-model="validityFilter">
              <option value="">Tất cả hiệu lực</option>
              <option value="Còn hiệu lực">Còn hiệu lực</option>
              <option value="Hết hiệu lực">Hết hiệu lực</option>
            </select>
          </div>
          <div v-if="activeTab === 'allContracts'" class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.start"
              placeholder="Từ ngày"
            >
          </div>
          <div v-if="activeTab === 'allContracts'" class="col-md-2">
            <input
              type="date"
              class="form-control"
              v-model="dateRange.end"
              placeholder="Đến ngày"
            >
          </div>
          <div :class="activeTab === 'allContracts' ? 'col-md-1' : 'col-md-9'">
            <button class="btn btn-secondary w-100" @click="resetFilters">
              <i class="fas fa-undo me-2"></i>Đặt lại
            </button>
          </div>
        </div>
      </div>
    </transition>
    
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <DataTable :columns="columnsByTab" :data="paginatedContracts" @cell-click="handleCellClick" data-tour="table">
          <template #actions="{ item }">
            <div class="d-flex justify-content-start gap-2">
              <!-- Tab: Tất cả hợp đồng -->
              <template v-if="activeTab === 'allContracts'">
                <ActionButton 
                  v-if="canEditItem('personnel-contract', item)"
                  type="success" 
                  icon="fas fa-pen-to-square" 
                  title="Sửa"
                  @click.stop="openUpdateForm(item.id)" 
                />
                <ActionButton 
                  v-if="canDeleteItem('personnel-contract', item)"
                  type="danger" 
                  icon="fas fa-trash" 
                  title="Xóa hợp đồng"
                  @click.stop="confirmDeleteContract(item)" 
                />
                <!-- Submit for approval button -->
                <ActionButton 
                  v-if="canSubmitItem('personnel-contract', item)" 
                  type="primary" 
                  @click.stop="handleSubmitForApproval(item.id)" 
                  icon="fas fa-paper-plane" 
                  title="Gửi duyệt"
                ></ActionButton>
                <!-- Approve button -->
                <ActionButton 
                  v-if="canApproveItem('personnel-contract', item)" 
                  type="success" 
                  @click.stop="openApprovalModal(item.id, 'approve')" 
                  icon="fas fa-check" 
                  title="Duyệt"
                ></ActionButton>
                <!-- Reject button -->
                <ActionButton 
                  v-if="canApproveItem('personnel-contract', item)" 
                  type="danger" 
                  @click.stop="openApprovalModal(item.id, 'reject')" 
                  icon="fas fa-times" 
                  title="Từ chối"
                ></ActionButton>
                <!-- Return button -->
                <ActionButton 
                  v-if="canApproveItem('personnel-contract', item)" 
                  type="warning" 
                  @click.stop="openApprovalModal(item.id, 'return')" 
                  icon="fas fa-undo" 
                  title="Trả lại"
                ></ActionButton>
              </template>

              <!-- Tab: Chưa lên hợp đồng -->
              <template v-else-if="activeTab === 'notCreated'">
                <ActionButton type="success" icon="fas fa-plus" title="Tạo hợp đồng"
                  @click.stop="createContractForEmployee(item)" size="sm" data-tour="create-button">
                </ActionButton>
              </template>

              <!-- Tab: Hợp đồng hết hạn -->
              <template v-else-if="activeTab === 'expired'">
                <div class="d-flex gap-1">
                  <ActionButton type="warning" icon="fas fa-calendar-plus" title="Gia hạn hợp đồng"
                    @click.stop="extendContract(item)" size="sm" data-tour="extend-button">

                  </ActionButton>
                  <ActionButton type="danger" icon="fas fa-user-times" title="Cho nghỉ việc"
                    @click.stop="terminateEmployee(item)" size="sm" data-tour="terminate-button">

                  </ActionButton>
                </div>
              </template>
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
    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted">
        Hiển thị {{ paginatedContracts.length }} trên {{ totalFilteredContracts }} hợp đồng
      </div>
      <Pagination :total-items="totalFilteredContracts" :items-per-page="itemsPerPage" :current-page="currentPage"
        @update:currentPage="handlePageChange" data-tour="pagination" />
    </div>
    <ModalDialog :show="showContractModal" title="Thêm/Cập nhật hợp đồng" size="xl" @update:show="closeContractModal">
      <div data-tour="create-form">
        <ContractForm :mode="contractFormMode" :contract="selectedContractForm" :employees="employees"
          @submit="handleContractSubmit" @close="closeContractModal" />
      </div>
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
    <ModalDialog :show="showExtendModal" title="Gia hạn hợp đồng" size="md" @update:show="closeExtendModal" data-tour="extend-modal">
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
      @update:show="closeTerminateModal" data-tour="terminate-modal">
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
    <ModalDialog v-model:show="showImportModal" title="Nhập hợp đồng lao động từ Excel" size="lg" data-tour="import-modal">
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

    <GlobalMessageModal />
    
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TabBar from '../../components/common/TabBar.vue'
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import ContractForm from '../../components/common/contract/ContractForm.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import ApprovalStatusLabel from '@/components/common/ApprovalStatusLabel.vue'
import ApprovalNoteModal from '@/components/common/ApprovalNoteModal.vue'
import ApprovalHistoryModal from '@/components/common/ApprovalHistoryModal.vue'
import ActionButton from '@/components/common/ActionButton.vue'
import TourGuide from '@/components/common/TourGuide.vue'
import AIChatbotButton from '@/components/common/AIChatbotButton.vue'
import { useContract } from '../../composables/useContract.js'
import { useEmployee } from '../../composables/useEmployee.js'
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'
import { usePermissions } from '../../composables/usePermissions.js'
import GlobalMessageModal from '@/components/common/GlobalMessageModal.vue'
import { contractService } from '../../services/contractService'
import { employeeService } from '../../services/employeeService'
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
  fetchAllContracts,
  calculateEmployeesWithoutContract,
  deleteContract: deleteContractFromStore,
  submitContractForApproval,
  approveContract,
  rejectContract,
  returnContract
} = useContract()
const { employees, fetchAllEmployees } = useEmployee()
const { showMessage } = useGlobalMessage()

// Router for navigation
const router = useRouter()

const { 
  canCreate, 
  canEditItem, 
  canDeleteItem,
  canSubmitItem,
  canApproveItem
} = usePermissions()

// Contract operations
const createContract = async (contractData) => {
  try {
    const response = await contractService.createContract(contractData)
    await fetchAllContracts()
    return response
  } catch (error) {
    throw error
  }
}

const updateContract = async (contractData) => {
  try {
    const response = await contractService.updateContract(contractData)
    await fetchAllContracts()
    return response
  } catch (error) {
    throw error
  }
}

const handleSubmitForApproval = (contractId) => {
  pendingContractId.value = contractId
  pendingAction.value = 'submit'
  showApprovalModal.value = true
}

// Approval modal states
const showApprovalModal = ref(false)
const pendingAction = ref('') // 'approve', 'reject', 'return', 'submit'
const pendingContractId = ref(null)

// Approval history modal states
const showHistoryModal = ref(false)
const historyRequestType = ref('')
const historyRequestId = ref('')

const openApprovalModal = (contractId, action) => {
  pendingContractId.value = contractId
  pendingAction.value = action
  showApprovalModal.value = true
}

const handleApprovalConfirm = async (notes) => {
  try {
    const contractId = pendingContractId.value
    const action = pendingAction.value
    
    switch (action) {
      case 'submit':
        await submitContractForApproval(contractId, notes)
        break
      case 'approve':
        await approveContract(contractId, notes)
        break
      case 'reject':
        await rejectContract(contractId, notes)
        break
      case 'return':
        await returnContract(contractId, notes)
        break
    }
    
    await fetchAllContracts()
    showApprovalModal.value = false
    pendingContractId.value = null
    pendingAction.value = ''
  } catch (error) {
    // Error handling is done by composable
  }
}

const handleApprovalCancel = () => {
  showApprovalModal.value = false
  pendingContractId.value = null
  pendingAction.value = ''
}

const getApprovalModalTitle = () => {
  const titles = {
    submit: 'Gửi duyệt hợp đồng',
    approve: 'Duyệt hợp đồng',
    reject: 'Từ chối hợp đồng',
    return: 'Trả lại hợp đồng'
  }
  return titles[pendingAction.value] || 'Nhập ghi chú'
}

const openHistoryModal = (item) => {
  historyRequestType.value = 'Contract'
  historyRequestId.value = item.id.toString()
  showHistoryModal.value = true
}

const handleUndoSuccess = async () => {
  await fetchAllContracts()
}

const formatContractForSubmit = (data) => {
  // Format data for API submission
  const formattedData = {
    contractNumber: data.contractNumber,
    contractTypeID: parseInt(data.contractTypeID),
    employeeID: data.employeeID,
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    contractSalary: parseFloat(data.contractSalary) || 0,
    insuranceSalary: parseFloat(data.insuranceSalary) || 0,
    approveStatus: parseInt(data.approveStatus) || 0,
    allowances: []
  }

  // Only add allowances if they exist and have valid data
  if (data.allowances && data.allowances.length > 0) {
    formattedData.allowances = data.allowances.map(allowance => ({
      contractID: parseInt(data.id) || 0, // ContractID is required for allowances
      allowanceID: parseInt(allowance.allowanceID),
      value: parseFloat(allowance.value) || 0
    }))
  }

  // Add ID for update operations (must be int)
  if (data.id) {
    formattedData.id = parseInt(data.id)
  }

  delete formattedData.contractTypeName
  delete formattedData.employeeName
  delete formattedData.validityStatus
  delete formattedData.daysToExpire
  delete formattedData.startDateFormatted
  delete formattedData.endDateFormatted

  return formattedData
}

onMounted(async () => {
  await Promise.all([
    fetchAllContracts(),
    fetchAllEmployees()
  ])
})

const contractsData = computed(() => {
  const today = new Date()
  return contracts.value.map((c, index) => {
    const end = new Date(c.endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    const validityStatus = end > today ? 'Còn hiệu lực' : 'Hết hiệu lực'
    const employee = employees.value.find(emp => emp.id === c.employeeID)
    const employeeStatus = employee ? employee.status : 'Unknown'

    return {
      ...c,
      stt: index + 1,
      daysToExpire: daysLeft,
      validityStatus,
      employeeStatus,
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

const expiredContracts = computed(() => {
  return contractsData.value.filter(c => 
    c.daysToExpire <= 10 && c.employeeStatus === 'Active'
  )
})

const notCreatedContracts = computed(() => {
  const employeesWithoutContractData = calculateEmployeesWithoutContract(employees.value)
  return employeesWithoutContractData.map((employee, index) => ({
    id: employee.id || employee.employeeID || `emp_${index}`,
    employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
    email: employee.email || '',
    phone: employee.phone || '',
    birthday: employee.birthday ? new Date(employee.birthday).toLocaleDateString('vi-VN') : '',
    joinDate: employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('vi-VN') : '',
    stt: index + 1
  }))
})

const contractColumns = [
  { key: 'contractNumber', label: 'Số hợp đồng' },
  { key: 'contractTypeName', label: 'Loại hợp đồng' },
  { key: 'id', label: 'Mã nhân viên', link: true },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'approveStatus', label: 'Trạng thái duyệt' },
  { key: 'validityStatus', label: 'Hiệu lực' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày hết hạn' },
]

const notCreatedColumns = [
  { key: 'id', label: 'Mã nhân viên', link: true },
  { key: 'employeeName', label: 'Tên nhân viên' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'birthday', label: 'Ngày sinh' },
  { key: 'joinDate', label: 'Ngày vào làm' },
]

const expiredColumns = [
  { key: 'employeeID', label: 'Mã nhân viên', link: true },
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
  if (activeTab.value === 'allContracts') return filteredContractsData.value.slice(start, end)
  if (activeTab.value === 'notCreated') return filteredNotCreatedContracts.value.slice(start, end)
  if (activeTab.value === 'expired') return filteredExpiredContracts.value.slice(start, end)
  return []
})

const totalFilteredContracts = computed(() => {
  if (activeTab.value === 'allContracts') return filteredContractsData.value.length
  if (activeTab.value === 'notCreated') return filteredNotCreatedContracts.value.length
  if (activeTab.value === 'expired') return filteredExpiredContracts.value.length
  return 0
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

// Handle cell click for navigation
const handleCellClick = (item, column) => {
  if (column.link && (column.key === 'id' || column.key === 'employeeID')) {
    // Navigate to employee profile
    const employeeId = item.id || item.employeeID
    router.push({ name: 'employee-profile', params: { employeeId } })
  }
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

const getExportConfig = () => {
  const configs = {
    allContracts: {
      sheetName: 'LaborContracts',
      data: contractsData.value,
      columns: contractColumns,
      fileName: 'LaborContracts.xlsx'
    },
    notCreated: {
      sheetName: 'EmployeesWithoutContract',
      data: notCreatedContracts.value,
      columns: notCreatedColumns,
      fileName: 'EmployeesWithoutContract.xlsx'
    },
    expired: {
      sheetName: 'ExpiredContracts',
      data: expiredContracts.value,
      columns: expiredColumns,
      fileName: 'ExpiredContracts.xlsx'
    }
  }
  return configs[activeTab.value] || configs.allContracts
}

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook()
  const config = getExportConfig()
  const worksheet = workbook.addWorksheet(config.sheetName)

  worksheet.columns = config.columns.map(c => ({ header: c.label, key: c.key, width: 15 }))

  config.data.forEach(row => {
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
  saveAs(new Blob([buf]), config.fileName)
}

const showContractModal = ref(false)
const selectedContractForm = ref(null)
const contractFormMode = ref('create')
const showFilter = ref(false)
const showImportModal = ref(false)
const showTourGuide = ref(false)

// Filter variables
const searchQuery = ref('')
const statusFilter = ref('')
const validityFilter = ref('')
const dateRange = ref({
  start: null,
  end: null
})

const filteredContractsData = computed(() => {
  let result = [...contractsData.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(contract =>
      contract.id?.toString().includes(query) ||
      contract.contractNumber?.toLowerCase().includes(query) ||
      contract.employeeName?.toLowerCase().includes(query) ||
      contract.contractTypeName?.toLowerCase().includes(query)
    )
  }

  // Apply status filter (approve status)
  if (statusFilter.value) {
    const statusMap = {
      'Pending': 1,
      'Approved': 2,
      'Rejected': 3,
      'Returned': 4
    }
    const statusValue = statusMap[statusFilter.value]
    if (statusValue) {
      result = result.filter(contract => contract.approveStatus === statusValue)
    }
  }

  // Apply validity filter
  if (validityFilter.value) {
    result = result.filter(contract => contract.validityStatus === validityFilter.value)
  }

  // Apply date range filter (start date)
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)

    result = result.filter(contract => {
      const contractDate = new Date(contract.startDate)
      return contractDate >= start && contractDate <= end
    })
  }

  return result
})

const filteredNotCreatedContracts = computed(() => {
  let result = [...notCreatedContracts.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(emp =>
      emp.id?.toString().includes(query) ||
      emp.employeeName?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.phone?.toLowerCase().includes(query)
    )
  }

  return result
})

const filteredExpiredContracts = computed(() => {
  let result = [...expiredContracts.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(contract =>
      contract.employeeID?.toString().includes(query) ||
      contract.employeeName?.toLowerCase().includes(query) ||
      contract.contractNumber?.toLowerCase().includes(query) ||
      contract.contractTypeName?.toLowerCase().includes(query)
    )
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  validityFilter.value = ''
  dateRange.value = { start: null, end: null }
  currentPage.value = 1
}

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

  applyHeaderStyle(dataSheet.getRow(1))

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

  applyHeaderStyle(contractTypeSheet.getRow(1))

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

      await Promise.all(contractsToCreate.map(contract => createContract(contract)))

      alert(`Đã nhập thành công ${contractsToCreate.length} hợp đồng lao động.`)
      file.value = null
      showImportModal.value = false
    } catch (error) {
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
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  contractToDelete.value = null
}

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
      
      const formattedData = formatContractForSubmit(updatedContract)
      await updateContract(formattedData)
      showMessage('Gia hạn hợp đồng thành công!', 'success')
    }
    closeExtendModal()
  } catch (err) {
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
      await employeeService.updateEmployeeStatus(employeeToTerminate.value.employeeID, 'Resigned')
      showMessage('Cho nhân viên nghỉ việc thành công! Trạng thái nhân viên đã được cập nhật.', 'success')
      await fetchAllEmployees()
    }
    closeTerminateModal()
  } catch (err) {
    showMessage(`Lỗi: ${err.message}`, 'error')
  }
}

const closeTerminateModal = () => {
  showTerminateModal.value = false
  employeeToTerminate.value = null
}

// Tour Guide Steps
const allContractsTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Tôi là trợ lý robot hướng dẫn của bạn. Đây là tab "Hợp đồng lao động". Tại đây bạn có thể xem, tạo, và quản lý tất cả hợp đồng lao động của nhân viên.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Hợp đồng lao động". Có 3 tab: Hợp đồng lao động, Chưa lên hợp đồng, và Hợp đồng hết hạn.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ với các chức năng chính. Hãy để tôi giới thiệu từng nút cho bạn!'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form thêm/sửa hợp đồng lao động. Bạn có thể chọn nhân viên, loại hợp đồng, ngày bắt đầu, ngày kết thúc, lương hợp đồng, lương bảo hiểm và các phụ cấp. Sau khi điền đầy đủ, bấm "Lưu" để lưu hợp đồng.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Lọc" cho phép bạn tìm kiếm và lọc hợp đồng theo số hợp đồng, tên nhân viên, trạng thái duyệt, hiệu lực và khoảng thời gian.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(2)'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm theo số hợp đồng, tên nhân viên. Chọn trạng thái duyệt và hiệu lực từ dropdown. Chọn khoảng thời gian từ ngày đến ngày. Bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Xuất Excel" cho phép bạn xuất danh sách hợp đồng ra file Excel.'
  },
  {
    target: '[data-tour="import-modal"]',
    message: 'Đây là modal nhập Excel. Bạn có thể tải file mẫu, điền thông tin hợp đồng vào file Excel, sau đó chọn file và bấm "Xử lý" để import vào hệ thống.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:nth-child(4)'
    }
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Nút "Hướng dẫn" (nút này) sẽ mở lại tour hướng dẫn để bạn xem lại các tính năng bất cứ lúc nào.'
  },
  {
    target: '[data-tour="table"]',
    message: 'Đây là bảng danh sách hợp đồng lao động. Bạn có thể xem thông tin chi tiết của từng hợp đồng. Click vào mã nhân viên để xem hồ sơ nhân viên. Cột "Thao tác" chứa các nút để sửa, xóa, gửi duyệt, duyệt, từ chối hoặc trả lại hợp đồng.'
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều hợp đồng hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Hợp đồng lao động"!',
    action: {
      type: 'function',
      func: async () => {
        if (showImportModal.value) {
          showImportModal.value = false
        }
        if (showContractModal.value) {
          showContractModal.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
]

const notCreatedTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Đây là tab "Chưa lên hợp đồng". Tại đây bạn có thể xem danh sách nhân viên chưa có hợp đồng lao động và tạo hợp đồng cho họ.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Chưa lên hợp đồng".'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ. Nút "Lọc" cho phép bạn ẩn/hiện phần bộ lọc để tìm kiếm nhân viên.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm nhân viên theo mã, tên, email hoặc số điện thoại. Bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="table"]',
    message: 'Đây là bảng danh sách nhân viên chưa có hợp đồng. Bạn có thể xem thông tin cơ bản của từng nhân viên. Click vào mã nhân viên để xem hồ sơ nhân viên.'
  },
  {
    target: '[data-tour="create-form"]',
    message: 'Đây là form tạo hợp đồng lao động. Khi bạn click vào nút "+" ở cột thao tác, form này sẽ mở với thông tin nhân viên đã được điền sẵn. Bạn chỉ cần chọn loại hợp đồng, ngày bắt đầu, ngày kết thúc và các thông tin khác.',
    action: {
      type: 'function',
      func: async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        const createBtn = document.querySelector('[data-tour="create-button"]')
        if (createBtn) {
          createBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều nhân viên hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Chưa lên hợp đồng"!',
    action: {
      type: 'function',
      func: async () => {
        if (showContractModal.value) {
          showContractModal.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
]

const expiredTourSteps = [
  {
    target: '[data-tour="title"]',
    message: 'Xin chào! Đây là tab "Hợp đồng hết hạn". Tại đây bạn có thể xem danh sách hợp đồng sắp hết hạn hoặc đã hết hạn và thực hiện các thao tác như gia hạn hợp đồng hoặc cho nhân viên nghỉ việc.'
  },
  {
    target: '[data-tour="tabs"]',
    message: 'Đây là các tab để chuyển đổi giữa các chức năng. Hiện tại bạn đang ở tab "Hợp đồng hết hạn".'
  },
  {
    target: '[data-tour="toolbar"]',
    message: 'Đây là thanh công cụ. Nút "Lọc" cho phép bạn ẩn/hiện phần bộ lọc để tìm kiếm hợp đồng.',
    action: {
      type: 'click',
      selector: '[data-tour="toolbar"] button:first-child'
    }
  },
  {
    target: '[data-tour="filter"]',
    message: 'Đây là phần bộ lọc. Bạn có thể tìm kiếm hợp đồng theo mã nhân viên, tên nhân viên, số hợp đồng hoặc loại hợp đồng. Bấm "Đặt lại" để xóa bộ lọc.'
  },
  {
    target: '[data-tour="table"]',
    message: 'Đây là bảng danh sách hợp đồng hết hạn. Bạn có thể xem thông tin chi tiết của từng hợp đồng, bao gồm số ngày đến hạn. Click vào mã nhân viên để xem hồ sơ nhân viên.'
  },
  {
    target: '[data-tour="extend-modal"]',
    message: 'Đây là modal gia hạn hợp đồng. Khi bạn click vào nút "Gia hạn hợp đồng", modal này sẽ mở. Bạn có thể chọn ngày bắt đầu mới và ngày hết hạn mới cho hợp đồng. Sau đó bấm "Gia hạn" để lưu.',
    action: {
      type: 'function',
      func: async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        const extendBtn = document.querySelector('[data-tour="extend-button"]')
        if (extendBtn) {
          extendBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="terminate-modal"]',
    message: 'Đây là modal cho nhân viên nghỉ việc. Khi bạn click vào nút "Cho nghỉ việc", modal này sẽ mở. Bạn có thể xác nhận để chấm dứt hợp đồng và thay đổi trạng thái nhân viên thành "Nghỉ việc".',
    action: {
      type: 'function',
      func: async () => {
        if (showExtendModal.value) {
          showExtendModal.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        const terminateBtn = document.querySelector('[data-tour="terminate-button"]')
        if (terminateBtn) {
          terminateBtn.click()
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    }
  },
  {
    target: '[data-tour="pagination"]',
    message: 'Phần phân trang ở cuối trang cho phép bạn chuyển đổi giữa các trang để xem nhiều hợp đồng hơn. Đó là tất cả những gì tôi muốn giới thiệu với bạn về tab "Hợp đồng hết hạn"!',
    action: {
      type: 'function',
      func: async () => {
        if (showTerminateModal.value) {
          showTerminateModal.value = false
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
]

const tourSteps = computed(() => {
  switch (activeTab.value) {
    case 'allContracts':
      return allContractsTourSteps
    case 'notCreated':
      return notCreatedTourSteps
    case 'expired':
      return expiredTourSteps
    default:
      return allContractsTourSteps
  }
})

const handleTourComplete = () => {
  showTourGuide.value = false
}

const startTour = () => {
  // Mở filter section nếu chưa mở (cho tất cả các tab)
  if (!showFilter.value) {
    showFilter.value = true
  }
  // Đợi một chút để UI render xong
  setTimeout(() => {
    showTourGuide.value = true
  }, 300)
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

