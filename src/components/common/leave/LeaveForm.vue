<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import { useWorkShift } from '../../../composables/useWorkShift.js'
import { useLeaveType } from '../../../composables/useLeaveType.js'
import { useEmployee } from '@/composables/useEmployee'
import { useLeaveRequest } from '@/composables/useLeaveRequest'
import { useOvertimeRequest } from '@/composables/useOvertimeRequest'
import { isApprovedStatus } from '@/constants/status.js'

const props = defineProps({
    mode: { type: String, required: true, validator: v => ['create', 'update', 'detail'].includes(v) },
    leave: { type: Object, default: () => ({}) },
    employees: { type: Array, default: () => [] },
    leaveTypes: { type: Array, default: () => [] },
    workShifts: { type: Array, default: () => [] },
    currentUser: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit', 'submit-for-approval'])

// Composables
const { employees, fetchAllEmployees } = useEmployee()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()
const { leaveRequests, fetchLeaveRequests } = useLeaveRequest()
const { overtimeRequests, fetchOvertimeRequests } = useOvertimeRequest()

// Form data
const formData = ref({
    voucherCode: props.leave.voucherCode || '',
    employeeID: props.leave.employeeID || '',
    leaveTypeID: props.leave.leaveTypeID || '',
    workShiftID: props.leave.workShiftID || '',
    startDateTime: props.leave.startDateTime || '',
    endDateTime: props.leave.endDateTime || '',
    reason: props.leave.reason || ''
})

// Validation
const errors = ref({})

// Selected year for calculations (current year)
const selectedYear = ref(new Date().getFullYear())

// Regex patterns cho validation
const regexPatterns = {
  // Số phiếu: chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  voucherCode: /^[A-Za-z0-9_-]{1,50}$/,
  // DateTime-local: định dạng YYYY-MM-DDTHH:mm
  dateTimeLocal: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Lý do: cho phép chữ, số, khoảng trắng, dấu câu, độ dài tối đa 500
  reason: /^[\s\S]{1,500}$/
}

// Function to calculate seniority leave (1 day for every 5 years)
const calculateSeniorityLeave = (joinDate) => {
    if (!joinDate) return 0
    const join = new Date(joinDate)
    const current = new Date()
    const yearsWorked = current.getFullYear() - join.getFullYear()
    return Math.floor(yearsWorked / 5)
}

// Function to calculate total used leave days for an employee
// excludeLeaveId: ID của đơn nghỉ phép cần loại trừ (khi update)
// excludeVoucherCode: Mã phiếu của đơn nghỉ phép cần loại trừ (khi update)
const calculateTotalUsedLeave = (employeeId, excludeLeaveId = null, excludeVoucherCode = null) => {
    if (!leaveRequests.value || leaveRequests.value.length === 0) {
        return 0
    }
    
    const employeeLeaveRequests = leaveRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus) &&
        // Loại trừ đơn hiện tại khi ở mode update
        (!excludeLeaveId || request.id !== excludeLeaveId) &&
        (!excludeVoucherCode || request.voucherCode !== excludeVoucherCode)
    )
    
    const total = employeeLeaveRequests.reduce((total, request) => {
        const fromDate = new Date(request.startDateTime)
        const toDate = new Date(request.endDateTime)
        const requestYear = fromDate.getFullYear()
        
        if (requestYear === selectedYear.value) {
            const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
            return total + days
        }
        return total
    }, 0)
    
    return total
}

// Function to calculate total overtime leave days for an employee
// excludeOvertimeRequestId: ID của đơn tăng ca nghỉ bù cần loại trừ (khi update)
const calculateTotalOTLeaveDays = (employeeId, excludeOvertimeRequestId = null) => {
    if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
        return 0
    }
    
    const employeeOTRequests = overtimeRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus) &&
        request.overtimeFormID === 2 && // Only "Tăng ca nghỉ bù" (overtime leave compensation)
        // Loại trừ đơn hiện tại khi ở mode update
        (!excludeOvertimeRequestId || request.id !== excludeOvertimeRequestId)
    )
    
    const totalDays = employeeOTRequests.reduce((total, request) => {
        const fromDate = new Date(request.startDateTime)
        const toDate = new Date(request.endDateTime)
        const requestYear = fromDate.getFullYear()
        
        if (requestYear === selectedYear.value) {
            const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
            return total + days
        }
        return total
    }, 0)
    
    return totalDays
}

