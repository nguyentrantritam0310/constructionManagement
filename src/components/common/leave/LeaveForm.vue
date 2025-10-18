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
    mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
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
        return 0
    }
    
    const employeeLeaveRequests = leaveRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus)
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
const calculateTotalOTLeaveDays = (employeeId) => {
    if (!overtimeRequests.value || overtimeRequests.value.length === 0) {
        return 0
    }
    
    const employeeOTRequests = overtimeRequests.value.filter(request => 
        request.employeeID === employeeId && 
        isApprovedStatus(request.approveStatus) &&
        request.overtimeFormID === 2 // Only "Tăng ca nghỉ bù" (overtime leave compensation)
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
    const totalUsed = calculateTotalUsedLeave(employee.id)
    const leaveRemain = Math.max(0, totalLeave - totalUsed)
    
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


const validateForm = () => {
    errors.value = {}
    
    if (!formData.value.voucherCode.trim()) {
        errors.value.voucherCode = 'Số phiếu là bắt buộc'
    }
    
    if (!formData.value.employeeID) {
        errors.value.employeeID = 'Nhân viên là bắt buộc'
    }
    
    if (!formData.value.leaveTypeID) {
        errors.value.leaveTypeID = 'Loại nghỉ phép là bắt buộc'
    }
    
    if (!formData.value.workShiftID) {
        errors.value.workShiftID = 'Ca làm việc là bắt buộc'
    }
    
    if (!formData.value.startDateTime) {
        errors.value.startDateTime = 'Ngày bắt đầu là bắt buộc'
    }
    
    if (!formData.value.endDateTime) {
        errors.value.endDateTime = 'Ngày kết thúc là bắt buộc'
    }
    
    if (!formData.value.reason.trim()) {
        errors.value.reason = 'Lý do là bắt buộc'
    }
    
    // Validate date range
    if (formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        
        if (startDate >= endDate) {
            errors.value.endDateTime = 'Ngày kết thúc phải sau ngày bắt đầu'
        }
        
        // Validate time range against work shift
        if (formData.value.workShiftID) {
            const selectedWorkShift = workshifts.value.find(shift => shift.id == formData.value.workShiftID)
            if (selectedWorkShift && selectedWorkShift.shiftDetails) {
                // Get the day of week for start date
                const startDayOfWeek = startDate.getDay()
                const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
                const startDayName = dayNames[startDayOfWeek]
                
                // Find shift details for the start day
                const startDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === startDayName)
                
                if (startDayShiftDetail && startDayShiftDetail.startTime !== '00:00:00' && startDayShiftDetail.endTime !== '00:00:00') {
                    // Extract time from datetime
                    const startTime = startDate.toTimeString().substring(0, 8) // HH:mm:ss
                    const endTime = endDate.toTimeString().substring(0, 8) // HH:mm:ss
                    
                    // Check if start time is within shift hours
                    if (startTime < startDayShiftDetail.startTime || startTime > startDayShiftDetail.endTime) {
                        errors.value.startDateTime = `Giờ bắt đầu phải trong khoảng ${startDayShiftDetail.startTime.substring(0, 5)} - ${startDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    }
                    
                    // Check if end time is within shift hours
                    if (endTime < startDayShiftDetail.startTime || endTime > startDayShiftDetail.endTime) {
                        errors.value.endDateTime = `Giờ kết thúc phải trong khoảng ${startDayShiftDetail.startTime.substring(0, 5)} - ${startDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    }
                }
                
                // For multi-day leaves, also check end day
                const endDayOfWeek = endDate.getDay()
                const endDayName = dayNames[endDayOfWeek]
                const endDayShiftDetail = selectedWorkShift.shiftDetails.find(detail => detail.dayOfWeek === endDayName)
                
                if (endDayShiftDetail && endDayShiftDetail.startTime !== '00:00:00' && endDayShiftDetail.endTime !== '00:00:00') {
                    const endTime = endDate.toTimeString().substring(0, 8) // HH:mm:ss
                    
                    // Check if end time is within shift hours
                    if (endTime < endDayShiftDetail.startTime || endTime > endDayShiftDetail.endTime) {
                        errors.value.endDateTime = `Giờ kết thúc phải trong khoảng ${endDayShiftDetail.startTime.substring(0, 5)} - ${endDayShiftDetail.endTime.substring(0, 5)} của ca làm việc`
                    }
                }
            }
        }
    }
    
    // Validate leave days availability
    if (formData.value.employeeID && formData.value.startDateTime && formData.value.endDateTime) {
        const startDate = new Date(formData.value.startDateTime)
        const endDate = new Date(formData.value.endDateTime)
        const requestedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        
        const leaveInfo = employeeLeaveInfo.value
        if (leaveInfo) {
            const selectedLeaveType = leaveTypes.value.find(type => type.id == formData.value.leaveTypeID)
            
            if (selectedLeaveType) {
                if (selectedLeaveType.leaveTypeName === 'Phép năm' && leaveInfo.leaveRemain < requestedDays) {
                    errors.value.leaveTypeID = `Không đủ phép năm. Còn lại: ${leaveInfo.leaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                } else if (selectedLeaveType.leaveTypeName === 'Nghỉ bù' && leaveInfo.otLeaveRemain < requestedDays) {
                    errors.value.leaveTypeID = `Không đủ phép bù tăng ca. Còn lại: ${leaveInfo.otLeaveRemain} ngày, yêu cầu: ${requestedDays} ngày`
                }
            }
        }
    }
    
    return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
    if (validateForm()) {
        // Convert datetime-local to proper format for API
        const submitData = {
            ...formData.value,
            startDateTime: new Date(formData.value.startDateTime).toISOString(),
            endDateTime: new Date(formData.value.endDateTime).toISOString()
        }
        emit('submit', submitData)
    }
}

const handleClose = () => emit('close')

const handleSubmitForApproval = () => {
    if (validateForm()) {
        // Convert datetime-local to proper format for API
        const submitData = {
            ...formData.value,
            startDateTime: new Date(formData.value.startDateTime).toISOString(),
            endDateTime: new Date(formData.value.endDateTime).toISOString()
        }
        emit('submit-for-approval', submitData.voucherCode)
    }
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

// Watch for changes in leave prop
watch(() => props.leave, (newLeave) => {
    if (newLeave && Object.keys(newLeave).length > 0) {
        formData.value = {
            voucherCode: newLeave.voucherCode || '',
            employeeID: newLeave.employeeID || '',
            leaveTypeID: newLeave.leaveTypeID || '',
            workShiftID: newLeave.workShiftID || '',
            startDateTime: newLeave.startDateTime ? new Date(newLeave.startDateTime).toISOString().slice(0, 16) : '',
            endDateTime: newLeave.endDateTime ? new Date(newLeave.endDateTime).toISOString().slice(0, 16) : '',
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
                <FormField 
                    label="Số phiếu" 
                    type="text" 
                    v-model="formData.voucherCode" 
                    :error="errors.voucherCode"
                    required 
                />
            </div>
            <div class="col-md-6">
                <label class="form-label">Nhân viên tạo đơn <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.employeeID" 
                    :class="{ 'is-invalid': errors.employeeID }"
                >
                    <option value="">Chọn nhân viên</option>
                    <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                        {{ emp.employeeName }}
                    </option>
                </select>
                <div v-if="errors.employeeID" class="invalid-feedback">
                    {{ errors.employeeID }}
                </div>
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
                >
                    <option value="">Chọn loại nghỉ phép</option>
                    <option v-for="type in leaveTypes" :key="type.id" :value="type.id">
                        {{ type.leaveTypeName }}
                    </option>
                </select>
                <div v-if="errors.leaveTypeID" class="invalid-feedback">
                    {{ errors.leaveTypeID }}
                </div>
            </div>
            <div class="col-md-6">
                <label class="form-label">Ca làm việc <span class="text-danger">*</span></label>
                <select 
                    class="form-select" 
                    v-model="formData.workShiftID" 
                    :class="{ 'is-invalid': errors.workShiftID }"
                >
                    <option value="">Chọn ca làm việc</option>
                    <option v-for="shift in workshifts" :key="shift.id" :value="shift.id">
                        {{ shift.shiftName }}
                    </option>
                </select>
                <div v-if="errors.workShiftID" class="invalid-feedback">
                    {{ errors.workShiftID }}
                </div>
            </div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-6">
                <FormField 
                    label="Từ ngày" 
                    type="datetime-local" 
                    v-model="formData.startDateTime" 
                    :error="errors.startDateTime"
                    required 
                />
            </div>
            <div class="col-md-6">
                <FormField 
                    label="Đến ngày" 
                    type="datetime-local" 
                    v-model="formData.endDateTime" 
                    :error="errors.endDateTime"
                    required 
                />
            </div>
        </div>
        <div class="row g-3">
            <div class="col-md-12">
                <FormField 
                    label="Lý do" 
                    type="textarea" 
                    v-model="formData.reason" 
                    :error="errors.reason"
                    required 
                />
            </div>
        </div>
        <div class="mt-4 d-flex justify-content-end gap-2">
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
    </form>
</template>
