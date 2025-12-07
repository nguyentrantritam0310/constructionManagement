<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import LeaveForm from '../../components/common/leave/LeaveForm.vue'
import OvertimeForm from '../../components/common/overtime/OvertimeForm.vue'
import { useEmployee } from '../../composables/useEmployee'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useLeaveType } from '../../composables/useLeaveType'
import { useWorkShift } from '../../composables/useWorkShift'
import { useOvertimeType } from '../../composables/useOvertimeType'
import { useOvertimeForm } from '../../composables/useOvertimeForm'
import { useEmployeeRequest } from '../../composables/useEmployeeRequest'
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import { isApprovedStatus } from '../../constants/status.js'
import ActionButton from '@/components/common/ActionButton.vue'

// Composables
const { employees, fetchAllEmployees, loading: employeeLoading, error: employeeError } = useEmployee()
const { leaveRequests, fetchLeaveRequests, loading: leaveLoading, error: leaveError } = useLeaveRequest()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { overtimeTypes, fetchOvertimeTypes } = useOvertimeType()
const { overtimeForms, fetchOvertimeForms } = useOvertimeForm()
const { fetchEmployeeRequests, loading: requestLoading, error: requestError } = useEmployeeRequest()
const { overtimeRequests, fetchOvertimeRequests, loading: overtimeLoading, error: overtimeError } = useOvertimeRequest()

const loading = computed(() => employeeLoading.value || leaveLoading.value || requestLoading.value || overtimeLoading.value)
const error = computed(() => employeeError.value || leaveError.value || requestError.value || overtimeError.value)

const activeTab = ref('annual')
const tabs = [
  { key: 'annual', label: 'Phép năm quy định' },
  { key: 'otLeave', label: 'Phép bù tăng ca' }
]

// Year filter
const selectedYear = ref(new Date().getFullYear())
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
})

// ----------- Phép năm quy định -----------
// Computed columns with dynamic year
const leaveColumns = computed(() => [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `month${i + 1}`,
    label: `${i + 1 < 10 ? '0' : ''}${i + 1}/${selectedYear.value}`
  })),
  { key: 'joinDate', label: 'Ngày vào làm' },
  { key: 'leavePolicy', label: 'Phép năm quy định' },
  { key: 'seniorityLeave', label: 'Phép thâm niên' },
  { key: 'totalLeave', label: 'Tổng số phép năm' },
  { key: 'totalUsed', label: 'Tổng ngày đã nghỉ' },
  { key: 'leaveRemain', label: 'Số phép còn lại' },
  { key: 'seniorityDate', label: 'Ngày thâm niên' }
])

// Function to calculate seniority leave (1 day for every 5 years)
const calculateSeniorityLeave = (joinDate) => {
  if (!joinDate) return 0
  const join = new Date(joinDate)
  const current = new Date()
  const yearsWorked = current.getFullYear() - join.getFullYear()
  return Math.floor(yearsWorked / 5)
}

const calculateDaysBetween = (startDate, endDate) => {
  return Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1
}

const calculateTotalUsedLeave = (employeeId) => {
  if (!leaveRequests.value?.length) return 0
  
  return leaveRequests.value
    .filter(request => 
      request.employeeID === employeeId && 
      isApprovedStatus(request.approveStatus)
    )
    .reduce((total, request) => {
      const requestYear = new Date(request.startDateTime).getFullYear()
      if (requestYear === selectedYear.value) {
        return total + calculateDaysBetween(request.startDateTime, request.endDateTime)
      }
      return total
    }, 0)
}

const getLeaveDaysByMonth = (employeeId, month) => {
  if (!leaveRequests.value?.length) return 0
  
  return leaveRequests.value
    .filter(request => 
      request.employeeID === employeeId && 
      isApprovedStatus(request.approveStatus)
    )
    .reduce((total, request) => {
      const fromDate = new Date(request.startDateTime)
      const requestMonth = fromDate.getMonth() + 1
      const requestYear = fromDate.getFullYear()
      
      if (requestMonth === month && requestYear === selectedYear.value) {
        return total + calculateDaysBetween(request.startDateTime, request.endDateTime)
      }
      return total
    }, 0)
}