// Computed property for employee leave information
const employeeLeaveInfo = computed(() => {
    if (!formData.value.employeeID) {
        return null
    }
    
    const employee = employees.value.find(emp => emp.id === formData.value.employeeID)
    if (!employee) {
        return null
    }
    
    const joinDate = new Date(employee.joinDate)
    const seniorityLeave = calculateSeniorityLeave(employee.joinDate)
    const totalLeave = 12 + seniorityLeave // 12 days default + seniority leave
    
    // Khi ở mode "update" hoặc "detail", loại trừ đơn hiện tại ra khỏi tính toán
    // (hoặc bất kỳ khi nào có props.leave - đang xem/sửa một đơn cụ thể)
    let excludeLeaveId = null
    let excludeVoucherCode = null
    if ((props.mode === 'update' || props.mode === 'detail') && props.leave) {
        excludeLeaveId = props.leave.id || null
        excludeVoucherCode = props.leave.voucherCode || null
    }
    
    const totalUsed = calculateTotalUsedLeave(employee.id, excludeLeaveId, excludeVoucherCode)
    const leaveRemain = Math.max(0, totalLeave - totalUsed)
    
    // Tính phép bù tăng ca (không cần loại trừ vì đây là đơn nghỉ phép, không phải đơn tăng ca)
    const otLeaveDays = calculateTotalOTLeaveDays(employee.id)
    const otLeaveUsed = calculateTotalOTLeaveDays(employee.id) // Same as otLeaveDays for now
    const otLeaveRemain = Math.max(0, otLeaveDays - otLeaveUsed)
    
    return {
        employee,
        totalLeave,
        seniorityLeave,
        totalUsed,
        leaveRemain,
        otLeaveDays,
        otLeaveUsed,
        otLeaveRemain
    }
})

// Computed property for requested days
const requestedDays = computed(() => {
    if (formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
    }
    return 0
})


// Validation functions
const validateVoucherCode = () => {
    const value = formData.value.voucherCode?.trim()
    if (!value) {
        errors.value.voucherCode = 'Số phiếu không được để trống'
        return false
    }
    if (!regexPatterns.voucherCode.test(value)) {
        errors.value.voucherCode = 'Số phiếu chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 50 ký tự)'
        return false
    }
    errors.value.voucherCode = ''
    return true
}

const validateEmployeeID = () => {
    const value = formData.value.employeeID
    if (!value) {
        errors.value.employeeID = 'Nhân viên là bắt buộc'
        return false
    }
    errors.value.employeeID = ''
    return true
}

const validateLeaveTypeID = () => {
    const value = formData.value.leaveTypeID
    if (!value) {
        errors.value.leaveTypeID = 'Loại nghỉ phép là bắt buộc'
        return false
    }
    if (!regexPatterns.id.test(String(value))) {
        errors.value.leaveTypeID = 'Loại nghỉ phép không hợp lệ'
        return false
    }
    
    // Validate leave days availability
    if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate < endDate) {
            const requestedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
            const leaveInfo = employeeLeaveInfo.value
            
            if (leaveInfo) {
                const selectedLeaveType = leaveTypes.value.find(type => type.id == formData.value.leaveTypeID)
                
                if (selectedLeaveType) {
                    if (selectedLeaveType.leaveTypeName === 'Phép năm' && leaveInfo.leaveRemain < requestedDays) {
                        errors.value.leaveTypeID = `Không đủ phép năm. Còn lại: ${leaveInfo.leaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                        return false
                    } else if (selectedLeaveType.leaveTypeName === 'Nghỉ bù' && leaveInfo.otLeaveRemain < requestedDays) {
                        errors.value.leaveTypeID = `Không đủ phép bù tăng ca. Còn lại: ${leaveInfo.otLeaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                        return false
                    }
                }
            }
        }
    }
    
    errors.value.leaveTypeID = ''
    return true
}

