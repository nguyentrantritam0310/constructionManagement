<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useEmployee } from '../../composables/useEmployee'
import { useLeaveRequest } from '../../composables/useLeaveRequest'
import { useEmployeeRequest } from '../../composables/useEmployeeRequest'
import { useOvertimeRequest } from '../../composables/useOvertimeRequest'
import { CONTRACT_APPROVE_STATUS, isApprovedStatus } from '../../constants/status.js'

// Composables
const { employees, fetchAllEmployees, loading: employeeLoading, error: employeeError } = useEmployee()
const { leaveRequests, fetchLeaveRequests, loading: leaveLoading, error: leaveError } = useLeaveRequest()
const { employeeRequests, fetchEmployeeRequests, loading: requestLoading, error: requestError } = useEmployeeRequest()
const { overtimeRequests, fetchOvertimeRequests, loading: overtimeLoading, error: overtimeError } = useOvertimeRequest()

// Combined loading state
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

// Function to calculate total used leave days for an employee
const calculateTotalUsedLeave = (employeeId) => {
  if (!leaveRequests.value || leaveRequests.value.length === 0) {
    console.log('No leave requests available for calculation')
    return 0
  }
  
  const employeeLeaveRequests = leaveRequests.value.filter(request => 
    request.employeeID === employeeId && 
    isApprovedStatus(request.approveStatus) // Backend maps enum to Vietnamese string
  )
  
  console.log(`Employee ${employeeId} has ${employeeLeaveRequests.length} approved leave requests`)
  
  const total = employeeLeaveRequests.reduce((total, request) => {
    const fromDate = new Date(request.startDateTime)
    const toDate = new Date(request.endDateTime)
    const requestYear = fromDate.getFullYear()
    
    if (requestYear === selectedYear.value) {
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
      console.log(`Leave request ${request.voucherCode}: ${days} days in ${requestYear}`)
      return total + days
    }
    return total
  }, 0)
  
  console.log(`Total used leave for employee ${employeeId} in ${selectedYear.value}: ${total}`)
  return total
}

// Function to get leave days by month for an employee
const getLeaveDaysByMonth = (employeeId, month) => {
  if (!leaveRequests.value || leaveRequests.value.length === 0) {
    return 0
  }
  
  const employeeLeaveRequests = leaveRequests.value.filter(request => 
    request.employeeID === employeeId && 
    isApprovedStatus(request.approveStatus) // Backend maps enum to Vietnamese string
  )
  
  return employeeLeaveRequests.reduce((total, request) => {
    const fromDate = new Date(request.startDateTime)
    const toDate = new Date(request.endDateTime)
    const requestMonth = fromDate.getMonth() + 1 // JavaScript months are 0-indexed
    const requestYear = fromDate.getFullYear()
    
    if (requestMonth === month && requestYear === selectedYear.value) {
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
      return total + days
    }
    return total
  }, 0)
}

