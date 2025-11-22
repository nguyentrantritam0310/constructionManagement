<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import FormField from '../FormField.vue'
import { employeeService } from '../../../services/employeeService'
import api from '../../../api'

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
  adjustment: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['close', 'submit'])

const employees = ref([])
const adjustmentTypes = ref([])
const adjustmentItems = ref([])
const selectedEmployees = ref([])
const currentYear = new Date().getFullYear()

// Regex patterns cho validation
const regexPatterns = {
  // Số phiếu: chỉ cho phép chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  voucherNo: /^[A-Za-z0-9_-]{1,50}$/,
  // Ngày quyết định: định dạng YYYY-MM-DD
  decisionDate: /^\d{4}-\d{2}-\d{2}$/,
  // Tháng: số từ 1-12
  month: /^(0?[1-9]|1[0-2])$/,
  // Năm: từ 1900 đến 2100
  year: /^(19|20)\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Lý do: cho phép chữ, số, khoảng trắng, dấu câu, độ dài tối đa 500
  reason: /^[\s\S]{0,500}$/,
  // Giá trị: số thập phân dương (cho phép số âm trong trường hợp điều chỉnh trừ)
  value: /^-?\d+(\.\d{1,2})?$/
}

// Validation errors
const errors = ref({
  voucherNo: '',
  decisionDate: '',
  month: '',
  year: '',
  adjustmentTypeID: '',
  adjustmentItemID: '',
  reason: '',
  employees: ''
})

// Helper function to format date for input field
const formatDateForInput = (dateValue) => {
  if (!dateValue) return ''
  
  // Nếu đã là định dạng YYYY-MM-DD, trả về luôn
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.split('T')[0]
  }
  
  // Thử parse nhiều format khác nhau
  let date
  if (typeof dateValue === 'string') {
    // Thử parse format dd/MM/yyyy (Việt Nam)
    const viFormat = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (viFormat) {
      date = new Date(`${viFormat[3]}-${viFormat[2]}-${viFormat[1]}`)
    } else {
      date = new Date(dateValue)
    }
  } else {
    date = new Date(dateValue)
  }
  
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const initializeFormData = () => {
  return {
    voucherNo: props.adjustment.voucherNo || '',
    decisionDate: formatDateForInput(props.adjustment.decisionDate || props.adjustment.DecisionDate),
    month: props.adjustment.Month || props.adjustment.month || '',
    year: props.adjustment.Year || props.adjustment.year || currentYear,
    adjustmentTypeID: props.adjustment.AdjustmentTypeID || props.adjustment.adjustmentTypeID || '',
    adjustmentItemID: props.adjustment.AdjustmentItemID || props.adjustment.adjustmentItemID || '',
    reason: props.adjustment.Reason || props.adjustment.reason || '',
    employees: props.adjustment.Employees || props.adjustment.employees || []
  }
}

const formData = ref(initializeFormData())

// Watch props.adjustment để cập nhật formData khi props thay đổi
watch(() => props.adjustment, async (newAdjustment) => {
  if (newAdjustment && Object.keys(newAdjustment).length > 0) {
    formData.value = initializeFormData()
    
    // Cập nhật danh sách nhân viên
    if (newAdjustment.Employees || newAdjustment.employees) {
      selectedEmployees.value = (newAdjustment.Employees || newAdjustment.employees).map(emp => ({
        employeeID: emp.EmployeeID || emp.employeeID,
        employeeName: emp.EmployeeName || emp.employeeName,
        value: emp.Value || emp.value
      }))
    } else {
      selectedEmployees.value = []
    }
    
    // Load adjustment items nếu có adjustmentTypeID
    if (formData.value.adjustmentTypeID) {
      try {
        await onAdjustmentTypeChange()
        if (newAdjustment.AdjustmentItemID || newAdjustment.adjustmentItemID) {
          formData.value.adjustmentItemID = newAdjustment.AdjustmentItemID || newAdjustment.adjustmentItemID
        }
      } catch (error) {
        console.error('Error loading adjustment items in watch:', error)
      }
    } else {
      adjustmentItems.value = []
    }
  }
}, { deep: true, immediate: true })

// Debug logging
console.log('Form initialized with props:', props.adjustment)
console.log('Form data:', formData.value)

const monthYear = computed(() => {
  return `${String(formData.value.month).padStart(2, '0')}/${formData.value.year}`
})

const addEmployeeRow = () => {
  selectedEmployees.value.push({
    employeeID: '',
    employeeName: '',
    value: 0
  })
}

const removeEmployeeRow = (index) => {
  selectedEmployees.value.splice(index, 1)
}