const validateWorkShiftID = () => {
    const value = formData.value.workShiftID
    if (!value) {
        errors.value.workShiftID = 'Ca làm việc là bắt buộc'
        return false
    }
    if (!regexPatterns.id.test(String(value))) {
        errors.value.workShiftID = 'Ca làm việc không hợp lệ'
        return false
    }
    errors.value.workShiftID = ''
    return true
}

const validateStartDateTime = () => {
    const value = formData.value.startDateTime
    if (!value) {
        errors.value.startDateTime = 'Ngày bắt đầu là bắt buộc'
        return false
    }
    if (!regexPatterns.dateTimeLocal.test(value)) {
        errors.value.startDateTime = 'Định dạng ngày giờ không hợp lệ'
        return false
    }
    
    const startDate = new Date(value)
    if (isNaN(startDate.getTime())) {
        errors.value.startDateTime = 'Ngày giờ bắt đầu không hợp lệ'
        return false
    }
    
    // Validate time range against work shift
    if (formData.value.workShiftID) {
        const selectedWorkShift = workshifts.value.find(shift => shift.id == formData.value.workShiftID)
        if (selectedWorkShift && selectedWorkShift.shiftDetails) {
            const startDayOfWeek = startDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const startDayName = dayNames[startDayOfWeek]
            const startDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === startDayName)
            
            if (startDayShiftDetail && startDayShiftDetail.startTime !== '00:00:00' && startDayShiftDetail.endTime !== '00:00:00') {
                const startTime = startDate.toTimeString().substring(0, 8)
                if (startTime < startDayShiftDetail.startTime || startTime > startDayShiftDetail.endTime) {
                    errors.value.startDateTime = `Giờ bắt đầu phải trong khoảng ${startDayShiftDetail.startTime.substring(0, 5)} - ${startDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    return false
                }
            }
        }
    }
    
    // Validate start date is before end date
    if (formData.value.endDateTime) {
        const endDate = new Date(formData.value.endDateTime)
        if (!isNaN(endDate.getTime()) && startDate >= endDate) {
            errors.value.startDateTime = 'Ngày bắt đầu phải trước ngày kết thúc'
            return false
        }
    }
    
    errors.value.startDateTime = ''
    return true
}

const validateEndDateTime = () => {
    const value = formData.value.endDateTime
    if (!value) {
        errors.value.endDateTime = 'Ngày kết thúc là bắt buộc'
        return false
    }
    if (!regexPatterns.dateTimeLocal.test(value)) {
        errors.value.endDateTime = 'Định dạng ngày giờ không hợp lệ'
        return false
    }
    
    const endDate = new Date(value)
    if (isNaN(endDate.getTime())) {
        errors.value.endDateTime = 'Ngày giờ kết thúc không hợp lệ'
        return false
    }
    
    // Validate end date is after start date
    if (formData.value.startDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        if (!isNaN(startDate.getTime()) && startDate >= endDate) {
            errors.value.endDateTime = 'Ngày kết thúc phải sau ngày bắt đầu'
            return false
        }
    }
    
    // Validate time range against work shift
    if (formData.value.workShiftID) {
        const selectedWorkShift = workshifts.value.find(shift => shift.id == formData.value.workShiftID)
        if (selectedWorkShift && selectedWorkShift.shiftDetails) {
            const endDayOfWeek = endDate.getDay()
            const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
            const endDayName = dayNames[endDayOfWeek]
            const endDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === endDayName)
            
            if (endDayShiftDetail && endDayShiftDetail.startTime !== '00:00:00' && endDayShiftDetail.endTime !== '00:00:00') {
                const endTime = endDate.toTimeString().substring(0, 8)
                if (endTime < endDayShiftDetail.startTime || endTime > endDayShiftDetail.endTime) {
                    errors.value.endDateTime = `Giờ kết thúc phải trong khoảng ${endDayShiftDetail.startTime.substring(0, 5)} - ${endDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    return false
                }
            }
        }
    }
    
    errors.value.endDateTime = ''
    return true
}