// Computed property for leave data based on real API data
const leaveData = computed(() => {
  console.log('=== LEAVE DATA COMPUTED ===')
  console.log('Employees value:', employees.value)
  console.log('Employees length:', employees.value?.length || 0)
  console.log('Leave requests value:', leaveRequests.value)
  console.log('Leave requests length:', leaveRequests.value?.length || 0)
  
  // Check if data is loaded
  if (!employees.value || employees.value.length === 0) {
    console.log('No employees data available')
    return []
  }
  
  // Debug: Log first employee structure
  if (employees.value.length > 0) {
    console.log('First employee structure:', employees.value[0])
    console.log('Employee status values:', employees.value.map(emp => ({ id: emp.id, status: emp.status, employeeCode: emp.employeeCode })))
  }
  
  // Filter only active employees - try different status values
  const activeEmployees = employees.value.filter(emp => {
    console.log(`Employee ${emp.employeeCode}: status = ${emp.status} (type: ${typeof emp.status})`)
    return emp.status === 0 || emp.status === '0' || emp.status === 'Active' || emp.status === null || emp.status === undefined
  })
  
  console.log('Total employees:', employees.value.length)
  console.log('Active employees after filter:', activeEmployees.length)
  
  if (activeEmployees.length === 0) {
    console.log('No active employees found - showing all employees instead')
    const allEmployees = employees.value
    console.log('All employees count:', allEmployees.length)
  }
  
  const employeesToProcess = activeEmployees.length > 0 ? activeEmployees : employees.value
  
  const result = employeesToProcess.map(employee => {
    const joinDate = new Date(employee.joinDate)
    const seniorityLeave = calculateSeniorityLeave(employee.joinDate)
    const totalUsed = calculateTotalUsedLeave(employee.id)
    const totalLeave = 12 + seniorityLeave // 12 days default + seniority leave
    
    // Generate month data
    const monthData = {}
    for (let i = 1; i <= 12; i++) {
      monthData[`month${i}`] = getLeaveDaysByMonth(employee.id, i)
    }
    
    const employeeData = {
      empId: employee.id, // Use employee ID instead of employeeCode
      empCode: employee.employeeCode, // Keep employeeCode for display
      empName: `${employee.firstName} ${employee.lastName}`,
      ...monthData,
      joinDate: joinDate.toLocaleDateString('vi-VN'),
      leavePolicy: 12,
      seniorityLeave,
      totalLeave,
      totalUsed,
      leaveRemain: Math.max(0, totalLeave - totalUsed),
      seniorityDate: joinDate.toLocaleDateString('vi-VN'),
      employeeId: employee.id // Keep for modal usage
    }
    
    // Debug logging for first employee
    if (employee === activeEmployees[0]) {
      console.log('Sample employee data:', employeeData)
      console.log('Employee leave requests:', leaveRequests.value.filter(req => req.employeeID === employee.id))
    }
    
    return employeeData
  })
  
  console.log('Leave data computed:', result.length, 'employees')
  return result
})

const annualCurrentPage = ref(1)
const annualItemsPerPage = ref(10)
const paginatedLeaveData = computed(() => {
  if (!leaveData.value || leaveData.value.length === 0) {
    return []
  }
  const start = (annualCurrentPage.value - 1) * annualItemsPerPage.value
  return leaveData.value.slice(start, start + annualItemsPerPage.value)
})

// ----------- Phép bù tăng ca -----------
const otLeaveColumns = [
  { key: 'empId', label: 'Mã nhân viên' },
  { key: 'empName', label: 'Tên nhân viên' },
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `month${i + 1}`,
    label: `${i + 1 < 10 ? '0' : ''}${i + 1}/2025`
  })),
  { key: 'totalOTHours', label: 'Tổng giờ tăng ca' },
  { key: 'otLeaveDays', label: 'Số ngày phép bù' },
  { key: 'otLeaveUsed', label: 'Đã nghỉ phép bù' },
  { key: 'otLeaveRemain', label: 'Phép bù còn lại' }
]

// Function to calculate total overtime days for an employee (only overtime leave compensation, not paid overtime)
const calculateTotalOTDays = (employeeId) => {
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
    console.log(`No overtime requests available for employee ${employeeId}`)
    return 0
  }
  
  const employeeOTRequests = overtimeRequests.value.filter(request => 
    request.employeeID === employeeId && 
    isApprovedStatus(request.approveStatus) && // Backend maps enum to Vietnamese string
    request.overtimeFormID === 2 // Only "Tăng ca nghỉ bù" (overtime leave compensation), not "Tăng ca tính lương"
  )
  
  console.log(`Employee ${employeeId} has ${employeeOTRequests.length} approved overtime leave compensation requests`)
  
  // Debug: Log overtime form information
  if (employeeOTRequests.length > 0) {
    console.log('Overtime leave compensation requests:', employeeOTRequests.map(req => ({
      voucherCode: req.voucherCode,
      overtimeFormID: req.overtimeFormID,
      overtimeFormName: req.overtimeFormName,
      reason: req.reason
    })))
  }
  
  const totalDays = employeeOTRequests.reduce((total, request) => {
    const fromDate = new Date(request.startDateTime)
    const toDate = new Date(request.endDateTime)
    const requestYear = fromDate.getFullYear()
    
    if (requestYear === selectedYear.value) {
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1 // Calculate actual days
      console.log(`Overtime request ${request.voucherCode}: ${days} days (${fromDate.toLocaleDateString('vi-VN')} - ${toDate.toLocaleDateString('vi-VN')})`)
      return total + days
    }
    return total
  }, 0)
  
  console.log(`Total OT days for employee ${employeeId} in ${selectedYear.value}: ${totalDays}`)
  return totalDays
}