const isActiveEmployee = (emp) => {
  return emp.status === 0 || emp.status === '0' || emp.status === 'Active' || emp.status === null || emp.status === undefined
}

const leaveData = computed(() => {
  if (!employees.value?.length) return []
  
  const activeEmployees = employees.value.filter(isActiveEmployee)
  const employeesToProcess = activeEmployees.length > 0 ? activeEmployees : employees.value
  
  return employeesToProcess.map(employee => {
    const joinDate = new Date(employee.joinDate)
    const seniorityLeave = calculateSeniorityLeave(employee.joinDate)
    const totalUsed = calculateTotalUsedLeave(employee.id)
    const totalLeave = 12 + seniorityLeave
    
    const monthData = {}
    for (let i = 1; i <= 12; i++) {
      monthData[`month${i}`] = getLeaveDaysByMonth(employee.id, i)
    }
    
    return {
      empId: employee.id,
      empCode: employee.id,
      empName: `${employee.firstName} ${employee.lastName}`,
      ...monthData,
      joinDate: joinDate.toLocaleDateString('vi-VN'),
      leavePolicy: 12,
      seniorityLeave,
      totalLeave,
      totalUsed,
      leaveRemain: Math.max(0, totalLeave - totalUsed),
      seniorityDate: joinDate.toLocaleDateString('vi-VN'),
      employeeId: employee.id
    }
  })
})

const annualCurrentPage = ref(1)
const annualItemsPerPage = ref(8)
const paginatedLeaveData = computed(() => {
  if (!leaveData.value || leaveData.value.length === 0) {
    return []
  }
  const start = (annualCurrentPage.value - 1) * annualItemsPerPage.value
  return leaveData.value.slice(start, start + annualItemsPerPage.value)
})

// ----------- Phép bù tăng ca -----------
const otLeaveColumns = computed(() => [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `month${i + 1}`,
    label: `${i + 1 < 10 ? '0' : ''}${i + 1}/${selectedYear.value}`
  })),
  { key: 'totalOTHours', label: 'Tổng giờ tăng ca' },
  { key: 'otLeaveDays', label: 'Số ngày phép bù' },
  { key: 'otLeaveUsed', label: 'Đã nghỉ phép bù' },
  { key: 'otLeaveRemain', label: 'Phép bù còn lại' }
])

const isOvertimeLeaveCompensation = (request) => {
  return request.overtimeFormID === 2
}

const calculateTotalOTDays = (employeeId) => {
  if (!overtimeRequests.value?.length) return 0
  
  return overtimeRequests.value
    .filter(request => 
      request.employeeID === employeeId && 
      isApprovedStatus(request.approveStatus) &&
      isOvertimeLeaveCompensation(request)
    )
    .reduce((total, request) => {
      const requestYear = new Date(request.startDateTime).getFullYear()
      if (requestYear === selectedYear.value) {
        return total + calculateDaysBetween(request.startDateTime, request.endDateTime)
      }
      return total
    }, 0)
}

const getOTDaysByMonth = (employeeId, month) => {
  if (!overtimeRequests.value?.length) return 0
  
  return overtimeRequests.value
    .filter(request => 
      request.employeeID === employeeId && 
      isApprovedStatus(request.approveStatus) &&
      isOvertimeLeaveCompensation(request)
    )
    .reduce((total, request) => {
      const fromDate = new Date(request.startDateTime)
      const requestMonth = fromDate.getMonth() + 1
      const requestYear = fromDate.getFullYear()
      
      if (requestMonth === month && requestYear === selectedYear.value) {
        return total + calculateDaysBetween(request.startDateTime, request.endDateTime)
      }
      return total
    }, 0)
}