const updateEmployeeName = (index, employeeID) => {
  const employee = employees.value.find(emp => emp.id === employeeID)
  if (employee) {
    selectedEmployees.value[index].employeeName = employee.employeeName
  }
}

const onAdjustmentTypeChange = async () => {
  if (formData.value.adjustmentTypeID) {
    try {
      const response = await api.get(`/AdjustmentItem/by-type/${formData.value.adjustmentTypeID}`)
      adjustmentItems.value = response.data
      return Promise.resolve()
    } catch (error) {
      console.error('Error loading adjustment items:', error)
      return Promise.reject(error)
    }
  } else {
    adjustmentItems.value = []
    return Promise.resolve()
  }
}

// Validation functions
const validateVoucherNo = () => {
  const value = formData.value.voucherNo?.trim()
  if (!value) {
    errors.value.voucherNo = 'Số phiếu không được để trống'
    return false
  }
  if (!regexPatterns.voucherNo.test(value)) {
    errors.value.voucherNo = 'Số phiếu chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 50 ký tự)'
    return false
  }
  errors.value.voucherNo = ''
  return true
}

const validateDecisionDate = () => {
  const value = formData.value.decisionDate
  if (!value) {
    errors.value.decisionDate = 'Ngày quyết định không được để trống'
    return false
  }
  if (!regexPatterns.decisionDate.test(value)) {
    errors.value.decisionDate = 'Ngày quyết định không đúng định dạng'
    return false
  }
  // Kiểm tra ngày hợp lệ
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    errors.value.decisionDate = 'Ngày quyết định không hợp lệ'
    return false
  }
  // Kiểm tra ngày không được quá tương lai
  if (date > new Date()) {
    errors.value.decisionDate = 'Ngày quyết định không được lớn hơn ngày hiện tại'
    return false
  }
  errors.value.decisionDate = ''
  return true
}

const validateMonth = () => {
  const value = formData.value.month
  if (!value) {
    errors.value.month = 'Tháng không được để trống'
    return false
  }
  const monthNum = parseInt(value)
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    errors.value.month = 'Tháng phải là số từ 1 đến 12'
    return false
  }
  errors.value.month = ''
  return true
}

const validateYear = () => {
  const value = formData.value.year
  if (!value) {
    errors.value.year = 'Năm không được để trống'
    return false
  }
  const yearNum = parseInt(value)
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
    errors.value.year = 'Năm phải từ 1900 đến 2100'
    return false
  }
  errors.value.year = ''
  return true
}

const validateAdjustmentTypeID = () => {
  const value = formData.value.adjustmentTypeID
  if (!value) {
    errors.value.adjustmentTypeID = 'Vui lòng chọn khoản cộng trừ'
    return false
  }
  if (!regexPatterns.id.test(value)) {
    errors.value.adjustmentTypeID = 'Khoản cộng trừ không hợp lệ'
    return false
  }
  errors.value.adjustmentTypeID = ''
  return true
}

const validateAdjustmentItemID = () => {
  const value = formData.value.adjustmentItemID
  // Hạng mục là optional, nhưng nếu có giá trị thì phải hợp lệ
  if (value && !regexPatterns.id.test(value)) {
    errors.value.adjustmentItemID = 'Hạng mục không hợp lệ'
    return false
  }
  errors.value.adjustmentItemID = ''
  return true
}

const validateReason = () => {
  const value = formData.value.reason?.trim() || ''
  if (value.length > 500) {
    errors.value.reason = 'Lý do không được vượt quá 500 ký tự'
    return false
  }
  errors.value.reason = ''
  return true
}