// Function to get overtime days by month for an employee (only overtime leave compensation)
const getOTDaysByMonth = (employeeId, month) => {
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
    return 0
  }
  
  const employeeOTRequests = overtimeRequests.value.filter(request => 
    request.employeeID === employeeId && 
    isApprovedStatus(request.approveStatus) &&
    request.overtimeFormID === 2 // Only "Tăng ca nghỉ bù" (overtime leave compensation)
  )
  
  const monthDays = employeeOTRequests.reduce((total, request) => {
    const fromDate = new Date(request.startDateTime)
    const toDate = new Date(request.endDateTime)
    const requestMonth = fromDate.getMonth() + 1 // JavaScript months are 0-indexed
    const requestYear = fromDate.getFullYear()
    
    if (requestMonth === month && requestYear === selectedYear.value) {
      const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1 // Calculate actual days
      console.log(`Month ${month}: Overtime request ${request.voucherCode}: ${days} days`)
      return total + days
    }
    return total
  }, 0)
  
  if (monthDays > 0) {
    console.log(`Employee ${employeeId} - Month ${month}: ${monthDays} OT days`)
  }
  return monthDays
}

// Function to calculate total overtime hours for display (only overtime leave compensation)
const calculateTotalOTHours = (employeeId) => {
  if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
    return 0
  }
  
  const employeeOTRequests = overtimeRequests.value.filter(request => 
    request.employeeID === employeeId && 
    isApprovedStatus(request.approveStatus) &&
    request.overtimeFormID === 2 // Only "Tăng ca nghỉ bù" (overtime leave compensation)
  )
  
  return employeeOTRequests.reduce((total, request) => {
    const fromDate = new Date(request.startDateTime)
    const toDate = new Date(request.endDateTime)
    const requestYear = fromDate.getFullYear()
    
    if (requestYear === selectedYear.value) {
      const hours = Math.ceil((toDate - fromDate) / (1000 * 60 * 60)) // Convert to hours
      return total + hours
    }
    return total
  }, 0)
}

// Overtime leave data computed from API data
const otLeaveData = computed(() => {
  console.log('=== OT LEAVE DATA COMPUTED ===')
  console.log('Employees value:', employees.value)
  console.log('Employees length:', employees.value?.length || 0)
  console.log('Overtime requests value:', overtimeRequests.value)
  console.log('Overtime requests length:', overtimeRequests.value?.length || 0)
  
  // Check if data is loaded
  if (!employees.value || employees.value.length === 0) {
    console.log('No employees data available for OT leave')
    return []
  }
  
  // Filter only active employees - try different status values
  const activeEmployees = employees.value.filter(emp => {
    return emp.status === 0 || emp.status === '0' || emp.status === 'Active' || emp.status === null || emp.status === undefined
  })
  
  console.log('Total employees for OT:', employees.value.length)
  console.log('Active employees for OT after filter:', activeEmployees.length)
  
  const employeesToProcess = activeEmployees.length > 0 ? activeEmployees : employees.value
  
  return employeesToProcess.map(employee => {
    const totalOTDays = calculateTotalOTDays(employee.id) // Calculate actual days from overtime requests
    const totalOTHours = calculateTotalOTHours(employee.id) // Keep hours for display
    const otLeaveDays = totalOTDays // Use actual days from overtime requests
    const otLeaveUsed = totalOTDays // Same as otLeaveDays for now (assuming all overtime becomes leave)
    const otLeaveRemain = Math.max(0, otLeaveDays - otLeaveUsed)
    
    // Generate month data using actual days
    const monthData = {}
    for (let i = 1; i <= 12; i++) {
      monthData[`month${i}`] = getOTDaysByMonth(employee.id, i) // Use actual days
    }
    
    return {
      empId: employee.id, // Use employee ID instead of employeeCode
      empCode: employee.employeeCode, // Keep employeeCode for display
      empName: `${employee.firstName} ${employee.lastName}`,
      ...monthData,
      totalOTHours,
      otLeaveDays,
      otLeaveUsed,
      otLeaveRemain,
      employeeId: employee.id // Keep for modal usage
    }
  })
})