const calculateTotalOTHours = (employeeId) => {
  if (!overtimeRequests.value?.length) return 0
  
  return overtimeRequests.value
    .filter(request => 
      request.employeeID === employeeId && 
      isApprovedStatus(request.approveStatus) &&
      isOvertimeLeaveCompensation(request)
    )
    .reduce((total, request) => {
      const requestYear = new Date(request.startDateTime).getFullYear()
      if (requestYear === selectedYear.value) {
        return total + Math.ceil((new Date(request.endDateTime) - new Date(request.startDateTime)) / (1000 * 60 * 60))
      }
      return total
    }, 0)
}

const otLeaveData = computed(() => {
  if (!employees.value?.length) return []
  
  const activeEmployees = employees.value.filter(isActiveEmployee)
  const employeesToProcess = activeEmployees.length > 0 ? activeEmployees : employees.value
  
  return employeesToProcess.map(employee => {
    const totalOTDays = calculateTotalOTDays(employee.id)
    const totalOTHours = calculateTotalOTHours(employee.id)
    
    const monthData = {}
    for (let i = 1; i <= 12; i++) {
      monthData[`month${i}`] = getOTDaysByMonth(employee.id, i)
    }
    
    return {
      empId: employee.id,
      empCode: employee.employeeCode,
      empName: `${employee.firstName} ${employee.lastName}`,
      ...monthData,
      totalOTHours,
      otLeaveDays: totalOTDays,
      otLeaveUsed: totalOTDays,
      otLeaveRemain: 0,
      employeeId: employee.id
    }
  })
})

const otCurrentPage = ref(1)
const otItemsPerPage = ref(8)
const paginatedOtLeaveData = computed(() => {
  if (!otLeaveData.value || otLeaveData.value.length === 0) {
    return []
  }
  const start = (otCurrentPage.value - 1) * otItemsPerPage.value
  return otLeaveData.value.slice(start, start + otItemsPerPage.value)
})

// ----------- Modal phiếu nghỉ phép -----------
// Dùng chung cho cả hai tab
const showModal = ref(false)
const modalMonth = ref(null)
const modalEmployee = ref(null)
const modalType = ref('annual') // 'annual' hoặc 'otLeave'
const modalField = ref('month') // 'month' hoặc 'totalUsed' hoặc 'otLeaveUsed'

// ----------- Modal LeaveForm và OvertimeForm -----------
const showLeaveFormModal = ref(false)
const showOvertimeFormModal = ref(false)
const selectedLeaveRequest = ref(null)
const selectedOvertimeRequest = ref(null)
const currentUser = ref({}) // Mock current user for forms

const leaveTicketColumns = [
  { key: 'ticketId', label: 'Mã phiếu' },
  { key: 'empName', label: 'Họ tên' },
  { key: 'fromDate', label: 'Từ ngày' },
  { key: 'toDate', label: 'Đến ngày' },
  { key: 'days', label: 'Số ngày nghỉ' },
  { key: 'reason', label: 'Lý do' }
]


function openLeaveModal(emp, month, type = 'annual', field = 'month') {
  modalEmployee.value = emp
  modalMonth.value = month
  modalType.value = type
  modalField.value = field
  showModal.value = true
}

const openLeaveFormModal = (voucherCode) => {
  if (!voucherCode) return
  
  const leaveRequest = leaveRequests.value.find(leave => leave.voucherCode === voucherCode)
  
  if (leaveRequest) {
    selectedLeaveRequest.value = leaveRequest
    showLeaveFormModal.value = true
  }
}

function closeLeaveFormModal() {
  showLeaveFormModal.value = false
  selectedLeaveRequest.value = null
}

const openOvertimeFormModal = (voucherCode) => {
  if (!voucherCode) return
  
  const overtimeRequest = overtimeRequests.value.find(overtime => overtime.voucherCode === voucherCode)
  
  if (overtimeRequest) {
    selectedOvertimeRequest.value = overtimeRequest
    showOvertimeFormModal.value = true
  }
}

function closeOvertimeFormModal() {
  showOvertimeFormModal.value = false
  selectedOvertimeRequest.value = null
}

