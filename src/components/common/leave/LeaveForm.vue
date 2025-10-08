<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'
import { useWorkShift } from '../../../composables/useWorkShift.js'
import { useLeaveType } from '../../../composables/useLeaveType.js'
import { useEmployee } from '@/composables/useEmployee'

const props = defineProps({
    mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
    leave: { type: Object, default: () => ({}) },
    employees: { type: Array, default: () => [] },
    leaveTypes: { type: Array, default: () => [] },
    workShifts: { type: Array, default: () => [] },
    currentUser: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit'])

// Composables
const { employees, fetchAllEmployees } = useEmployee()
const { workshifts, fetchWorkShifts } = useWorkShift()
const { leaveTypes, fetchLeaveTypes } = useLeaveType()

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

// Load data on mount
onMounted(async () => {
    try {
        await Promise.all([
            fetchAllEmployees(), // Lấy tất cả employees
            fetchWorkShifts(),
            fetchLeaveTypes()
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
        </div>
    </form>
</template>
