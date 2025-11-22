<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import FormField from '../FormField.vue'
import { CONTRACT_APPROVE_STATUS, CONTRACT_APPROVE_STATUS_LABELS } from '../../../constants/status.js'
import { contractService } from '../../../services/contractService.js'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  contract: {
    type: Object,
    default: null
  },
  employees: {
    type: Array,
    default: () => []
  },
  // Remove props for contractTypes and allowances since we'll fetch them from API
})

const emit = defineEmits(['submit', 'close'])

// Data from API
const contractTypes = ref([])
const allowances = ref([])
const loading = ref(false)

const formData = ref({
  id: props.contract?.id ?? '',
  contractNumber: props.contract?.contractNumber ?? '',
  contractTypeID: props.contract?.contractTypeID ?? '',
  employeeID: props.contract?.employeeID ?? '',
  startDate: formatDateForInput(props.contract?.startDate),
  endDate: formatDateForInput(props.contract?.endDate),
  contractSalary: props.contract?.contractSalary ?? '',
  insuranceSalary: props.contract?.insuranceSalary ?? '',
  approveStatus: props.contract?.approveStatus ?? 'Tạo mới',
  validityPeriod: props.contract?.validityPeriod ?? '', // Thêm trường hiệu lực
  allowances: (props.contract?.allowances || []).map(a => ({
    allowanceID: a.allowanceID || a.allowance?.id || '',
    value: a.value || 0
  }))
})

// Regex patterns cho validation
const regexPatterns = {
  // Số hợp đồng: chữ cái, số, dấu gạch ngang và gạch dưới, độ dài 1-50
  contractNumber: /^[A-Za-z0-9_-]{1,50}$/,
  // Ngày: định dạng YYYY-MM-DD
  date: /^\d{4}-\d{2}-\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/,
  // Lương: số dương, có thể có số thập phân (2 chữ số)
  salary: /^[1-9]\d{0,9}(\.\d{1,2})?$|^0\.\d{1,2}$/,
  // Hiệu lực: 3, 6, 12, 24, 36 tháng
  validityPeriod: /^(3|6|12|24|36)$/,
  // Giá trị phụ cấp: số dương hoặc 0, có thể có số thập phân
  allowanceValue: /^\d+(\.\d{1,2})?$/
}

// Validation errors
const errors = ref({
  contractNumber: '',
  contractTypeID: '',
  employeeID: '',
  startDate: '',
  endDate: '',
  contractSalary: '',
  insuranceSalary: '',
  validityPeriod: '',
  allowances: ''
})


const approveStatusOptions = [
  { value: 'Tạo mới', text: 'Tạo mới' },
  { value: 'Chờ duyệt', text: 'Chờ duyệt' },
  { value: 'Đã duyệt', text: 'Đã duyệt' },
  { value: 'Từ chối', text: 'Từ chối' }
]

const validityOptions = [
  { value: '3', text: '3 tháng' },
  { value: '6', text: '6 tháng' },
  { value: '12', text: '12 tháng' },
  { value: '24', text: '24 tháng' },
  { value: '36', text: '36 tháng' }
]

// Computed properties
const isDeterminedTermContract = computed(() => {
  const contractType = contractTypes.value?.find(type => type.id == formData.value.contractTypeID)
  return contractType?.contractTypeName?.toLowerCase().includes('xác định') || false
})

const isIndeterminateTermContract = computed(() => {
  const contractType = contractTypes.value?.find(type => type.id == formData.value.contractTypeID)
  return contractType?.contractTypeName?.toLowerCase().includes('không xác định') || false
})

const isProbationContract = computed(() => {
  const contractType = contractTypes.value?.find(type => type.id == formData.value.contractTypeID)
  return contractType?.contractTypeName?.toLowerCase().includes('thử việc') || false
})