const mapRequestToTicket = (request, empName, defaultReason) => ({
  ticketId: request.voucherCode,
  empName,
  fromDate: new Date(request.startDateTime).toLocaleDateString('vi-VN'),
  toDate: new Date(request.endDateTime).toLocaleDateString('vi-VN'),
  days: calculateDaysBetween(request.startDateTime, request.endDateTime),
  reason: request.reason || defaultReason
})

const getTickets = (empId, month, type, field) => {
  if (type === 'annual') {
    if (!leaveData.value?.length || !leaveRequests.value?.length) return []
    
    const employee = leaveData.value.find(emp => emp.empId === empId)
    if (!employee) return []
    
    const employeeLeaveRequests = leaveRequests.value.filter(request => 
      request.employeeID === employee.employeeId && 
      isApprovedStatus(request.approveStatus)
    )
    
    if (field === 'month' && typeof month === 'number') {
      return employeeLeaveRequests
        .filter(request => {
          const fromDate = new Date(request.startDateTime)
          return fromDate.getMonth() + 1 === month && fromDate.getFullYear() === selectedYear.value
        })
        .map(request => mapRequestToTicket(request, employee.empName, 'Nghỉ phép cá nhân'))
    }
    
    if (field === 'totalUsed') {
      return employeeLeaveRequests
        .filter(request => new Date(request.startDateTime).getFullYear() === selectedYear.value)
        .map(request => mapRequestToTicket(request, employee.empName, 'Nghỉ phép cá nhân'))
    }
  }
  
  if (type === 'otLeave') {
    if (!otLeaveData.value?.length || !overtimeRequests.value?.length) return []
    
    const employee = otLeaveData.value.find(emp => emp.empId === empId)
    if (!employee) return []
    
    const employeeOTRequests = overtimeRequests.value.filter(request => 
      request.employeeID === employee.employeeId && 
      isApprovedStatus(request.approveStatus) &&
      isOvertimeLeaveCompensation(request)
    )
    
    if (field === 'month' && typeof month === 'number') {
      return employeeOTRequests
        .filter(request => {
          const fromDate = new Date(request.startDateTime)
          return fromDate.getMonth() + 1 === month && fromDate.getFullYear() === selectedYear.value
        })
        .map(request => mapRequestToTicket(request, employee.empName, 'Nghỉ bù tăng ca'))
    }
    
    if (field === 'otLeaveUsed') {
      return employeeOTRequests
        .filter(request => new Date(request.startDateTime).getFullYear() === selectedYear.value)
        .map(request => mapRequestToTicket(request, employee.empName, 'Nghỉ bù tăng ca'))
    }
  }
  
  return []
}


onMounted(async () => {
  try {
    await Promise.allSettled([
      fetchAllEmployees(),
      fetchLeaveRequests(),
      fetchLeaveTypes(),
      fetchWorkShifts(),
      fetchOvertimeTypes(),
      fetchOvertimeForms(),
      fetchEmployeeRequests(),
      fetchOvertimeRequests()
    ])
  } catch (error) {
    // Error handling is done by composables
  }
})

const reloadData = async () => {
  try {
    await Promise.allSettled([
      fetchAllEmployees(),
      fetchLeaveRequests(),
      fetchLeaveTypes(),
      fetchWorkShifts(),
      fetchOvertimeTypes(),
      fetchOvertimeForms(),
      fetchEmployeeRequests(),
      fetchOvertimeRequests()
    ])
  } catch (error) {
    // Error handling is done by composables
  }
}

</script>