const validateReason = () => {
    const value = formData.value.reason?.trim() || ''
    if (!value) {
        errors.value.reason = 'Lý do là bắt buộc'
        return false
    }
    if (value.length < 1 || value.length > 500) {
        errors.value.reason = 'Lý do phải từ 1 đến 500 ký tự'
        return false
    }
    errors.value.reason = ''
    return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
    switch (fieldName) {
        case 'voucherCode':
            validateVoucherCode()
            break
        case 'employeeID':
            validateEmployeeID()
            // Validate leave type again when employee changes
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            break
        case 'leaveTypeID':
            validateLeaveTypeID()
            break
        case 'workShiftID':
            validateWorkShiftID()
            // Re-validate datetime when work shift changes
            if (formData.value.startDateTime) {
                validateStartDateTime()
            }
            if (formData.value.endDateTime) {
                validateEndDateTime()
            }
            break
        case 'startDateTime':
            validateStartDateTime()
            // Re-validate end date when start date changes
            if (formData.value.endDateTime) {
                validateEndDateTime()
            }
            // Re-validate leave type when dates change
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            break
        case 'endDateTime':
            validateEndDateTime()
            // Re-validate start date when end date changes
            if (formData.value.startDateTime) {
                validateStartDateTime()
            }
            // Re-validate leave type when dates change
            if (formData.value.leaveTypeID) {
                validateLeaveTypeID()
            }
            break
        case 'reason':
            validateReason()
            break
    }
}

// Validate toàn bộ form
const validateForm = () => {
    const validations = [
        validateVoucherCode(),
        validateEmployeeID(),
        validateLeaveTypeID(),
        validateWorkShiftID(),
        validateStartDateTime(),
        validateEndDateTime(),
        validateReason()
    ]
    
    return validations.every(v => v === true)
}

const handleSubmit = () => {
    // Validate form trước khi submit
    if (!validateForm()) {
        // Scroll đến trường đầu tiên có lỗi
        const firstErrorField = document.querySelector('.is-invalid')
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
            firstErrorField.focus()
        }
        return
    }
    
    // Convert datetime-local to proper format for API
    const submitData = {
        ...formData.value,
        voucherCode: formData.value.voucherCode.trim(),
        reason: formData.value.reason.trim(),
        startDateTime: new Date(formData.value.startDateTime).toISOString(),
        endDateTime: new Date(formData.value.endDateTime).toISOString()
    }
    emit('submit', submitData)
}

const handleClose = () => emit('close')

const handleSubmitForApproval = () => {
    // Validate form trước khi submit
    if (!validateForm()) {
        // Scroll đến trường đầu tiên có lỗi
        const firstErrorField = document.querySelector('.is-invalid')
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
            firstErrorField.focus()
        }
        return
    }
    
    // Convert datetime-local to proper format for API
    const submitData = {
        ...formData.value,
        voucherCode: formData.value.voucherCode.trim(),
        reason: formData.value.reason.trim(),
        startDateTime: new Date(formData.value.startDateTime).toISOString(),
        endDateTime: new Date(formData.value.endDateTime).toISOString()
    }
    emit('submit-for-approval', submitData.voucherCode)
}