// Watch for changes in contract prop
watch(() => props.contract, (newContract) => {
  if (newContract) {
    // Use Vietnamese string status directly
    let approveStatusValue = 'Tạo mới'
    if (newContract.approveStatus) {
      // Handle different status formats
      if (typeof newContract.approveStatus === 'string') {
        // Map English to Vietnamese if needed
        const statusMap = {
          'Created': 'Tạo mới',
          'Pending': 'Chờ duyệt', 
          'Approved': 'Đã duyệt',
          'Rejected': 'Từ chối',
          'Tạo mới': 'Tạo mới',
          'Chờ duyệt': 'Chờ duyệt',
          'Đã duyệt': 'Đã duyệt',
          'Từ chối': 'Từ chối'
        }
        approveStatusValue = statusMap[newContract.approveStatus] || 'Tạo mới'
      } else if (typeof newContract.approveStatus === 'number') {
        // Convert number to Vietnamese string
        const numberStatusMap = {
          0: 'Tạo mới',
          1: 'Chờ duyệt',
          2: 'Đã duyệt',
          3: 'Từ chối'
        }
        approveStatusValue = numberStatusMap[newContract.approveStatus] || 'Tạo mới'
      }
    }

    formData.value = {
      id: newContract.id ?? '',
      contractNumber: newContract.contractNumber ?? '',
      contractTypeID: newContract.contractTypeID ?? '',
      employeeID: newContract.employeeID ?? '',
      startDate: formatDateForInput(newContract.startDate),
      endDate: formatDateForInput(newContract.endDate),
      contractSalary: newContract.contractSalary ?? '',
      insuranceSalary: newContract.insuranceSalary ?? '',
      approveStatus: approveStatusValue,
      validityPeriod: newContract.validityPeriod ?? '',
      allowances: (newContract.allowances || []).map(a => ({
        allowanceID: a.allowanceID || a.allowance?.id || '',
        value: a.value || 0
      }))
    }
  }
}, { deep: true, immediate: true })

function formatDateForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

// Function to calculate end date based on validity period
function calculateEndDate(startDate, validityMonths) {
  if (!startDate || !validityMonths) return ''
  
  const start = new Date(startDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + parseInt(validityMonths))
  
  return end.toISOString().split('T')[0]
}

// Watch for changes in start date and validity period to auto-calculate end date
watch([() => formData.value.startDate, () => formData.value.validityPeriod], ([newStartDate, newValidityPeriod]) => {
  if (isDeterminedTermContract.value && newStartDate && newValidityPeriod) {
    formData.value.endDate = calculateEndDate(newStartDate, newValidityPeriod)
  }
  
  // For probation contracts, always use 2 months
  if (isProbationContract.value && newStartDate) {
    formData.value.endDate = calculateEndDate(newStartDate, '2')
  }
})

// Watch for contract type changes to reset validity period
watch(() => formData.value.contractTypeID, (newContractTypeID) => {
  if (!isDeterminedTermContract.value && !isProbationContract.value) {
    formData.value.validityPeriod = ''
    if (isIndeterminateTermContract.value) {
      // For indeterminate term contracts, set end date to empty or a far future date
      formData.value.endDate = ''
    }
  }
  
  // Auto-set validity period for probation contracts
  if (isProbationContract.value) {
    formData.value.validityPeriod = '2' // 2 months default for probation
    // Auto-calculate end date if start date is set
    if (formData.value.startDate) {
      formData.value.endDate = calculateEndDate(formData.value.startDate, '2')
    }
  }
})

// Validation functions
const validateContractNumber = () => {
  const value = formData.value.contractNumber?.trim()
  if (!value) {
    errors.value.contractNumber = 'Số hợp đồng không được để trống'
    return false
  }
  if (!regexPatterns.contractNumber.test(value)) {
    errors.value.contractNumber = 'Số hợp đồng chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới (tối đa 50 ký tự)'
    return false
  }
  errors.value.contractNumber = ''
  return true
}

const validateContractTypeID = () => {
  const value = formData.value.contractTypeID
  if (!value) {
    errors.value.contractTypeID = 'Vui lòng chọn loại hợp đồng'
    return false
  }
  if (!regexPatterns.id.test(String(value))) {
    errors.value.contractTypeID = 'Loại hợp đồng không hợp lệ'
    return false
  }
  errors.value.contractTypeID = ''
  return true
}

const validateEmployeeID = () => {
  const value = formData.value.employeeID
  if (!value) {
    errors.value.employeeID = 'Vui lòng chọn nhân viên'
    return false
  }
  errors.value.employeeID = ''
  return true
}

const validateStartDate = () => {
  const value = formData.value.startDate
  if (!value) {
    errors.value.startDate = 'Ngày bắt đầu không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.startDate = 'Định dạng ngày bắt đầu không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime())) {
    errors.value.startDate = 'Ngày bắt đầu không hợp lệ'
    return false
  }
  
  // Ngày bắt đầu không được quá tương lai
  if (startDate > new Date()) {
    errors.value.startDate = 'Ngày bắt đầu không được lớn hơn ngày hiện tại'
    return false
  }
  
  // Validate end date when start date changes
  if (formData.value.endDate && !isIndeterminateTermContract.value) {
    const endDate = new Date(formData.value.endDate)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDate = 'Ngày bắt đầu phải trước ngày kết thúc'
      return false
    }
  }
  
  errors.value.startDate = ''
  return true
}