const validateEmployees = () => {
  // Lọc các dòng có ít nhất một trường được điền
  const rowsWithData = selectedEmployees.value.filter(
    emp => emp.employeeID || (emp.value !== null && emp.value !== undefined && emp.value !== '')
  )
  
  if (rowsWithData.length === 0) {
    errors.value.employees = 'Phải có ít nhất một nhân viên với giá trị hợp lệ'
    return false
  }
  
  // Validate từng nhân viên
  for (let i = 0; i < selectedEmployees.value.length; i++) {
    const emp = selectedEmployees.value[i]
    // Chỉ validate nếu dòng có dữ liệu
    if (emp.employeeID || (emp.value !== null && emp.value !== undefined && emp.value !== '')) {
      // Nếu có employeeID hoặc value thì phải có đủ cả hai
      if (!emp.employeeID) {
        errors.value.employees = `Dòng ${i + 1}: Vui lòng chọn nhân viên`
        return false
      }
      if (!regexPatterns.id.test(String(emp.employeeID))) {
        errors.value.employees = `Dòng ${i + 1}: ID nhân viên không hợp lệ`
        return false
      }
      if (emp.value === null || emp.value === undefined || emp.value === '') {
        errors.value.employees = `Dòng ${i + 1}: Giá trị không được để trống`
        return false
      }
      const valueNum = parseFloat(emp.value)
      if (isNaN(valueNum)) {
        errors.value.employees = `Dòng ${i + 1}: Giá trị phải là số`
        return false
      }
      // Giới hạn giá trị (ví dụ: -999999999 đến 999999999)
      if (Math.abs(valueNum) > 999999999) {
        errors.value.employees = `Dòng ${i + 1}: Giá trị không được vượt quá 999,999,999`
        return false
      }
      // Giới hạn số thập phân (tối đa 2 chữ số sau dấu phẩy)
      const decimalPlaces = (String(emp.value).split('.')[1] || '').length
      if (decimalPlaces > 2) {
        errors.value.employees = `Dòng ${i + 1}: Giá trị chỉ được có tối đa 2 chữ số thập phân`
        return false
      }
    }
  }
  
  errors.value.employees = ''
  return true
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateVoucherNo(),
    validateDecisionDate(),
    validateMonth(),
    validateYear(),
    validateAdjustmentTypeID(),
    validateAdjustmentItemID(),
    validateReason(),
    validateEmployees()
  ]
  
  return validations.every(v => v === true)
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'voucherNo':
      validateVoucherNo()
      break
    case 'decisionDate':
      validateDecisionDate()
      break
    case 'month':
      validateMonth()
      break
    case 'year':
      validateYear()
      break
    case 'adjustmentTypeID':
      validateAdjustmentTypeID()
      break
    case 'adjustmentItemID':
      validateAdjustmentItemID()
      break
    case 'reason':
      validateReason()
      break
    case 'employees':
      validateEmployees()
      break
  }
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
  
  // Transform data to match backend DTO format (POST/PUT DTOs use camelCase)
  const submitData = {
    voucherNo: formData.value.voucherNo.trim(),
    decisionDate: formData.value.decisionDate, // Already in YYYY-MM-DD format
    month: parseInt(formData.value.month),
    year: parseInt(formData.value.year),
    reason: formData.value.reason?.trim() || '',
    adjustmentTypeID: parseInt(formData.value.adjustmentTypeID),
    // Only include adjustmentItemID if it has a value
    ...(formData.value.adjustmentItemID && { adjustmentItemID: parseInt(formData.value.adjustmentItemID) }),
    employees: selectedEmployees.value
      .filter(emp => emp.employeeID && emp.value !== null && emp.value !== undefined && emp.value !== '')
      .map(emp => ({
        employeeID: parseInt(emp.employeeID),
        employeeName: emp.employeeName,
        value: parseFloat(emp.value)
      }))
  }
  
  console.log('Submitting data:', JSON.stringify(submitData, null, 2))
  emit('submit', submitData)
}

const handleClose = () => emit('close')

