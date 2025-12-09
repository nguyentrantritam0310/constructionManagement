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

// Regex patterns cho validation
const regexPatterns = {
    // ID nhân viên: chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-20
    id: /^[A-Za-z0-9_-]{1,20}$/,
    // Họ và tên đệm (firstName): chữ cái, dấu tiếng Việt, khoảng trắng, không giới hạn độ dài
    firstName: /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]+$/,
    // Tên nhân viên (lastName): chữ cái, dấu tiếng Việt, độ dài 1-30
    lastName: /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]{1,30}$/,
    // Ngày sinh: định dạng YYYY-MM-DD
    date: /^\d{4}-\d{2}-\d{2}$/,
    // Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
    phone: /^0[3|5|7|8|9][0-9]{8}$/,
    // Email: định dạng email chuẩn
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    // Giới tính: Nam, Nữ, Khác
    gender: /^(Nam|Nữ|Khác)$/,
    // ID: chỉ số nguyên dương
    idNumber: /^[1-9]\d*$/
}

// Validation errors
const errors = ref({
    id: '',
    lastName: '',
    firstName: '',
    birthday: '',
    joinDate: '',
    phone: '',
    email: '',
    gender: '',
    roleID: ''
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
            firstName: newEmployee.lastName ?? '',
            lastName: newEmployee.firstName ?? '',
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

// Validation functions
const validateID = () => {
    const value = formData.value.id?.trim()
    if (!value) {
        errors.value.id = 'ID nhân viên không được để trống'
        return false
    }
    if (!regexPatterns.id.test(value)) {
        errors.value.id = 'ID nhân viên chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 20 ký tự)'
        return false
    }
    errors.value.id = ''
    return true
}

const validateFirstName = () => {
    const value = formData.value.firstName?.trim()
    if (!value) {
        errors.value.firstName = 'Họ và tên đệm không được để trống'
        return false
    }
    if (!regexPatterns.firstName.test(value)) {
        errors.value.firstName = 'Họ và tên đệm chỉ được chứa chữ cái, dấu tiếng Việt và khoảng trắng'
        return false
    }
    errors.value.firstName = ''
    return true
}

const validateLastName = () => {
    const value = formData.value.lastName?.trim()
    if (!value) {
        errors.value.lastName = 'Tên nhân viên không được để trống'
        return false
    }
    if (!regexPatterns.lastName.test(value)) {
        errors.value.lastName = 'Tên nhân viên chỉ được chứa chữ cái và dấu tiếng Việt (tối đa 30 ký tự)'
        return false
    }
    errors.value.lastName = ''
    return true
}

const validateBirthday = () => {
    const value = formData.value.birthday
    if (!value) {
        errors.value.birthday = 'Ngày sinh không được để trống'
        return false
    }
    if (!regexPatterns.date.test(value)) {
        errors.value.birthday = 'Định dạng ngày sinh không hợp lệ'
        return false
    }
    
    const birthday = new Date(value)
    if (isNaN(birthday.getTime())) {
        errors.value.birthday = 'Ngày sinh không hợp lệ'
        return false
    }
    
    // Ngày sinh không được quá tương lai
    if (birthday > new Date()) {
        errors.value.birthday = 'Ngày sinh không được lớn hơn ngày hiện tại'
        return false
    }
    
    // Ngày sinh phải hợp lý (ít nhất 16 tuổi, tối đa 100 tuổi)
    const age = new Date().getFullYear() - birthday.getFullYear()
    if (age < 16) {
        errors.value.birthday = 'Nhân viên phải ít nhất 16 tuổi'
        return false
    }
    if (age > 100) {
        errors.value.birthday = 'Ngày sinh không hợp lệ'
        return false
    }
    
    // Ngày sinh phải trước ngày vào làm
    if (formData.value.joinDate) {
        const joinDate = new Date(formData.value.joinDate)
        if (!isNaN(joinDate.getTime()) && birthday >= joinDate) {
            errors.value.birthday = 'Ngày sinh phải trước ngày vào làm'
            return false
        }
    }
    
    errors.value.birthday = ''
    return true
}

const validateJoinDate = () => {
    const value = formData.value.joinDate
    if (!value) {
        errors.value.joinDate = 'Ngày vào làm không được để trống'
        return false
    }
    if (!regexPatterns.date.test(value)) {
        errors.value.joinDate = 'Định dạng ngày vào làm không hợp lệ'
        return false
    }
    
    const joinDate = new Date(value)
    if (isNaN(joinDate.getTime())) {
        errors.value.joinDate = 'Ngày vào làm không hợp lệ'
        return false
    }
    
    // Ngày vào làm không được quá tương lai
    if (joinDate > new Date()) {
        errors.value.joinDate = 'Ngày vào làm không được lớn hơn ngày hiện tại'
        return false
    }
    
    // Ngày vào làm phải sau ngày sinh
    if (formData.value.birthday) {
        const birthday = new Date(formData.value.birthday)
        if (!isNaN(birthday.getTime()) && birthday >= joinDate) {
            errors.value.joinDate = 'Ngày vào làm phải sau ngày sinh'
            return false
        }
    }
    
    errors.value.joinDate = ''
    return true
}

const validatePhone = () => {
    const value = formData.value.phone?.trim()
    if (!value) {
        errors.value.phone = 'Số điện thoại không được để trống'
        return false
    }
    // Loại bỏ khoảng trắng và dấu gạch ngang
    const cleanPhone = value.replace(/[\s-]/g, '')
    if (!regexPatterns.phone.test(cleanPhone)) {
        errors.value.phone = 'Số điện thoại phải là 10 số, bắt đầu bằng 0 (ví dụ: 0912345678)'
        return false
    }
    errors.value.phone = ''
    return true
}

const validateEmail = () => {
    const value = formData.value.email?.trim()
    if (!value) {
        errors.value.email = 'Email không được để trống'
        return false
    }
    if (!regexPatterns.email.test(value)) {
        errors.value.email = 'Định dạng email không hợp lệ (ví dụ: example@domain.com)'
        return false
    }
    // Kiểm tra độ dài email
    if (value.length > 100) {
        errors.value.email = 'Email không được vượt quá 100 ký tự'
        return false
    }
    errors.value.email = ''
    return true
}

const validateGender = () => {
    const value = formData.value.gender
    if (!value) {
        errors.value.gender = 'Vui lòng chọn giới tính'
        return false
    }
    if (!regexPatterns.gender.test(value)) {
        errors.value.gender = 'Giới tính không hợp lệ'
        return false
    }
    errors.value.gender = ''
    return true
}

const validateRoleID = () => {
    const value = formData.value.roleID
    if (!value) {
        errors.value.roleID = 'Vui lòng chọn chức danh'
        return false
    }
    if (!regexPatterns.idNumber.test(String(value))) {
        errors.value.roleID = 'Chức danh không hợp lệ'
        return false
    }
    errors.value.roleID = ''
    return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
    switch (fieldName) {
        case 'id':
            validateID()
            break
        case 'lastName':
            validateLastName()
            break
        case 'firstName':
            validateFirstName()
            break
        case 'birthday':
            validateBirthday()
            // Re-validate join date when birthday changes
            if (formData.value.joinDate) {
                validateJoinDate()
            }
            break
        case 'joinDate':
            validateJoinDate()
            // Re-validate birthday when join date changes
            if (formData.value.birthday) {
                validateBirthday()
            }
            break
        case 'phone':
            validatePhone()
            break
        case 'email':
            validateEmail()
            break
        case 'gender':
            validateGender()
            break
        case 'roleID':
            validateRoleID()
            break
    }
}

// Validate toàn bộ form
const validateForm = () => {
    const validations = [
        validateID(),
        validateLastName(),
        validateFirstName(),
        validateBirthday(),
        validateJoinDate(),
        validatePhone(),
        validateEmail(),
        validateGender(),
        validateRoleID()
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
    
    // Password validation removed - default password is set automatically for create mode
    emit('submit', {
        ...formData.value,
        id: formData.value.id.trim(),
        firstName: formData.value.firstName.trim(),
        lastName: formData.value.lastName.trim(),
        phone: formData.value.phone.trim().replace(/[\s-]/g, ''),
        email: formData.value.email.trim()
    })
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
                        <label class="form-label">ID nhân viên <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.id }"
                            v-model="formData.id"
                            @blur="validateField('id')"
                            @input="validateField('id')"
                            :readonly="mode === 'update'"
                            maxlength="20"
                            placeholder="VD: NV001"
                        />
                        <div class="invalid-feedback">{{ errors.id }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Họ và tên đệm <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.firstName }"
                            v-model="formData.firstName"
                            @blur="validateField('firstName')"
                            @input="validateField('firstName')"
                            placeholder="VD: Nguyễn Văn"
                        />
                        <div class="invalid-feedback">{{ errors.firstName }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Tên nhân viên <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.lastName }"
                            v-model="formData.lastName"
                            @blur="validateField('lastName')"
                            @input="validateField('lastName')"
                            maxlength="30"
                            placeholder="VD: An"
                        />
                        <div class="invalid-feedback">{{ errors.lastName }}</div>
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
                        <label class="form-label">Ngày sinh <span class="text-danger">*</span></label>
                        <input 
                            type="date" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.birthday }"
                            v-model="formData.birthday"
                            @blur="validateField('birthday')"
                            @change="validateField('birthday')"
                            :max="new Date().toISOString().split('T')[0]"
                        />
                        <div class="invalid-feedback">{{ errors.birthday }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Ngày vào làm <span class="text-danger">*</span></label>
                        <input 
                            type="date" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.joinDate }"
                            v-model="formData.joinDate"
                            @blur="validateField('joinDate')"
                            @change="validateField('joinDate')"
                            :max="new Date().toISOString().split('T')[0]"
                        />
                        <div class="invalid-feedback">{{ errors.joinDate }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Giới tính <span class="text-danger">*</span></label>
                        <select 
                            class="form-select" 
                            :class="{ 'is-invalid': errors.gender }"
                            v-model="formData.gender"
                            @change="validateField('gender')"
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                        <div class="invalid-feedback">{{ errors.gender }}</div>
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
                        <label class="form-label">Email <span class="text-danger">*</span></label>
                        <input 
                            type="email" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.email }"
                            v-model="formData.email"
                            @blur="validateField('email')"
                            @input="validateField('email')"
                            maxlength="100"
                            placeholder="VD: example@domain.com"
                        />
                        <div class="invalid-feedback">{{ errors.email }}</div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                        <input 
                            type="text" 
                            class="form-control" 
                            :class="{ 'is-invalid': errors.phone }"
                            v-model="formData.phone"
                            @blur="validateField('phone')"
                            @input="validateField('phone')"
                            maxlength="11"
                            placeholder="VD: 0912345678"
                        />
                        <div class="invalid-feedback">{{ errors.phone }}</div>
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
                        <select 
                            class="form-select" 
                            :class="{ 'is-invalid': errors.roleID }"
                            v-model="formData.roleID"
                            @change="validateField('roleID')"
                        >
                            <option value="">Chọn chức danh</option>
                            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
                                {{ role.text }}
                            </option>
                        </select>
                        <div class="invalid-feedback">{{ errors.roleID }}</div>
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
                <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
                <button type="submit" class="btn btn-primary" :disabled="loading">
                    {{ loading ? 'Đang xử lý...' : (props.mode === 'update' ? 'Cập nhật' : 'Tạo mới') }}
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