const validateEndDate = () => {
  const value = formData.value.endDate
  
  // End date is optional for indeterminate term contracts
  if (isIndeterminateTermContract.value && !value) {
    errors.value.endDate = ''
    return true
  }
  
  if (!value && !isIndeterminateTermContract.value) {
    errors.value.endDate = 'Ngày kết thúc không được để trống'
    return false
  }
  
  if (value && !regexPatterns.date.test(value)) {
    errors.value.endDate = 'Định dạng ngày kết thúc không hợp lệ'
    return false
  }
  
  if (value) {
    const endDate = new Date(value)
    if (isNaN(endDate.getTime())) {
      errors.value.endDate = 'Ngày kết thúc không hợp lệ'
      return false
    }
    
    // Validate end date is after start date
    if (formData.value.startDate) {
      const startDate = new Date(formData.value.startDate)
      if (!isNaN(startDate.getTime()) && startDate >= endDate) {
        errors.value.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
        return false
      }
    }
    
    // Probation contract duration validation (max 2 months)
    if (isProbationContract.value && formData.value.startDate) {
      const startDate = new Date(formData.value.startDate)
      const durationInMonths = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth())
      
      if (durationInMonths > 2) {
        errors.value.endDate = 'Hợp đồng thử việc không được vượt quá 2 tháng'
        return false
      }
    }
  }
  
  errors.value.endDate = ''
  return true
}

const validateContractSalary = () => {
  const value = formData.value.contractSalary
  if (!value && value !== 0) {
    errors.value.contractSalary = 'Lương hợp đồng không được để trống'
    return false
  }
  
  const salaryNum = parseFloat(value)
  if (isNaN(salaryNum)) {
    errors.value.contractSalary = 'Lương hợp đồng phải là số'
    return false
  }
  
  if (salaryNum <= 0) {
    errors.value.contractSalary = 'Lương hợp đồng phải lớn hơn 0'
    return false
  }
  
  // Validate format: tối đa 10 chữ số, 2 chữ số thập phân
  const valueStr = String(value)
  if (!regexPatterns.salary.test(valueStr)) {
    errors.value.contractSalary = 'Lương hợp đồng không đúng định dạng'
    return false
  }
  
  // Giới hạn: 0.01 đến 999,999,999,999.99
  if (salaryNum > 999999999999.99) {
    errors.value.contractSalary = 'Lương hợp đồng không được vượt quá 999,999,999,999.99'
    return false
  }
  
  errors.value.contractSalary = ''
  return true
}

const validateInsuranceSalary = () => {
  const value = formData.value.insuranceSalary
  if (!value && value !== 0) {
    errors.value.insuranceSalary = 'Lương bảo hiểm không được để trống'
    return false
  }
  
  const salaryNum = parseFloat(value)
  if (isNaN(salaryNum)) {
    errors.value.insuranceSalary = 'Lương bảo hiểm phải là số'
    return false
  }
  
  if (salaryNum <= 0) {
    errors.value.insuranceSalary = 'Lương bảo hiểm phải lớn hơn 0'
    return false
  }
  
  // Validate format
  const valueStr = String(value)
  if (!regexPatterns.salary.test(valueStr)) {
    errors.value.insuranceSalary = 'Lương bảo hiểm không đúng định dạng'
    return false
  }
  
  // Giới hạn
  if (salaryNum > 999999999999.99) {
    errors.value.insuranceSalary = 'Lương bảo hiểm không được vượt quá 999,999,999,999.99'
    return false
  }
  
  errors.value.insuranceSalary = ''
  return true
}

const validateValidityPeriod = () => {
  // Validity period only required for determined term contracts
  if (!isDeterminedTermContract.value && !isProbationContract.value) {
    errors.value.validityPeriod = ''
    return true
  }
  
  const value = formData.value.validityPeriod
  if (!value) {
    errors.value.validityPeriod = 'Vui lòng chọn hiệu lực hợp đồng'
    return false
  }
  
  if (!regexPatterns.validityPeriod.test(value)) {
    errors.value.validityPeriod = 'Hiệu lực hợp đồng không hợp lệ (phải là 3, 6, 12, 24 hoặc 36 tháng)'
    return false
  }
  
  errors.value.validityPeriod = ''
  return true
}