const otCurrentPage = ref(1)
const otItemsPerPage = ref(10)
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

const leaveTicketColumns = [
  { key: 'ticketId', label: 'Mã phiếu' },
  { key: 'empName', label: 'Họ tên' },
  { key: 'fromDate', label: 'Từ ngày' },
  { key: 'toDate', label: 'Đến ngày' },
  { key: 'days', label: 'Số ngày nghỉ' },
  { key: 'reason', label: 'Lý do' }
]

// Dữ liệu phiếu nghỉ phép cho phép năm quy định - Sẽ được tạo động từ API data
const leaveTickets = {}

// Dữ liệu phiếu nghỉ phép bù tăng ca - Sẽ được tạo động từ API data
const otTickets = {}

function openLeaveModal(emp, month, type = 'annual', field = 'month') {
  modalEmployee.value = emp
  modalMonth.value = month
  modalType.value = type
  modalField.value = field
  showModal.value = true
}

function getTickets(empId, month, type, field) {
  console.log('getTickets called:', { empId, month, type, field })
  
  if (type === 'annual') {
    // Check if data is loaded
    if (!leaveData.value || leaveData.value.length === 0 || !leaveRequests.value) {
      console.log('No data available for getTickets')
      return []
    }
    
    // Find employee by ID from leaveData
    const employee = leaveData.value.find(emp => emp.empId === empId)
    if (!employee) {
      console.log('Employee not found:', empId)
      return []
    }
    
    console.log('Found employee:', employee.empName, 'ID:', employee.employeeId)
    
    // Filter leave requests for this employee
    const employeeLeaveRequests = leaveRequests.value.filter(request => 
      request.employeeID === employee.employeeId && 
      isApprovedStatus(request.approveStatus) // Backend maps enum to Vietnamese string
    )
    
    console.log('Employee leave requests:', employeeLeaveRequests.length)
    
    if (field === 'month' && typeof month === 'number') {
      // Filter by specific month and year
      const monthRequests = employeeLeaveRequests.filter(request => {
        const fromDate = new Date(request.startDateTime)
        const requestMonth = fromDate.getMonth() + 1
        const requestYear = fromDate.getFullYear()
        return requestMonth === month && requestYear === selectedYear.value
      })
      
      console.log(`Month ${month} requests:`, monthRequests.length)
      
      return monthRequests.map(request => ({
        ticketId: request.voucherCode,
        empName: employee.empName,
        fromDate: new Date(request.startDateTime).toLocaleDateString('vi-VN'),
        toDate: new Date(request.endDateTime).toLocaleDateString('vi-VN'),
        days: Math.ceil((new Date(request.endDateTime) - new Date(request.startDateTime)) / (1000 * 60 * 60 * 24)) + 1,
        reason: request.reason || 'Nghỉ phép cá nhân'
      }))
    }
    
    if (field === 'totalUsed') {
      // Return all approved leave requests for this employee in selected year
      const yearRequests = employeeLeaveRequests.filter(request => {
        const fromDate = new Date(request.startDateTime)
        const requestYear = fromDate.getFullYear()
        return requestYear === selectedYear.value
      })
      
      console.log(`Year ${selectedYear.value} requests:`, yearRequests.length)
      
      return yearRequests.map(request => ({
        ticketId: request.voucherCode,
        empName: employee.empName,
        fromDate: new Date(request.startDateTime).toLocaleDateString('vi-VN'),
        toDate: new Date(request.endDateTime).toLocaleDateString('vi-VN'),
        days: Math.ceil((new Date(request.endDateTime) - new Date(request.startDateTime)) / (1000 * 60 * 60 * 24)) + 1,
        reason: request.reason || 'Nghỉ phép cá nhân'
      }))
    }
  }
  
  if (type === 'otLeave') {
    console.log('Processing overtime leave tickets:', { empId, month, field })
    
    // Check if data is loaded
    if (!otLeaveData.value || otLeaveData.value.length === 0 || !overtimeRequests.value) {
      console.log('No overtime data available for getTickets')
      return []
    }
    
    // Find employee by ID from otLeaveData
    const employee = otLeaveData.value.find(emp => emp.empId === empId)
    if (!employee) {
      console.log('Employee not found in overtime data:', empId)
      return []
    }
    
    console.log('Found employee in overtime data:', employee.empName, 'ID:', employee.employeeId)
    
    // Filter overtime requests for this employee (only overtime leave compensation)
    const employeeOTRequests = overtimeRequests.value.filter(request => 
      request.employeeID === employee.employeeId && 
      isApprovedStatus(request.approveStatus) &&
      request.overtimeFormID === 2 // Only "Tăng ca nghỉ bù" (overtime leave compensation)
    )
    
    console.log('Employee overtime requests:', employeeOTRequests.length)
    
    if (field === 'month' && typeof month === 'number') {
      // Filter by specific month and year
      const monthRequests = employeeOTRequests.filter(request => {
        const fromDate = new Date(request.startDateTime)
        const requestMonth = fromDate.getMonth() + 1
        const requestYear = fromDate.getFullYear()
        return requestMonth === month && requestYear === selectedYear.value
      })
      
      console.log(`Month ${month} overtime requests:`, monthRequests.length)
      
      return monthRequests.map(request => {
        const days = Math.ceil((new Date(request.endDateTime) - new Date(request.startDateTime)) / (1000 * 60 * 60 * 24)) + 1
        return {
          ticketId: request.voucherCode,
          empName: employee.empName,
          fromDate: new Date(request.startDateTime).toLocaleDateString('vi-VN'),
          toDate: new Date(request.endDateTime).toLocaleDateString('vi-VN'),
          days: days,
          reason: request.reason || 'Nghỉ bù tăng ca'
        }
      })
    }
    
    if (field === 'otLeaveUsed') {
      // Return all approved overtime requests for this employee in selected year
      const yearRequests = employeeOTRequests.filter(request => {
        const fromDate = new Date(request.startDateTime)
        const requestYear = fromDate.getFullYear()
        return requestYear === selectedYear.value
      })
      
      console.log(`Year ${selectedYear.value} overtime requests:`, yearRequests.length)
      
      return yearRequests.map(request => {
        const days = Math.ceil((new Date(request.endDateTime) - new Date(request.startDateTime)) / (1000 * 60 * 60 * 24)) + 1
        return {
          ticketId: request.voucherCode,
          empName: employee.empName,
          fromDate: new Date(request.startDateTime).toLocaleDateString('vi-VN'),
          toDate: new Date(request.endDateTime).toLocaleDateString('vi-VN'),
          days: days,
          reason: request.reason || 'Nghỉ bù tăng ca'
        }
      })
    }
  }
  return []
}