onMounted(async () => {
  try {
    const [employeesRes, adjustmentTypesRes] = await Promise.all([
      employeeService.getAll(),
      api.get('/AdjustmentType')
    ])
    
    employees.value = employeesRes
    adjustmentTypes.value = adjustmentTypesRes.data
    
    // Nếu là chế độ update, khởi tạo danh sách nhân viên đã chọn
    if (props.mode === 'update' && props.adjustment.employees) {
      selectedEmployees.value = props.adjustment.employees.map(emp => ({
        employeeID: emp.EmployeeID || emp.employeeID,
        employeeName: emp.EmployeeName || emp.employeeName,
        value: emp.Value || emp.value
      }))
    }
    
    // Nếu có adjustmentTypeID, load adjustment items
    if (formData.value.adjustmentTypeID) {
      await onAdjustmentTypeChange()
      // Nếu có adjustmentItemID từ props, set lại sau khi load items
      if (props.adjustment.AdjustmentItemID || props.adjustment.adjustmentItemID) {
        formData.value.adjustmentItemID = props.adjustment.AdjustmentItemID || props.adjustment.adjustmentItemID
      }
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
})
</script>
<template>
  <form @submit.prevent="handleSubmit">
    <!-- Hàng 1: Số phiếu, Ngày quyết định, Tháng, Năm -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <label class="form-label">Số phiếu <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.voucherNo }"
          v-model="formData.voucherNo"
          @blur="validateField('voucherNo')"
          @input="validateField('voucherNo')"
          maxlength="50"
          placeholder="VD: PC-2024-001"
        />
        <div class="invalid-feedback">{{ errors.voucherNo }}</div>
      </div>
      <div class="col-md-3">
        <label class="form-label">Ngày Quyết định <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.decisionDate }"
          v-model="formData.decisionDate"
          @blur="validateField('decisionDate')"
          @change="validateField('decisionDate')"
          :max="new Date().toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.decisionDate }}</div>
      </div>
      <div class="col-md-3">
        <label class="form-label">Tháng <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.month }"
          v-model.number="formData.month"
          @blur="validateField('month')"
          @input="validateField('month')"
          min="1" 
          max="12" 
          placeholder="1-12"
        />
        <div class="invalid-feedback">{{ errors.month }}</div>
      </div>
      <div class="col-md-3">
        <label class="form-label">Năm <span class="text-danger">*</span></label>
        <input 
          type="number" 
          class="form-control" 
          :class="{ 'is-invalid': errors.year }"
          v-model.number="formData.year"
          @blur="validateField('year')"
          @input="validateField('year')"
          min="1900"
          max="2100"
          readonly
        />
        <div class="invalid-feedback">{{ errors.year }}</div>
      </div>
    </div>
    
    <!-- Hàng 2: Khoản cộng trừ, Hạng mục -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label class="form-label">Khoản cộng trừ <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.adjustmentTypeID }"
          v-model="formData.adjustmentTypeID" 
          @change="onAdjustmentTypeChange(); validateField('adjustmentTypeID')"
        >
          <option value="">Chọn khoản cộng trừ</option>
          <option v-for="type in adjustmentTypes" :key="type.id" :value="type.id">
            {{ type.adjustmentTypeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.adjustmentTypeID }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Hạng mục</label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.adjustmentItemID }"
          v-model="formData.adjustmentItemID"
          @change="validateField('adjustmentItemID')"
        >
          <option value="">Chọn hạng mục</option>
          <option v-for="item in adjustmentItems" :key="item.id" :value="item.id">
            {{ item.adjustmentItemName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.adjustmentItemID }}</div>
      </div>
    </div>
    
    <!-- Hàng 3: Lý do -->
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <label class="form-label">Lý do</label>
        <textarea 
          class="form-control" 
          :class="{ 'is-invalid': errors.reason }"
          v-model="formData.reason" 
          @blur="validateField('reason')"
          @input="validateField('reason')"
          rows="3"
          maxlength="500"
          placeholder="Nhập lý do (tối đa 500 ký tự)..."
        ></textarea>
        <div class="invalid-feedback">{{ errors.reason }}</div>
        <small class="form-text text-muted">{{ (formData.reason || '').length }}/500 ký tự</small>
      </div>
    </div>

    <!-- Bảng nhân viên -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Danh sách nhân viên <span class="text-danger">*</span></h5>
        <button type="button" class="btn btn-sm btn-outline-primary" @click="addEmployeeRow">
          <i class="fas fa-plus me-1"></i>Thêm nhân viên
        </button>
      </div>
      
      <div v-if="errors.employees" class="alert alert-danger mb-3" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ errors.employees }}
      </div>
      
      <div class="table-responsive" v-if="selectedEmployees.length > 0">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th style="width: 50%">Nhân viên <span class="text-danger">*</span></th>
              <th style="width: 35%">Giá trị <span class="text-danger">*</span></th>
              <th style="width: 15%">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(employee, index) in selectedEmployees" :key="index">
              <td>
                <select 
                  class="form-select form-select-sm" 
                  :class="{ 'is-invalid': errors.employees && !employee.employeeID && (employee.value || employee.value === 0) }"
                  v-model="employee.employeeID"
                  @change="updateEmployeeName(index, employee.employeeID); validateField('employees')"
                >
                  <option value="">Chọn nhân viên</option>
                  <option 
                    v-for="emp in employees" 
                    :key="emp.id" 
                    :value="emp.id"
                  >
                    {{ emp.employeeName }}
                  </option>
                </select>
              </td>
              <td>
                <input 
                  type="number" 
                  class="form-control form-control-sm" 
                  :class="{ 'is-invalid': errors.employees && (!employee.value && employee.value !== 0) && employee.employeeID }"
                  v-model.number="employee.value" 
                  @blur="validateField('employees')"
                  @input="validateField('employees')"
                  step="0.01"
                  placeholder="0.00"
                />
              </td>
              <td>
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-danger"
                  @click="removeEmployeeRow(index); validateField('employees')"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="text-center text-muted py-3">
        <p>Chưa có nhân viên nào được chọn. Vui lòng thêm ít nhất một nhân viên.</p>
      </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}</button>
    </div>
  </form>
</template>