const validateAllowances = () => {
  // Validate each allowance in the array
  for (let i = 0; i < formData.value.allowances.length; i++) {
    const allowance = formData.value.allowances[i]
    
    // If allowanceID or value is filled, both must be filled
    if (allowance.allowanceID || allowance.value || allowance.value === 0) {
      if (!allowance.allowanceID) {
        errors.value.allowances = `Phụ cấp ${i + 1}: Vui lòng chọn loại phụ cấp`
        return false
      }
      
      if (!regexPatterns.id.test(String(allowance.allowanceID))) {
        errors.value.allowances = `Phụ cấp ${i + 1}: ID phụ cấp không hợp lệ`
        return false
      }
      
      if (allowance.value === null || allowance.value === undefined || allowance.value === '') {
        errors.value.allowances = `Phụ cấp ${i + 1}: Giá trị không được để trống`
        return false
      }
      
      const valueNum = parseFloat(allowance.value)
      if (isNaN(valueNum)) {
        errors.value.allowances = `Phụ cấp ${i + 1}: Giá trị phải là số`
        return false
      }
      
      if (valueNum < 0) {
        errors.value.allowances = `Phụ cấp ${i + 1}: Giá trị không được âm`
        return false
      }
      
      // Validate format
      const valueStr = String(allowance.value)
      if (!regexPatterns.allowanceValue.test(valueStr)) {
        errors.value.allowances = `Phụ cấp ${i + 1}: Giá trị không đúng định dạng`
        return false
      }
      
      // Giới hạn số thập phân
      const decimalPlaces = (valueStr.split('.')[1] || '').length
      if (decimalPlaces > 2) {
        errors.value.allowances = `Phụ cấp ${i + 1}: Giá trị chỉ được có tối đa 2 chữ số thập phân`
        return false
      }
    }
  }
  
  errors.value.allowances = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'contractNumber':
      validateContractNumber()
      break
    case 'contractTypeID':
      validateContractTypeID()
      // Re-validate validity period when contract type changes
      if (isDeterminedTermContract.value || isProbationContract.value) {
        validateValidityPeriod()
      }
      break
    case 'employeeID':
      validateEmployeeID()
      break
    case 'startDate':
      validateStartDate()
      // Re-validate end date when start date changes
      if (formData.value.endDate) {
        validateEndDate()
      }
      break
    case 'endDate':
      validateEndDate()
      // Re-validate start date when end date changes
      if (formData.value.startDate) {
        validateStartDate()
      }
      break
    case 'contractSalary':
      validateContractSalary()
      break
    case 'insuranceSalary':
      validateInsuranceSalary()
      break
    case 'validityPeriod':
      validateValidityPeriod()
      break
    case 'allowances':
      validateAllowances()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateContractNumber(),
    validateContractTypeID(),
    validateEmployeeID(),
    validateStartDate(),
    validateEndDate(),
    validateContractSalary(),
    validateInsuranceSalary(),
    validateValidityPeriod(),
    validateAllowances()
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

  // Format data for API submission - keep Vietnamese string status
  const submitData = {
    ...formData.value,
    contractNumber: formData.value.contractNumber.trim(),
    contractSalary: parseFloat(formData.value.contractSalary),
    insuranceSalary: parseFloat(formData.value.insuranceSalary),
    allowances: formData.value.allowances
      .filter(a => a.allowanceID && (a.value !== null && a.value !== undefined && a.value !== ''))
      .map(a => ({
        allowanceID: parseInt(a.allowanceID),
        value: parseFloat(a.value)
      }))
  }

  // Remove ValidityPeriod from submit data as it's not in the backend entity
  delete submitData.validityPeriod

  emit('submit', submitData)
}

const handleClose = () => {
  emit('close')
}

const addAllowance = () => {
  formData.value.allowances.push({
    allowanceID: '',
    value: 0
  })
}

const removeAllowance = (index) => {
  formData.value.allowances.splice(index, 1)
}

// Fetch data from API
const fetchContractTypes = async () => {
  try {
    loading.value = true
    const data = await contractService.getContractTypes()
    contractTypes.value = data
  } catch (error) {
    console.error('Error fetching contract types:', error)
    // Fallback to empty array if API fails
    contractTypes.value = []
  } finally {
    loading.value = false
  }
}