// Debug function
const debugData = () => {
  console.log('=== DEBUG DATA ===')
  console.log('Selected year:', selectedYear.value)
  console.log('Loading states:', {
    employeeLoading: employeeLoading.value,
    leaveLoading: leaveLoading.value,
    requestLoading: requestLoading.value,
    overtimeLoading: overtimeLoading.value,
    combinedLoading: loading.value
  })
  console.log('Error states:', {
    employeeError: employeeError.value,
    leaveError: leaveError.value,
    requestError: requestError.value,
    overtimeError: overtimeError.value,
    combinedError: error.value
  })
  console.log('Employees count:', employees.value?.length || 0)
  console.log('Leave requests count:', leaveRequests.value?.length || 0)
  console.log('Overtime requests count:', overtimeRequests.value?.length || 0)
  console.log('Employee requests count:', employeeRequests.value?.length || 0)
  console.log('Leave data computed length:', leaveData.value?.length || 0)
  console.log('OT leave data computed length:', otLeaveData.value?.length || 0)
  
  if (employees.value?.length > 0) {
    console.log('First employee:', employees.value[0])
  }
  
  if (leaveRequests.value?.length > 0) {
    console.log('All leave requests:', leaveRequests.value)
    console.log('First leave request:', leaveRequests.value[0])
    console.log('Leave requests with "Nghỉ phép" type:', leaveRequests.value.filter(req => req.requestType === 'Nghỉ phép'))
    console.log('Approved leave requests (status = "Đã duyệt"):', leaveRequests.value.filter(req => req.approveStatus === 'Đã duyệt'))
    
    // Check specific fields
    leaveRequests.value.forEach((req, index) => {
      console.log(`Leave request ${index}:`, {
        voucherCode: req.voucherCode,
        employeeID: req.employeeID,
        requestType: req.requestType,
        approveStatus: req.approveStatus,
        startDateTime: req.startDateTime,
        endDateTime: req.endDateTime
      })
    })
  }
  
  if (overtimeRequests.value?.length > 0) {
    console.log('All overtime requests:', overtimeRequests.value)
    console.log('First overtime request:', overtimeRequests.value[0])
    console.log('Approved overtime requests (status = "Đã duyệt"):', overtimeRequests.value.filter(req => req.approveStatus === 'Đã duyệt'))
    console.log('Overtime leave compensation requests (overtimeFormID = 2):', overtimeRequests.value.filter(req => req.overtimeFormID === 2))
    console.log('Paid overtime requests (overtimeFormID = 1):', overtimeRequests.value.filter(req => req.overtimeFormID === 1))
    
    // Check specific fields
    overtimeRequests.value.forEach((req, index) => {
      console.log(`Overtime request ${index}:`, {
        voucherCode: req.voucherCode,
        employeeID: req.employeeID,
        requestType: req.requestType,
        approveStatus: req.approveStatus,
        overtimeFormID: req.overtimeFormID,
        overtimeFormName: req.overtimeFormName,
        startDateTime: req.startDateTime,
        endDateTime: req.endDateTime,
        reason: req.reason
      })
    })
  }
  
  console.log('Leave data computed:', leaveData.value?.length || 0)
  if (leaveData.value?.length > 0) {
    console.log('First leave data entry:', leaveData.value[0])
  }
  
  console.log('Overtime leave data computed:', otLeaveData.value?.length || 0)
  if (otLeaveData.value?.length > 0) {
    console.log('First overtime leave data entry:', otLeaveData.value[0])
    
    // Debug calculation for first employee
    const firstEmployee = otLeaveData.value[0]
    if (firstEmployee) {
      console.log('=== OVERTIME CALCULATION DEBUG ===')
      console.log('Employee:', firstEmployee.empName)
      console.log('Total OT Hours:', firstEmployee.totalOTHours)
      console.log('Total OT Days (calculated):', calculateTotalOTDays(firstEmployee.employeeId))
      console.log('OT Leave Days (displayed):', firstEmployee.otLeaveDays)
      console.log('Month data:', Object.keys(firstEmployee).filter(key => key.startsWith('month')).map(key => `${key}: ${firstEmployee[key]}`))
    }
  }
}