// Load data on mount
onMounted(async () => {
    try {
        await Promise.all([
            fetchAllEmployees(), // Lấy tất cả employees
            fetchWorkShifts(),
            fetchLeaveTypes(),
            fetchLeaveRequests(), // Load leave requests for calculations
            fetchOvertimeRequests() // Load overtime requests for calculations
        ])
        
        console.log('Loaded data:', {
            employees: employees.value,
            workShifts: workshifts.value,
            leaveTypes: leaveTypes.value
        })
        
        console.log('Form data after load:', formData.value)
        
        // Debug individual arrays
        console.log('Employees length:', employees.value?.length)
        console.log('WorkShifts length:', workshifts.value?.length)
        console.log('LeaveTypes length:', leaveTypes.value?.length)
        
        // Fallback data for testing
        if (!leaveTypes.value || leaveTypes.value.length === 0) {
            console.log('No leave types loaded, using fallback data')
            leaveTypes.value = [
                { id: 1, leaveTypeName: 'Phép năm' },
                { id: 2, leaveTypeName: 'Nghỉ bù' }
            ]
        }
        
        if (!workshifts.value || workshifts.value.length === 0) {
            console.log('No work shifts loaded, using fallback data')
            workshifts.value = [
                { id: 1, shiftName: 'Ca Hành Chính' }
            ]
        }
        
        // No default employee selection - user must choose manually
    } catch (error) {
        console.error('Error loading data:', error)
    }
})