const fetchAllowances = async () => {
  try {
    loading.value = true
    const data = await contractService.getAllowances()
    allowances.value = data
  } catch (error) {
    console.error('Error fetching allowances:', error)
    // Fallback to empty array if API fails
    allowances.value = []
  } finally {
    loading.value = false
  }
}

// Load data on component mount
onMounted(async () => {
  await Promise.all([
    fetchContractTypes(),
    fetchAllowances()
  ])
})

// Reset form when mode changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'create') {
    formData.value = {
      id: '',
      contractNumber: '',
      contractTypeID: '',
      employeeID: '',
      startDate: '',
      endDate: '',
      contractSalary: '',
      insuranceSalary: '',
      approveStatus: 'Tạo mới',
      validityPeriod: '',
      allowances: []
    }
  }
})
</script>

<template>
  <div class="form-card">
    <form @submit.prevent="handleSubmit">
      <!-- Thông tin cơ bản -->
      <div class="form-group">
        <h6 class="group-title">
          <i class="fas fa-file-contract me-2"></i>
          Thông tin cơ bản
        </h6>
        <div class="row g-4">
          <div class="col-md-4">
            <label class="form-label">Số hợp đồng <span class="text-danger">*</span></label>
            <input 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': errors.contractNumber }"
              v-model="formData.contractNumber"
              @blur="validateField('contractNumber')"
              @input="validateField('contractNumber')"
              maxlength="50"
              placeholder="VD: HD-2024-001"
            />
            <div class="invalid-feedback">{{ errors.contractNumber }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              :class="{ 'is-invalid': errors.employeeID }"
              v-model="formData.employeeID"
              @change="validateField('employeeID')"
            >
              <option value="">Chọn nhân viên</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.firstName }} {{ employee.lastName }} - {{ employee.employeeCode }}
              </option>
            </select>
            <div class="invalid-feedback">{{ errors.employeeID }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Loại hợp đồng <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              :class="{ 'is-invalid': errors.contractTypeID }"
              v-model="formData.contractTypeID"
              @change="validateField('contractTypeID')"
              :disabled="loading"
            >
              <option value="">{{ loading ? 'Đang tải...' : 'Chọn loại hợp đồng' }}</option>
              <option v-for="type in contractTypes" :key="type.id" :value="type.id">
                {{ type.contractTypeName }}
              </option>
            </select>
            <div class="invalid-feedback">{{ errors.contractTypeID }}</div>
          </div>
        </div>
      </div>

      <!-- Thời gian hợp đồng -->
      <div class="form-group">
        <h6 class="group-title">
          <i class="fas fa-calendar-alt me-2"></i>
          Thời gian hợp đồng
        </h6>
        <div class="row g-4">
          <!-- Hiệu lực hợp đồng cho hợp đồng xác định thời hạn -->
          <div v-if="isDeterminedTermContract || isProbationContract" class="col-md-4">
            <label class="form-label">Hiệu lực <span class="text-danger">*</span></label>
            <select 
              class="form-select" 
              :class="{ 'is-invalid': errors.validityPeriod }"
              v-model="formData.validityPeriod"
              @change="validateField('validityPeriod')"
            >
              <option value="">Chọn hiệu lực</option>
              <option v-for="validity in validityOptions" :key="validity.value" :value="validity.value">
                {{ validity.text }}
              </option>
            </select>
            <div class="invalid-feedback">{{ errors.validityPeriod }}</div>
          </div>
          
          <div class="col-md-4">
            <label class="form-label">Từ ngày <span class="text-danger">*</span></label>
            <input 
              type="date" 
              class="form-control" 
              :class="{ 'is-invalid': errors.startDate }"
              v-model="formData.startDate"
              @blur="validateField('startDate')"
              @change="validateField('startDate')"
              :max="new Date().toISOString().split('T')[0]"
            />
            <div class="invalid-feedback">{{ errors.startDate }}</div>
          </div>
          
          <div class="col-md-4">
            <label class="form-label">
              Đến ngày 
              <span v-if="!isIndeterminateTermContract" class="text-danger">*</span>
            </label>
            <input 
              type="date" 
              class="form-control" 
              :class="{ 'is-invalid': errors.endDate }"
              v-model="formData.endDate"
              @blur="validateField('endDate')"
              @change="validateField('endDate')"
              :readonly="isDeterminedTermContract || isProbationContract"
              :required="!isIndeterminateTermContract"
            />
            <div class="invalid-feedback">{{ errors.endDate }}</div>
            <small v-if="isDeterminedTermContract || isProbationContract" class="form-text text-muted">
              Tự động tính dựa trên từ ngày và hiệu lực
            </small>
            <small v-else-if="isIndeterminateTermContract" class="form-text text-muted">
              Hợp đồng không xác định thời hạn (tùy chọn)
            </small>
          </div>
        </div>
        
        <!-- Thông báo cho hợp đồng thử việc -->
        <div v-if="isProbationContract" class="row g-4 mt-2">
          <div class="col-12">
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i>
              <strong>Hợp đồng thử việc:</strong> Tự động có hiệu lực 2 tháng
            </div>
          </div>
        </div>
      </div>

      <!-- Thông tin lương và trạng thái -->
      <div class="form-group">
        <h6 class="group-title">
          <i class="fas fa-money-bill-wave me-2"></i>
          Thông tin lương và trạng thái
        </h6>
        <div class="row g-4">
          <div class="col-md-4">
            <label class="form-label">Lương hợp đồng <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              :class="{ 'is-invalid': errors.contractSalary }"
              v-model.number="formData.contractSalary"
              @blur="validateField('contractSalary')"
              @input="validateField('contractSalary')"
              step="0.01"
              min="0.01"
              placeholder="VD: 10000000"
            />
            <div class="invalid-feedback">{{ errors.contractSalary }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Lương bảo hiểm <span class="text-danger">*</span></label>
            <input 
              type="number" 
              class="form-control" 
              :class="{ 'is-invalid': errors.insuranceSalary }"
              v-model.number="formData.insuranceSalary"
              @blur="validateField('insuranceSalary')"
              @input="validateField('insuranceSalary')"
              step="0.01"
              min="0.01"
              placeholder="VD: 8000000"
            />
            <div class="invalid-feedback">{{ errors.insuranceSalary }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái duyệt</label>
            <select class="form-select" v-model="formData.approveStatus">
              <option v-for="status in approveStatusOptions" :key="status.value" :value="status.value">
                {{ status.text }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Phụ cấp -->
      <div class="form-group">
        <div class="d-flex justify-content-between align-items-center group-title">
          <h6 class="mb-0">
            <i class="fas fa-plus-circle me-2"></i>
            Phụ cấp
          </h6>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="addAllowance">
            <i class="fas fa-plus me-1"></i> Thêm phụ cấp
          </button>
        </div>
        <div class="row g-4">
          <div v-if="errors.allowances" class="col-12">
            <div class="alert alert-danger mb-3" role="alert">
              <i class="fas fa-exclamation-circle me-2"></i>{{ errors.allowances }}
            </div>
          </div>
          
          <div v-if="formData.allowances.length === 0" class="col-12">
            <div class="text-muted text-center py-3">
              Chưa có phụ cấp nào
            </div>
          </div>
          
          <div v-for="(allowance, index) in formData.allowances" :key="index" class="col-12">
            <div class="row g-3">
              <div class="col-md-5">
                <label class="form-label">Loại phụ cấp</label>
                <select 
                  class="form-select" 
                  :class="{ 'is-invalid': errors.allowances && !allowance.allowanceID && (allowance.value || allowance.value === 0) }"
                  v-model="allowance.allowanceID"
                  @change="validateField('allowances')"
                  :disabled="loading"
                >
                  <option value="">{{ loading ? 'Đang tải...' : 'Chọn phụ cấp' }}</option>
                  <option v-for="allow in allowances" :key="allow.id" :value="allow.id">
                    {{ allow.allowanceName }}
                  </option>
                </select>
              </div>
              <div class="col-md-5">
                <label class="form-label">Giá trị</label>
                <input 
                  type="number" 
                  class="form-control" 
                  :class="{ 'is-invalid': errors.allowances && (!allowance.value && allowance.value !== 0) && allowance.allowanceID }"
                  v-model.number="allowance.value"
                  @blur="validateField('allowances')"
                  @input="validateField('allowances')"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button 
                  type="button" 
                  class="btn btn-outline-danger btn-sm" 
                  @click="removeAllowance(index); validateField('allowances')"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
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
  font-size: 0.9rem;
}

/* Ensure all form inputs have consistent sizing */
.form-select,
.form-control,
input[type="text"],
input[type="number"],
input[type="date"],
input[type="email"] {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.95rem;
  height: 45px;
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus,
.form-control:focus,
input[type="text"]:focus,
input[type="number"]:focus,
input[type="date"]:focus,
input[type="email"]:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.btn-gradient:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  color: white;
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