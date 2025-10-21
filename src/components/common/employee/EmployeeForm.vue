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
    id: '',
    lastName: '',
    firstName: '',
    birthday: '',
    joinDate: '',
    phone: '',
    email: '',
    gender: '',
    roleID: '',
    employeeCode: '',
    // password: generated automatically by backend
    status: '0' // Default value, will be updated by watch function
})

// Watch for changes in employee prop
watch(() => props.employee, (newEmployee) => {
    if (newEmployee && props.mode === 'update') {
        // Update mode - populate form with employee data
        // Convert string status to number for form options
        let statusValue = '0' // Default to Active
        if (typeof newEmployee.status === 'string') {
            switch (newEmployee.status) {
                case 'Active':
                    statusValue = '0'
                    break
                case 'Resigned':
                    statusValue = '1'
                    break
                case 'MaternityLeave':
                    statusValue = '2'
                    break
                default:
                    statusValue = '0'
            }
        } else {
            statusValue = newEmployee.status?.toString() ?? '0'
        }
        
        formData.value = {
            id: newEmployee.id ?? newEmployee.employeeCode ?? '',
            lastName: newEmployee.lastName ?? '',
            firstName: newEmployee.firstName ?? '',
            birthday: formatDateForInput(newEmployee.birthday),
            joinDate: formatDateForInput(newEmployee.joinDate),
            phone: newEmployee.phone ?? '',
            email: newEmployee.email ?? '',
            gender: newEmployee.gender ?? '',
            roleID: newEmployee.roleID ?? newEmployee.RoleID ?? '',
            employeeCode: newEmployee.employeeCode ?? newEmployee.id ?? '',
            status: statusValue
        }
    } else if (!newEmployee && props.mode === 'create') {
        // Create mode - reset form to default values
        formData.value = {
            id: '',
            lastName: '',
            firstName: '',
            birthday: '',
            joinDate: '',
            phone: '',
            email: '',
            gender: '',
            roleID: '',
            employeeCode: '',
            status: '0' // Default status for new employee
        }
    }
}, { deep: true, immediate: true })

// Watch for changes in roles prop
watch(() => props.roles, (newRoles) => {
    // Roles prop changed
}, { deep: true, immediate: true })

// Computed property for role options
const roleOptions = computed(() => {
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

    emit('submit', formData.value)
}

const handleClose = () => emit('close')
</script>
<template>
    <div class="form-card">
        <form @submit.prevent="handleSubmit">
            <!-- Thông tin cơ bản -->
            <div class="form-group">
                <h6 class="group-title">
                    <i class="fas fa-id-card me-2"></i>
                    Thông tin cơ bản
                </h6>
                <div class="row g-4">
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
            </div>
            <!-- Thông tin cá nhân -->
            <div class="form-group">
                <h6 class="group-title">
                    <i class="fas fa-user me-2"></i>
                    Thông tin cá nhân
                </h6>
                <div class="row g-4">
                    <div class="col-md-4">
                        <FormField label="Ngày sinh" type="date" v-model="formData.birthday" required />
                    </div>
                    <div class="col-md-4">
                        <FormField label="Ngày vào làm" type="date" v-model="formData.joinDate" required />
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
                </div>
            </div>
            <!-- Thông tin liên hệ -->
            <div class="form-group">
                <h6 class="group-title">
                    <i class="fas fa-address-book me-2"></i>
                    Thông tin liên hệ
                </h6>
                <div class="row g-4">
                    <div class="col-md-6">
                        <FormField label="Email" type="email" v-model="formData.email" required />
                    </div>
                    <div class="col-md-6">
                        <FormField label="Số điện thoại" type="text" v-model="formData.phone" required />
                    </div>
                </div>
            </div>

            <!-- Thông tin công việc -->
            <div class="form-group">
                <h6 class="group-title">
                    <i class="fas fa-briefcase me-2"></i>
                    Thông tin công việc
                </h6>
                <div class="row g-4">
                    <div class="col-md-6">
                        <label class="form-label">Chức danh <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="formData.roleID" required>
                            <option value="">Chọn chức danh</option>
                            <option v-for="role in roleOptions" :key="role.value" :value="role.value" :selected="formData.roleID == role.value">{{ role.text }}</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Trạng thái</label>
                        <select class="form-select" v-model="formData.status">
                            <option value="0">Đang làm việc</option>
                            <option value="1">Nghỉ việc</option>
                            <option value="2">Nghỉ thai sản</option>
                        </select>
                    </div>
                </div>
            </div>
            <!-- Thông báo cho chế độ tạo mới -->
            <div v-if="mode === 'create'" class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Lưu ý:</strong> Mật khẩu sẽ được tạo tự động và gửi qua email cho nhân viên.
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
.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
}

/* Form Groups */
.form-group {
  margin-bottom: 1.25rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.group-title {
  background: #f8f9fa;
  margin: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  color: #495057;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
}

.group-title i {
  color: #6c757d;
  font-size: 1rem;
}

.form-group .row {
  padding: 1rem;
  margin: 0;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-select {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.95rem;
}

.form-select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn {
  border-radius: 4px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s ease;
}

.btn-outline-secondary:hover {
  transform: translateY(-1px);
}

.btn-primary:hover {
  transform: translateY(-1px);
}

/* Alert styling */
.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.alert-info i {
  color: #0c5460;
}

/* Responsive */
@media (max-width: 768px) {
  .form-card {
    padding: 0.75rem;
  }
  
  .form-group .row {
    padding: 0.75rem;
  }
  
  .group-title {
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
}
</style>
