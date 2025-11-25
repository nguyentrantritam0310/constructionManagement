<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { employeeService } from '../../../services/employeeService'
import api from '../../../api'

// ============================================================================
// PROPS & EMITS
// ============================================================================
const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
  adjustment: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['close', 'submit'])

// ============================================================================
// STATE
// ============================================================================
const employees = ref([])
const adjustmentTypes = ref([])
const adjustmentItems = ref([])
const selectedEmployees = ref([])
const currentYear = new Date().getFullYear()

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

// ============================================================================
// CONSTANTS
// ============================================================================
const VALIDATION_PATTERNS = {
  voucherNo: /^[A-Za-z0-9_-]{1,50}$/,
  decisionDate: /^\d{4}-\d{2}-\d{2}$/,
  month: /^(0?[1-9]|1[0-2])$/,
  year: /^(19|20)\d{2}$/,
  id: /^[1-9]\d*$/,
  reason: /^[\s\S]{0,500}$/,
  value: /^-?\d+(\.\d{1,2})?$/
}

const MAX_VALUE = 999999999
const MAX_DECIMAL_PLACES = 2
const MAX_REASON_LENGTH = 500

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format date value for input field (YYYY-MM-DD)
 */
const formatDateForInput = (dateValue) => {
  if (!dateValue) return ''
  
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.split('T')[0]
  }
  
  let date
  if (typeof dateValue === 'string') {
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
  return date.toISOString().split('T')[0]
}

/**
 * Get employee name from various possible fields
 */