// Load data on component mount
onMounted(async () => {
  console.log('=== ONMOUNTED START ===')
  try {
    console.log('Starting to fetch all data...')
    
    const results = await Promise.allSettled([
      fetchAllEmployees(),
      fetchLeaveRequests(),
      fetchEmployeeRequests(),
      fetchOvertimeRequests()
    ])
    
    console.log('All fetch operations completed:', results)
    
    // Check each result
    results.forEach((result, index) => {
      const operations = ['fetchAllEmployees', 'fetchLeaveRequests', 'fetchEmployeeRequests', 'fetchOvertimeRequests']
      if (result.status === 'fulfilled') {
        console.log(`${operations[index]} succeeded`)
      } else {
        console.error(`${operations[index]} failed:`, result.reason)
      }
    })
    
    // Debug logging
    console.log('=== AFTER FETCH ===')
    console.log('Employees loaded:', employees.value?.length || 0)
    console.log('Leave requests loaded:', leaveRequests.value?.length || 0)
    console.log('Overtime requests loaded:', overtimeRequests.value?.length || 0)
    console.log('Employee requests loaded:', employeeRequests.value?.length || 0)
    
    if (employees.value?.length > 0) {
      console.log('First employee:', employees.value[0])
      console.log('Employee fields:', Object.keys(employees.value[0]))
    }
    
    if (leaveRequests.value?.length > 0) {
      console.log('First leave request:', leaveRequests.value[0])
      console.log('Leave request fields:', Object.keys(leaveRequests.value[0]))
    }
    
    if (overtimeRequests.value?.length > 0) {
      console.log('First overtime request:', overtimeRequests.value[0])
      console.log('Overtime request fields:', Object.keys(overtimeRequests.value[0]))
    }
    
    // Force computed properties to recalculate
    console.log('Leave data after mount:', leaveData.value?.length || 0)
    console.log('OT leave data after mount:', otLeaveData.value?.length || 0)
    
  } catch (error) {
    console.error('Error loading data:', error)
  }
  console.log('=== ONMOUNTED END ===')
})