<template>
  <div class="container-fluid py-4" data-tour="title">
    <div class="leave-tabs-bar mb-3" data-tour="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-bar-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <!-- Year Filter -->
    <div class="d-flex justify-content-between align-items-center mb-3" data-tour="year-filter">
      <div class="d-flex align-items-center gap-3">
        <label class="form-label mb-0 fw-bold">Năm:</label>
        <select v-model="selectedYear" class="form-select" style="width: 120px;">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      <div class="text-muted">
        <i class="fas fa-calendar-alt me-2"></i>
        Dữ liệu phép năm {{ selectedYear }}
      </div>
    </div>
    

    <div v-if="activeTab === 'annual'">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải dữ liệu phép năm...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>
      
      <!-- Data Table -->
      <div v-else-if="leaveData && leaveData.length > 0" class="table-responsive leave-table">
        <DataTable :columns="leaveColumns" :data="paginatedLeaveData" data-tour="table-annual">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item && item[`month${i}`] > 0"
              class="leave-cell clickable"
              @click.stop="openLeaveModal(item.empId, i, 'annual', 'month')"
              title="Xem phiếu nghỉ phép"
              data-tour="month-cell"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell" data-tour="month-cell">{{ item ? item[`month${i}`] : 0 }}</span>
          </template>
          <template #empCode="{ item }">
            <span class="emp-id">{{ item?.empCode || '' }}</span>
          </template>
          <template #joinDate="{ item }">
            <span class="join-date">{{ item?.joinDate || '' }}</span>
          </template>
          <template #leavePolicy="{ item }">
            <span class="leave-policy">{{ item?.leavePolicy || 0 }}</span>
          </template>
          <template #seniorityLeave="{ item }">
            <span class="seniority-leave">{{ item?.seniorityLeave || 0 }}</span>
          </template>
          <template #totalLeave="{ item }">
            <span class="total-leave">{{ item?.totalLeave || 0 }}</span>
          </template>
          <template #totalUsed="{ item }">
            <span
              class="total-used clickable"
              @click.stop="item && openLeaveModal(item.empId, 'total', 'annual', 'totalUsed')"
              title="Xem tất cả phiếu nghỉ phép năm"
              data-tour="total-used"
            >
              {{ item?.totalUsed || 0 }}
            </span>
          </template>
          <template #leaveRemain="{ item }">
            <span class="leave-remain">{{ item?.leaveRemain || 0 }}</span>
          </template>
          <template #seniorityDate="{ item }">
            <span class="seniority-date">{{ item?.seniorityDate || '' }}</span>
          </template>
        </DataTable>
      </div>
      <Pagination
        v-if="!loading && !error && leaveData && leaveData.length > 0"
        :totalItems="leaveData.length"
        :itemsPerPage="annualItemsPerPage"
        :currentPage="annualCurrentPage"
        @update:currentPage="annualCurrentPage = $event"
        data-tour="pagination-annual"
      />
      
      <!-- No Data State -->
      <div v-else class="text-center py-4">
        <i class="fas fa-info-circle text-muted" style="font-size: 3rem;"></i>
        <p class="mt-3 text-muted">Không có dữ liệu phép năm để hiển thị</p>
      </div>
    </div>
    <div v-else-if="activeTab === 'otLeave'">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
        <p class="mt-2">Đang tải dữ liệu phép bù tăng ca...</p>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        {{ error }}
      </div>
      
      <!-- Data Table -->
      <div v-else-if="otLeaveData && otLeaveData.length > 0" class="table-responsive leave-table">
        <DataTable :columns="otLeaveColumns" :data="paginatedOtLeaveData" data-tour="table-otLeave">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item && item[`month${i}`] > 0"
              class="leave-cell leave-ot clickable"
              @click.stop="openLeaveModal(item.empId, i, 'otLeave', 'month')"
              title="Xem phiếu phép bù tăng ca"
              data-tour="month-cell-ot"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell" data-tour="month-cell-ot">{{ item ? item[`month${i}`] : 0 }}</span>
          </template>
          <template #empCode="{ item }">
            <span class="emp-id">{{ item?.empCode || '' }}</span>
          </template>
          <template #totalOTHours="{ item }">
            <span class="ot-hours">{{ item?.totalOTHours || 0 }}</span>
          </template>
          <template #otLeaveDays="{ item }">
            <span class="ot-leave-days">{{ item?.otLeaveDays || 0 }}</span>
          </template>
          <template #otLeaveUsed="{ item }">
            <span
              class="ot-leave-used clickable"
              @click.stop="item && openLeaveModal(item.empId, 'total', 'otLeave', 'otLeaveUsed')"
              title="Xem tất cả phiếu phép bù tăng ca"
              data-tour="ot-leave-used"
            >
              {{ item?.otLeaveUsed || 0 }}
            </span>
          </template>
          <template #otLeaveRemain="{ item }">
            <span class="ot-leave-remain">{{ item?.otLeaveRemain || 0 }}</span>
          </template>
        </DataTable>
      </div>
      <Pagination
        v-if="!loading && !error && otLeaveData && otLeaveData.length > 0"
        :totalItems="otLeaveData.length"
        :itemsPerPage="otItemsPerPage"
        :currentPage="otCurrentPage"
        @update:currentPage="otCurrentPage = $event"
        data-tour="pagination-otLeave"
      />
      
      <!-- No Data State -->
      <div v-else class="text-center py-4">
        <i class="fas fa-info-circle text-muted" style="font-size: 3rem;"></i>
        <p class="mt-3 text-muted">Không có dữ liệu phép bù tăng ca để hiển thị</p>
      </div>
    </div>
    <ModalDialog
      v-model:show="showModal"
      :title="modalType === 'annual'
        ? (modalField === 'month'
            ? `Phiếu nghỉ phép năm ${selectedYear} - ${modalEmployee} tháng ${modalMonth}`
            : `Tất cả phiếu nghỉ phép năm ${selectedYear} - ${modalEmployee}`)
        : (modalField === 'month'
            ? `Phiếu phép bù tăng ca năm ${selectedYear} - ${modalEmployee} tháng ${modalMonth}`
            : `Tất cả phiếu phép bù tăng ca năm ${selectedYear} - ${modalEmployee}`)"
      size="xl"
      scrollable
      data-tour="modal-detail"
    >
      <div class="modal-leave-table">
        <DataTable
          :columns="leaveTicketColumns"
          :data="getTickets(modalEmployee, modalMonth, modalType, modalField)"
        >
          <template #ticketId="{ item }">
            <span 
              v-if="modalType === 'annual'"
              class="ticket-id voucher-code-link text-primary cursor-pointer"
              @click="openLeaveFormModal(item.ticketId)"
              :title="'Click để xem chi tiết phiếu nghỉ phép'"
              data-tour="modal-ticket"
            >
              <i class="fas fa-file-alt me-1"></i>
              {{ item.ticketId }}
            </span>
            <span 
              v-else-if="modalType === 'otLeave'"
              class="ticket-id voucher-code-link text-success cursor-pointer"
              @click="openOvertimeFormModal(item.ticketId)"
              :title="'Click để xem chi tiết phiếu tăng ca'"
              data-tour="modal-ticket"
            >
              <i class="fas fa-clock me-1"></i>
              {{ item.ticketId }}
            </span>
            <span v-else class="ticket-id" data-tour="modal-ticket">{{ item.ticketId }}</span>
          </template>
          <template #empName="{ item }">
            <span class="ticket-name">{{ item.empName }}</span>
          </template>
          <template #fromDate="{ item }">
            <span class="ticket-date">{{ item.fromDate }}</span>
          </template>
          <template #toDate="{ item }">
            <span class="ticket-date">{{ item.toDate }}</span>
          </template>
          <template #days="{ item }">
            <span class="ticket-days">{{ item.days }}</span>
          </template>
          <template #reason="{ item }">
            <span class="ticket-reason">{{ item.reason }}</span>
          </template>
        </DataTable>
      </div>
    </ModalDialog>
    
    <!-- ModalDialog cho LeaveForm -->
    <ModalDialog :show="showLeaveFormModal" title="Chi tiết phiếu nghỉ phép" size="lg" scrollable
      @update:show="showLeaveFormModal = $event">
      <LeaveForm 
        v-if="selectedLeaveRequest"
        mode="update"
        :leave="selectedLeaveRequest"
        :employees="employees"
        :leaveTypes="leaveTypes"
        :workShifts="workshifts"
        :currentUser="currentUser"
        @close="closeLeaveFormModal"
        @submit="closeLeaveFormModal"
        @submit-for-approval="closeLeaveFormModal"
      />
    </ModalDialog>
    
    <!-- ModalDialog cho OvertimeForm -->
    <ModalDialog :show="showOvertimeFormModal" title="Chi tiết phiếu tăng ca" size="lg" scrollable
      @update:show="showOvertimeFormModal = $event">
      <OvertimeForm 
        v-if="selectedOvertimeRequest"
        mode="update"
        :overtime="selectedOvertimeRequest"
        @close="closeOvertimeFormModal"
        @submit="closeOvertimeFormModal"
        @submit-for-approval="closeOvertimeFormModal"
      />
    </ModalDialog>
  
  </div>