const getEmployeeName = (employee) => {
  return employee.employeeName || 
         employee.fullName || 
         `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
}

/**
 * Compare two IDs (handles both string and number)
 */
const compareIds = (id1, id2) => {
  return id1 == id2 || 
         String(id1) === String(id2) ||
         (Number(id1) === Number(id2) && !isNaN(Number(id1)) && !isNaN(Number(id2)))
}

/**
 * Normalize employee ID (convert to number if possible, otherwise keep as string)
 */
const normalizeEmployeeID = (employeeID) => {
  const num = Number(employeeID)
  return (!isNaN(num) && num > 0) ? num : employeeID
}

// ============================================================================
// FORM DATA INITIALIZATION
// ============================================================================

const initializeFormData = () => {
  const adj = props.adjustment
  return {
    voucherNo: adj.voucherNo || '',
    decisionDate: formatDateForInput(adj.decisionDate || adj.DecisionDate),
    month: adj.Month || adj.month || '',
    year: adj.Year || adj.year || currentYear,
    adjustmentTypeID: adj.AdjustmentTypeID || adj.adjustmentTypeID || '',
    adjustmentItemID: adj.AdjustmentItemID || adj.adjustmentItemID || '',
    reason: adj.Reason || adj.reason || '',
    employees: adj.Employees || adj.employees || []
  }
}

const formData = ref(initializeFormData())

// ============================================================================
// COMPUTED
// ============================================================================

const monthYear = computed(() => {
  return `${String(formData.value.month).padStart(2, '0')}/${formData.value.year}`
})

// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

/**
 * Get available employees for a specific row (exclude already selected employees)
 */
const getAvailableEmployees = (currentIndex) => {
  const currentEmployeeID = selectedEmployees.value[currentIndex]?.employeeID
  
  const selectedIDs = selectedEmployees.value
    .map((emp, idx) => idx !== currentIndex && emp.employeeID ? emp.employeeID : null)
    .filter(id => id !== null && id !== '' && id !== undefined)
  
  return employees.value.filter(emp => {
    if (currentEmployeeID && compareIds(emp.id, currentEmployeeID)) {
      return true
    }
    return !selectedIDs.some(selectedID => compareIds(emp.id, selectedID))
  })
}

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

/**
 * Update employee name when employee is selected
 */
const updateEmployeeName = (index, employeeID) => {
  if (!employeeID || employeeID === '' || employeeID === null || employeeID === undefined) {
    return
  }
  
  selectedEmployees.value[index].employeeID = employeeID
  
  const employee = employees.value.find(emp => compareIds(emp.id, employeeID))
  
  if (employee) {
    selectedEmployees.value[index].employeeName = getEmployeeName(employee)
  }
}

/**
 * Handle employee selection change
 */
const handleEmployeeChange = (index) => {
  const employee = selectedEmployees.value[index]
  updateEmployeeName(index, employee.employeeID)
  validateField('employees')
}

// ============================================================================
// ADJUSTMENT ITEMS
// ============================================================================

const loadAdjustmentItems = async () => {
  if (!formData.value.adjustmentTypeID) {
    adjustmentItems.value = []
    return
  }
  
  try {
    const response = await api.get(`/AdjustmentItem/by-type/${formData.value.adjustmentTypeID}`)
    adjustmentItems.value = response.data
  } catch (error) {
    console.error('Error loading adjustment items:', error)
    adjustmentItems.value = []
  }
}

const handleAdjustmentTypeChange = async () => {
  await loadAdjustmentItems()
  validateField('adjustmentTypeID')
}

// ============================================================================
// VALIDATION
// ============================================================================

const validateVoucherNo = () => {
  const value = formData.value.voucherNo?.trim()
  if (!value) {
    errors.value.voucherNo = 'Số phiếu không được để trống'
    return false
  }
  if (!VALIDATION_PATTERNS.voucherNo.test(value)) {
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
  if (!VALIDATION_PATTERNS.decisionDate.test(value)) {
    errors.value.decisionDate = 'Ngày quyết định không đúng định dạng'
    return false
  }
  
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    errors.value.decisionDate = 'Ngày quyết định không hợp lệ'
    return false
  }
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
  if (!VALIDATION_PATTERNS.id.test(value)) {
    errors.value.adjustmentTypeID = 'Khoản cộng trừ không hợp lệ'
    return false
  }
  errors.value.adjustmentTypeID = ''
  return true
}

const validateAdjustmentItemID = () => {
  const value = formData.value.adjustmentItemID
  if (value && !VALIDATION_PATTERNS.id.test(value)) {
    errors.value.adjustmentItemID = 'Hạng mục không hợp lệ'
    return false
  }
  errors.value.adjustmentItemID = ''
  return true
}

const validateReason = () => {
  const value = formData.value.reason?.trim() || ''
  if (value.length > MAX_REASON_LENGTH) {
    errors.value.reason = `Lý do không được vượt quá ${MAX_REASON_LENGTH} ký tự`
    return false
  }
  errors.value.reason = ''
  return true
}

const validateEmployees = () => {
  const rowsWithData = selectedEmployees.value.filter(
    emp => emp.employeeID || (emp.value !== null && emp.value !== undefined && emp.value !== '')
  )
  
  if (rowsWithData.length === 0) {
    errors.value.employees = 'Phải có ít nhất một nhân viên với giá trị hợp lệ'
    return false
  }
  
  for (let i = 0; i < selectedEmployees.value.length; i++) {
    const emp = selectedEmployees.value[i]
    
    if (emp.employeeID || (emp.value !== null && emp.value !== undefined && emp.value !== '')) {
      if (!emp.employeeID || emp.employeeID === '' || emp.employeeID === null || emp.employeeID === undefined) {
        errors.value.employees = `Dòng ${i + 1}: Vui lòng chọn nhân viên`
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
      
      if (Math.abs(valueNum) > MAX_VALUE) {
        errors.value.employees = `Dòng ${i + 1}: Giá trị không được vượt quá ${MAX_VALUE.toLocaleString()}`
        return false
      }
      
      const decimalPlaces = (String(emp.value).split('.')[1] || '').length
      if (decimalPlaces > MAX_DECIMAL_PLACES) {
        errors.value.employees = `Dòng ${i + 1}: Giá trị chỉ được có tối đa ${MAX_DECIMAL_PLACES} chữ số thập phân`
        return false
      }
    }
  }
  
  errors.value.employees = ''
  return true
}

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

const validateField = (fieldName) => {
  const validators = {
    voucherNo: validateVoucherNo,
    decisionDate: validateDecisionDate,
    month: validateMonth,
    year: validateYear,
    adjustmentTypeID: validateAdjustmentTypeID,
    adjustmentItemID: validateAdjustmentItemID,
    reason: validateReason,
    employees: validateEmployees
  }
  
  const validator = validators[fieldName]
  if (validator) {
    validator()
  }
}

// ============================================================================
// DATA PROCESSING
// ============================================================================

/**
 * Process and validate employee data before submission
 */
const processEmployeesForSubmission = () => {
  return selectedEmployees.value
    .filter(emp => {
      if (!emp.employeeID || emp.employeeID === null || emp.employeeID === undefined || emp.employeeID === '') {
        return false
      }
      
      const employeeIDStr = String(emp.employeeID).trim()
      if (employeeIDStr === '' || employeeIDStr === 'null' || employeeIDStr === 'undefined') {
        return false
      }
      
      const employeeIDNum = Number(emp.employeeID)
      if (!isNaN(employeeIDNum) && employeeIDNum <= 0) {
        return false
      }
      
      if (emp.value === null || emp.value === undefined || emp.value === '') {
        return false
      }
      
      const valueNum = parseFloat(emp.value)
      if (isNaN(valueNum)) {
        return false
      }
      
      return true
    })
    .map(emp => ({
      employeeID: normalizeEmployeeID(emp.employeeID),
      employeeName: emp.employeeName || '',
      value: parseFloat(emp.value)
    }))
    .filter(emp => emp !== null && emp !== undefined)
}

/**
 * Build submission data object
 */
const buildSubmissionData = (processedEmployees) => {
  return {
    voucherNo: formData.value.voucherNo.trim(),
    decisionDate: formData.value.decisionDate,
    month: parseInt(formData.value.month),
    year: parseInt(formData.value.year),
    reason: formData.value.reason?.trim() || '',
    adjustmentTypeID: parseInt(formData.value.adjustmentTypeID),
    ...(formData.value.adjustmentItemID && { adjustmentItemID: parseInt(formData.value.adjustmentItemID) }),
    employees: processedEmployees
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

const handleSubmit = () => {
  if (!validateForm()) {
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  const processedEmployees = processEmployeesForSubmission()
  
  if (processedEmployees.length === 0) {
    errors.value.employees = 'Phải có ít nhất một nhân viên với giá trị hợp lệ'
    const employeeSection = document.querySelector('.table-responsive')
    if (employeeSection) {
      employeeSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }
  
  const submitData = buildSubmissionData(processedEmployees)
  emit('submit', submitData)
}

const handleClose = () => emit('close')

// ============================================================================
// WATCHERS
// ============================================================================

watch(() => props.adjustment, async (newAdjustment) => {
  if (newAdjustment && Object.keys(newAdjustment).length > 0) {
    formData.value = initializeFormData()
    
    if (newAdjustment.Employees || newAdjustment.employees) {
      selectedEmployees.value = (newAdjustment.Employees || newAdjustment.employees).map(emp => ({
        employeeID: emp.EmployeeID || emp.employeeID,
        employeeName: emp.EmployeeName || emp.employeeName,
        value: emp.Value || emp.value
      }))
    } else {
      selectedEmployees.value = []
    }
    
    if (formData.value.adjustmentTypeID) {
      try {
        await loadAdjustmentItems()
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

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  try {
    const [employeesRes, adjustmentTypesRes] = await Promise.all([
      employeeService.getAll(),
      api.get('/AdjustmentType')
    ])
    
    employees.value = employeesRes
    adjustmentTypes.value = adjustmentTypesRes.data
    
    if (props.mode === 'update' && props.adjustment.employees) {
      selectedEmployees.value = props.adjustment.employees.map(emp => ({
        employeeID: emp.EmployeeID || emp.employeeID,
        employeeName: emp.EmployeeName || emp.employeeName,
        value: emp.Value || emp.value
      }))
    }
    
    if (formData.value.adjustmentTypeID) {
      await loadAdjustmentItems()
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
    <!-- Basic Information -->
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
    
    <!-- Adjustment Type & Item -->
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label class="form-label">Khoản cộng trừ <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.adjustmentTypeID }"
          v-model="formData.adjustmentTypeID" 
          @change="handleAdjustmentTypeChange"
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
    
    <!-- Reason -->
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

    <!-- Employees Table -->
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
                  @change="handleEmployeeChange(index)"
                >
                  <option value="">Chọn nhân viên</option>
                  <option 
                    v-for="emp in getAvailableEmployees(index)" 
                    :key="emp.id" 
                    :value="emp.id"
                  >
                    {{ getEmployeeName(emp) }}
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

    <!-- Actions -->
    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}</button>
    </div>
  </form>
</template>