// Helper function to convert date string to datetime-local format (YYYY-MM-DDTHH:mm)
// without timezone conversion issues
const formatDateTimeLocal = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    // Get local date components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Watch for changes in leave prop
watch(() => props.leave, (newLeave) => {
    if (newLeave && Object.keys(newLeave).length > 0) {
        formData.value = {
            voucherCode: newLeave.voucherCode || '',
            employeeID: newLeave.employeeID || '',
            leaveTypeID: newLeave.leaveTypeID || '',
            workShiftID: newLeave.workShiftID || '',
            startDateTime: formatDateTimeLocal(newLeave.startDateTime),
            endDateTime: formatDateTimeLocal(newLeave.endDateTime),
            reason: newLeave.reason || ''
        }
        
        // No default employee selection - user must choose manually
    }
}, { immediate: true })
</script>
<template>
    <form @submit.prevent="handleSubmit">
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Số phiếu <span class="text-danger">*</span></label>
                <input 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.voucherCode }"
                    v-model="formData.voucherCode"
                    @blur="validateField('voucherCode')"
                    @input="validateField('voucherCode')"
                    :disabled="props.mode === 'detail'"
                    :readonly="props.mode === 'detail'"
                    maxlength="50"
                    placeholder="VD: NP-2024-001"
                />
                <div class="invalid-feedback">{{ errors.voucherCode }}</div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Nhân viên tạo đơn <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.employeeID" 
                    :class="{ 'is-invalid': errors.employeeID }"
                    @change="validateField('employeeID')"
                    :disabled="props.mode === 'detail'"
                >
                    <option value="">Chọn nhân viên</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                        {{ emp.employeeName }}
                    </option>
                </select>
                <div class="invalid-feedback">{{ errors.employeeID }}</div>
            </div>
        </div>
        
        <!-- Employee Leave Information -->
        <div v-if="employeeLeaveInfo" class="row g-3 mb-3">
            <div class="col-12">
                <div class="card border-light">
                    <div class="card-header bg-light">
                        <h6 class="mb-0 text-muted">
                            <i class="fas fa-info-circle me-2"></i>
                            Thông tin phép của {{ employeeLeaveInfo.employee.firstName }} {{ employeeLeaveInfo.employee.lastName }}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Phép năm {{ selectedYear }}</h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Tổng phép năm:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.totalLeave }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Phép thâm niên:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.seniorityLeave }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Đã sử dụng:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.totalUsed }} ngày</span>
                                </div>
                                <hr class="my-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Còn lại:</span>
                                    <span class="fw-bold" :class="employeeLeaveInfo.leaveRemain > 0 ? 'text-success' : 'text-danger'">
                                        {{ employeeLeaveInfo.leaveRemain }} ngày
                                    </span>
                                </div>
                                <div v-if="requestedDays > 0" class="d-flex justify-content-between">
                                    <span class="text-muted">Yêu cầu:</span>
                                    <span class="fw-bold">{{ requestedDays }} ngày</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Phép bù tăng ca {{ selectedYear }}</h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Tổng phép bù:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.otLeaveDays }} ngày</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Đã sử dụng:</span>
                                    <span class="fw-bold">{{ employeeLeaveInfo.otLeaveUsed }} ngày</span>
                                </div>
                                <hr class="my-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">Còn lại:</span>
                                    <span class="fw-bold" :class="employeeLeaveInfo.otLeaveRemain > 0 ? 'text-success' : 'text-danger'">
                                        {{ employeeLeaveInfo.otLeaveRemain }} ngày
                                    </span>
                                </div>
                                <div v-if="requestedDays > 0" class="d-flex justify-content-between">
                                    <span class="text-muted">Yêu cầu:</span>
                                    <span class="fw-bold">{{ requestedDays }} ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Loại nghỉ phép <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.leaveTypeID" 
                    :class="{ 'is-invalid': errors.leaveTypeID }"
                    @change="validateField('leaveTypeID')"
                    :disabled="props.mode === 'detail'"
                >
                    <option value="">Chọn loại nghỉ phép</option>
                    <option v-for="type in leaveTypes" :key="type.id" :value="type.id">
                        {{ type.leaveTypeName }}
                    </option>
                </select>
                <div class="invalid-feedback">{{ errors.leaveTypeID }}</div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Ca làm việc <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.workShiftID" 
                    :class="{ 'is-invalid': errors.workShiftID }"
                    @change="validateField('workShiftID')"
                    :disabled="props.mode === 'detail'"
                >
                    <option value="">Chọn ca làm việc</option>
                    <option v-for="shift in workshifts" :key="shift.id" :value="shift.id">
                        {{ shift.shiftName }}
                    </option>
                </select>
                <div class="invalid-feedback">{{ errors.workShiftID }}</div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Từ ngày <span class="text-danger">*</span></label>
                <input 
                    type="datetime-local" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.startDateTime }"
                    v-model="formData.startDateTime"
                    @blur="validateField('startDateTime')"
                    @change="validateField('startDateTime')"
                    :disabled="props.mode === 'detail'"
                    :readonly="props.mode === 'detail'"
                />
                <div class="invalid-feedback">{{ errors.startDateTime }}</div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Đến ngày <span class="text-danger">*</span></label>
                <input 
                    type="datetime-local" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.endDateTime }"
                    v-model="formData.endDateTime"
                    @blur="validateField('endDateTime')"
                    @change="validateField('endDateTime')"
                    :disabled="props.mode === 'detail'"
                    :readonly="props.mode === 'detail'"
                />
                <div class="invalid-feedback">{{ errors.endDateTime }}</div>
            </div>
        </div>
        <div class="row g-3">
            <div class="col-md-12">
                <label class="form-label">Lý do <span class="text-danger">*</span></label>
                <textarea 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.reason }"
                    v-model="formData.reason"
                    @blur="validateField('reason')"
                    @input="validateField('reason')"
                    :disabled="props.mode === 'detail'"
                    :readonly="props.mode === 'detail'"
                    rows="3"
                    maxlength="500"
                    placeholder="Nhập lý do nghỉ phép (tối đa 500 ký tự)..."
                ></textarea>
                <div class="invalid-feedback">{{ errors.reason }}</div>
                <small class="form-text text-muted">{{ (formData.reason || '').length }}/500 ký tự</small>
            </div>
        </div>
        <div v-if="props.mode !== 'detail'" class="mt-4 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Đang xử lý...' : (props.mode === 'update' ? 'Cập nhật' : 'Tạo mới') }}
            </button>
            <!-- Show "Gửi duyệt" button only for update mode and when status is "Tạo mới" (0) -->
            <button 
                v-if="props.mode === 'update' && (props.leave.approveStatus == 0 || props.leave.approveStatus === '0')" 
                type="button" 
                class="btn btn-success" 
                @click="handleSubmitForApproval"
                :disabled="loading"
            >
                {{ loading ? 'Đang xử lý...' : 'Gửi duyệt' }}
            </button>
        </div>
        <div v-else class="mt-4 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="handleClose">Đóng</button>
        </div>
    </form>
</template>