// Reload data function
const reloadData = async () => {
  console.log('=== RELOAD DATA ===')
  try {
    console.log('Reloading all data...')
    
    const results = await Promise.allSettled([
      fetchAllEmployees(),
      fetchLeaveRequests(),
      fetchEmployeeRequests(),
      fetchOvertimeRequests()
    ])
    
    console.log('Reload results:', results)
    console.log('Data after reload:', {
      employees: employees.value?.length || 0,
      leaveRequests: leaveRequests.value?.length || 0,
      overtimeRequests: overtimeRequests.value?.length || 0,
      employeeRequests: employeeRequests.value?.length || 0
    })
    
    // Force reactive updates
    console.log('Leave data after reload:', leaveData.value?.length || 0)
    console.log('OT leave data after reload:', otLeaveData.value?.length || 0)
    
  } catch (error) {
    console.error('Error reloading data:', error)
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="leave-tabs-bar mb-3">
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
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center gap-3">
        <label class="form-label mb-0 fw-bold">Năm:</label>
        <select v-model="selectedYear" class="form-select" style="width: 120px;">
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <button class="btn btn-sm btn-outline-success" @click="reloadData">
          <i class="fas fa-sync me-1"></i> Reload
        </button>
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
        <DataTable :columns="leaveColumns" :data="paginatedLeaveData">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item && item[`month${i}`] > 0"
              class="leave-cell clickable"
              @click.stop="openLeaveModal(item.empId, i, 'annual', 'month')"
              title="Xem phiếu nghỉ phép"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell">{{ item ? item[`month${i}`] : 0 }}</span>
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
        <Pagination
          v-if="!loading && !error && leaveData && leaveData.length > 0"
          :totalItems="leaveData.length"
          :itemsPerPage="annualItemsPerPage"
          :currentPage="annualCurrentPage"
          @update:currentPage="annualCurrentPage = $event"
        />
      </div>
      
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
        <DataTable :columns="otLeaveColumns" :data="paginatedOtLeaveData">
          <template v-for="i in 12" #[`month${i}`]="{ item }">
            <span
              v-if="item && item[`month${i}`] > 0"
              class="leave-cell leave-ot clickable"
              @click.stop="openLeaveModal(item.empId, i, 'otLeave', 'month')"
              title="Xem phiếu phép bù tăng ca"
            >
              {{ item[`month${i}`] }}
            </span>
            <span v-else class="leave-cell">{{ item ? item[`month${i}`] : 0 }}</span>
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
            >
              {{ item?.otLeaveUsed || 0 }}
            </span>
          </template>
          <template #otLeaveRemain="{ item }">
            <span class="ot-leave-remain">{{ item?.otLeaveRemain || 0 }}</span>
          </template>
        </DataTable>
        <Pagination
          v-if="!loading && !error && otLeaveData && otLeaveData.length > 0"
          :totalItems="otLeaveData.length"
          :itemsPerPage="otItemsPerPage"
          :currentPage="otCurrentPage"
          @update:currentPage="otCurrentPage = $event"
        />
      </div>
      
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
    >
      <div class="modal-leave-table">
        <DataTable
          :columns="leaveTicketColumns"
          :data="getTickets(modalEmployee, modalMonth, modalType, modalField)"
        >
          <template #ticketId="{ item }">
            <span class="ticket-id">{{ item.ticketId }}</span>
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
.ticket-id, .ticket-name, .ticket-date, .ticket-days, .ticket-reason {
  font-size: 1.05rem;
  font-weight: 500;
  color: #222;
  padding: 4px 12px;
  display: inline-block;
  border-radius: 6px;
  background: #f8f9fa;
  margin-bottom: 2px;
}
.ticket-id {
  color: #0d6efd;
  background: #eafbe7;
}
.ticket-days {
  color: #009688;
  background: #e0f7fa;
}
.ticket-reason {
  color: #ff6b6b;
  background: #fff0f0;
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