</template>

<style scoped>
.leave-tabs-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}
.tab-bar-item {
  padding: 8px 24px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  background: #f5f7fa;
  cursor: pointer;
  border: none;
  transition: background 0.18s, color 0.18s;
}
.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
}
.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}
.leave-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0d6efd;
  letter-spacing: 0.5px;
}
.leave-table {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(13,110,253,0.07);
  padding: 0;
  margin-bottom: 0;
}
.leave-cell {
  display: inline-block;
  min-width: 32px;
  text-align: center;
  padding: 4px 0;
  border-radius: 6px;
  background: #f8f9fa;
  color: #222;
  font-weight: 500;
  cursor: default;
  transition: background 0.18s, color 0.18s;
}
.leave-cell.clickable {
  background: #eafbe7;
  color: #0d6efd;
  cursor: pointer;
}
.leave-cell.clickable:hover {
  background: #d1e7dd;
  color: #0a58ca;
}
.leave-cell.leave-ot {
  background: #e0f7fa;
  color: #009688;
  font-weight: 600;
}
.emp-id, .emp-name, .join-date, .leave-policy, .seniority-leave, .total-leave, .total-used, .leave-remain, .seniority-date,
.ot-hours, .ot-leave-days, .ot-leave-used, .ot-leave-remain {
  font-weight: 500;
  font-size: 1rem;
  color: #222;
  padding: 2px 8px;
  display: inline-block;
  text-align: left;
}
.total-used.clickable, .ot-leave-used.clickable {
  background: #eafbe7;
  color: #0d6efd;
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 600;
  transition: background 0.18s, color 0.18s;
}
.total-used.clickable:hover, .ot-leave-used.clickable:hover {
  background: #d1e7dd;
  color: #0a58ca;
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
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: rgba(0, 123, 255, 0.05);
}
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.modal-leave-table {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 16px rgba(13,110,253,0.12);
  padding: 16px 8px;
  margin: 0;
}
.ticket-id, .ticket-days {
  font-size: 1.05rem;
  font-weight: 500;
  padding: 4px 12px;
  display: inline-block;
  border-radius: 6px;
  margin-bottom: 2px;
}
.ticket-id {
  color: #0d6efd;
  background: #eafbe7;
}
.ticket-name, .ticket-date, .ticket-reason {
  font-size: 1.05rem;
  font-weight: 500;
  color: #222;
  padding: 4px 0;
  display: inline-block;
}

/* Voucher code link styling */
.voucher-code-link {
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border-bottom: 1px dotted transparent;
}

.voucher-code-link:hover {
  border-bottom-color: currentColor;
  text-decoration: none;
  transform: translateY(-1px);
}

.voucher-code-link:active {
  transform: translateY(0);
}
.ticket-days {
  color: #009688;
  background: #e0f7fa;
}
.modal-leave-table .table th {
  background: #f5f7fa;
  color: #0d6efd;
  font-size: 1.05rem;
  font-weight: 600;
}
.modal-leave-table .table td {
  background: #fff;
  font-size: 1.05rem;
  vertical-align: middle;
}
</style>