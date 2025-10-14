<script setup>
import { ref, computed, watch } from 'vue'
import FormField from '../FormField.vue'

const props = defineProps({
    mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
    employee: { type: Object, default: () => ({}) },
    roles: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'submit'])

// Helper function to format date for input field
const formatDateForInput = (dateValue) => {
    if (!dateValue) return ''
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const formData = ref({
    id: props.employee?.id ?? props.employee?.employeeCode ?? '', // Use ID as primary key
    lastName: props.employee?.lastName ?? '',
    firstName: props.employee?.firstName ?? '',
    birthday: formatDateForInput(props.employee?.birthday),
    joinDate: formatDateForInput(props.employee?.joinDate),
    phone: props.employee?.phone ?? '',
    email: props.employee?.email ?? '',
    gender: props.employee?.gender ?? '',
    roleID: props.employee?.roleID ?? '',
    // password: generated automatically by backend
    status: props.mode === 'create' ? 0 : (props.employee?.status ?? 0) // Default to Active (0) for create mode
})

// Watch for changes in employee prop
watch(() => props.employee, (newEmployee) => {
    console.log('Employee prop changed:', newEmployee)
    if (newEmployee) {
        formData.value = {
            id: newEmployee.id ?? newEmployee.employeeCode ?? '', // Use ID as primary key
            lastName: newEmployee.lastName ?? '',
            firstName: newEmployee.firstName ?? '',
            birthday: formatDateForInput(newEmployee.birthday),
            joinDate: formatDateForInput(newEmployee.joinDate),
            phone: newEmployee.phone ?? '',
            email: newEmployee.email ?? '',
            gender: newEmployee.gender ?? '',
            roleID: newEmployee.roleID ?? newEmployee.RoleID ?? '',
            // password: generated automatically by backend
            status: newEmployee.status ?? 0
        }
        console.log('Form data updated:', formData.value)
    }
}, { deep: true, immediate: true })

// Watch for changes in roles prop
watch(() => props.roles, (newRoles) => {
    console.log('Roles prop changed:', newRoles)
}, { deep: true, immediate: true })

// Computed property for role options
const roleOptions = computed(() => {
    console.log('Roles in form:', props.roles)
    if (!props.roles || !Array.isArray(props.roles)) {
        return []
    }
    return props.roles.map(role => ({
        value: role.id || role.ID,
        text: role.roleName || role.RoleName
    }))
})

const handleSubmit = () => {
    // Validate required fields
    if (!formData.value.id || !formData.value.firstName || !formData.value.lastName || !formData.value.email || !formData.value.phone) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
    }

    if (!formData.value.gender) {
        alert('Vui lòng chọn giới tính')
        return
    }

    if (!formData.value.roleID) {
        alert('Vui lòng chọn chức danh')
        return
    }

    // Password validation removed - default password is set automatically for create mode

    console.log('Submitting form data:', formData.value)
    emit('submit', formData.value)
}

const handleClose = () => emit('close')
</script>
<template>
    <div class="form-card">
        <form @submit.prevent="handleSubmit">
            <div class="row g-4 mb-3">
                <div class="col-md-4">
                    <FormField 
                        label="ID nhân viên" 
                        type="text" 
                        v-model="formData.id" 
                        :readonly="mode === 'update'"
                        required 
                    />
                </div>
                <div class="col-md-4">
                    <FormField label="Họ và tên đệm" type="text" v-model="formData.lastName" required />
                </div>
                <div class="col-md-4">
                    <FormField label="Tên nhân viên" type="text" v-model="formData.firstName" required />
                </div>
            </div>
            <div class="row g-4 mb-3">
                <div class="col-md-4">
                    <FormField label="Ngày sinh" type="date" v-model="formData.birthday" required />
                </div>
                <div class="col-md-4">
                    <FormField label="Ngày vào làm" type="date" v-model="formData.joinDate" required />
                </div>
                <div class="col-md-4">
                    <FormField label="Số điện thoại" type="text" v-model="formData.phone" required />
                </div>
            </div>
            <div class="row g-4 mb-3">
                <div class="col-md-4">
                    <FormField label="Email" type="email" v-model="formData.email" required />
                </div>
                <div class="col-md-4">
                    <label class="form-label">Giới tính <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="formData.gender" required>
                        <option value="">Chọn giới tính</option>
                        <option value="Nam" :selected="formData.gender === 'Nam'">Nam</option>
                        <option value="Nữ" :selected="formData.gender === 'Nữ'">Nữ</option>
                        <option value="Khác" :selected="formData.gender === 'Khác'">Khác</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Chức danh <span class="text-danger">*</span></label>
                    <select class="form-select" v-model="formData.roleID" required>
                        <option value="">Chọn chức danh</option>
                        <option v-for="role in roleOptions" :key="role.value" :value="role.value" :selected="formData.roleID == role.value">{{ role.text }}</option>
                    </select>
                </div>
            </div>
            <div class="row g-4 mb-3" v-if="mode === 'update'">
                <div class="col-md-6">
                    <label class="form-label">Trạng thái</label>
                    <select class="form-select" v-model="formData.status">
                        <option value="0" :selected="formData.status == 0">Đang làm việc</option>
                        <option value="1" :selected="formData.status == 1">Nghỉ việc</option>
                        <option value="2" :selected="formData.status == 2">Nghỉ thai sản</option>
                    </select>
                </div>
            </div>
            <div class="row g-4 mb-3" v-if="mode === 'create'">
                <div class="col-md-6">
                    <label class="form-label">Trạng thái</label>
                    <select class="form-select" v-model="formData.status">
                        <option value="0" :selected="formData.status == 0">Đang làm việc</option>
                        <option value="1" :selected="formData.status == 1">Nghỉ việc</option>
                        <option value="2" :selected="formData.status == 2">Nghỉ thai sản</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <strong>Lưu ý:</strong> Mật khẩu sẽ được tạo tự động và gửi qua email cho nhân viên.
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-outline-secondary btn-lg" @click="handleClose">
                    <i class="fas fa-times me-1"></i> Hủy
                </button>
                <button type="submit" class="btn btn-primary btn-gradient btn-lg">
                    <i class="fas fa-save me-1"></i> {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
                </button>
            </div>
        </form>
    </div>
</template>
<style scoped>

</style>
