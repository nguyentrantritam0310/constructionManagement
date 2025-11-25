<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import FormField from '../FormField.vue'
import { CONTRACT_APPROVE_STATUS, CONTRACT_APPROVE_STATUS_LABELS } from '../../../constants/status.js'
import { contractService } from '../../../services/contractService.js'
import { useContract } from '../../../composables/useContract.js'

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

// Get contracts for overlap checking
const { contracts, fetchAllContracts } = useContract()

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
  allowances: '',
  contractOverlap: ''
})


const approveStatusOptions = [
  { value: 'Tạo mới', text: 'Tạo mới' },
  { value: 'Chờ duyệt', text: 'Chờ duyệt' },
  { value: 'Đã duyệt', text: 'Đã duyệt' },
  { value: 'Từ chối', text: 'Từ chối' }
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

// Get available allowances for a specific index (excluding already selected ones)
const getAvailableAllowances = (currentIndex) => {
  // Get all selected allowance IDs except the current one
  const selectedAllowanceIDs = formData.value.allowances
    .map((allowance, index) => index !== currentIndex && allowance.allowanceID ? allowance.allowanceID : null)
    .filter(id => id !== null)
  
  // Get current allowance ID (if any)
  const currentAllowanceID = formData.value.allowances[currentIndex]?.allowanceID
  
  // Filter allowances to exclude already selected ones, but include the current one if selected
  return allowances.value.filter(allowance => 
    !selectedAllowanceIDs.includes(allowance.id) || allowance.id == currentAllowanceID
  )
}

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
      endDate: (newContract.endDate === null || newContract.endDate === undefined) 
        ? '' 
        : formatDateForInput(newContract.endDate),
      contractSalary: newContract.contractSalary ?? '',
      insuranceSalary: newContract.insuranceSalary ?? '',
      approveStatus: approveStatusValue,
      allowances: (newContract.allowances || []).map(a => ({
        allowanceID: a.allowanceID || a.allowance?.id || '',
        value: a.value || 0
      }))
    }
  }
}, { deep: true, immediate: true })

function formatDateForInput(dateString) {
  if (!dateString || dateString === null || dateString === undefined || dateString === '') return ''
  const date = new Date(dateString)
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString)
    return ''
  }
  return date.toISOString().split('T')[0]
}

// Helper function to calculate end date (startDate + months)
const calculateEndDate = (startDate, months) => {
  if (!startDate) return ''
  const date = new Date(startDate)
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid start date for calculation:', startDate)
    return ''
  }
  date.setMonth(date.getMonth() + parseInt(months))
  return date.toISOString().split('T')[0]
}

// Watch for changes in start date to auto-calculate end date for probation contracts
watch(() => formData.value.startDate, (newStartDate) => {
  // For probation contracts, always use 2 months
  if (isProbationContract.value && newStartDate) {
    // Validate date before calculating
    const date = new Date(newStartDate)
    if (!isNaN(date.getTime())) {
      formData.value.endDate = calculateEndDate(newStartDate, 2)
    }
  }
})

// Watch for contract type changes
watch(() => formData.value.contractTypeID, (newContractTypeID) => {
  if (isIndeterminateTermContract.value) {
    // For indeterminate term contracts, clear end date
    formData.value.endDate = ''
  }
  
  // Auto-calculate end date for probation contracts if start date is set
  if (isProbationContract.value && formData.value.startDate) {
    // Validate date before calculating
    const date = new Date(formData.value.startDate)
    if (!isNaN(date.getTime())) {
      formData.value.endDate = calculateEndDate(formData.value.startDate, 2)
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
  
  // Validate end date when start date changes
  if (formData.value.endDate && formData.value.endDate.trim() !== '' && !isIndeterminateTermContract.value) {
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
  
  // End date is optional and readonly for indeterminate term contracts
  if (isIndeterminateTermContract.value) {
    errors.value.endDate = ''
    return true
  }
  
  // End date is readonly for probation contracts (auto-calculated)
  if (isProbationContract.value) {
    errors.value.endDate = ''
    return true
  }
  
  // For determined term contracts, end date is required
  if (!value && isDeterminedTermContract.value) {
    errors.value.endDate = 'Ngày kết thúc không được để trống'
    return false
  }
  
  if (value && !regexPatterns.date.test(value)) {
    errors.value.endDate = 'Định dạng ngày kết thúc không hợp lệ'
    return false
  }
  
  if (value && value.trim() !== '') {
    const endDate = new Date(value)
    if (isNaN(endDate.getTime())) {
      errors.value.endDate = 'Ngày kết thúc không hợp lệ'
      return false
    }
    
    // Validate end date is after start date
    if (formData.value.startDate && formData.value.startDate.trim() !== '') {
      const startDate = new Date(formData.value.startDate)
      if (!isNaN(startDate.getTime()) && startDate >= endDate) {
        errors.value.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
        return false
      }
    }
  }
  
  errors.value.endDate = ''
  return true
}

// Helper function to check if approveStatus indicates approved
const isApproved = (approveStatus) => {
  if (!approveStatus) return false
  if (typeof approveStatus === 'string') {
    return approveStatus === 'Đã duyệt' || approveStatus === 'Approved'
  }
  if (typeof approveStatus === 'number') {
    return approveStatus === 2
  }
  return false
}

// Check for contract overlap with approved contracts
const checkContractOverlap = () => {
  // Only check if we have employee, startDate, and endDate (or indeterminate term)
  if (!formData.value.employeeID || !formData.value.startDate) {
    errors.value.contractOverlap = ''
    return true
  }

  // For indeterminate term contracts without endDate, check if employee has any approved contract
  if (isIndeterminateTermContract.value && !formData.value.endDate) {
    const existingIndeterminateContract = contracts.value.find(c => 
      c.employeeID === formData.value.employeeID &&
      isApproved(c.approveStatus) &&
      c.id !== formData.value.id && // Exclude current contract if updating
      (!c.endDate || c.endDate === null || c.endDate === '')
    )
    
    if (existingIndeterminateContract) {
      errors.value.contractOverlap = 'Nhân viên này đã có hợp đồng không xác định thời hạn còn hiệu lực. Không thể tạo hợp đồng mới.'
      return false
    }
  }

  const newStartDate = new Date(formData.value.startDate)
  // Check if start date is valid
  if (isNaN(newStartDate.getTime())) {
    errors.value.contractOverlap = ''
    return true // Skip overlap check if date is invalid (validation will catch it)
  }
  newStartDate.setHours(0, 0, 0, 0)
  
  // For contracts with endDate, use it; for indeterminate, use a far future date for comparison
  let newEndDate
  if (formData.value.endDate) {
    newEndDate = new Date(formData.value.endDate)
    // Check if end date is valid
    if (isNaN(newEndDate.getTime())) {
      errors.value.contractOverlap = ''
      return true // Skip overlap check if date is invalid
    }
    newEndDate.setHours(23, 59, 59, 999)
  } else if (isIndeterminateTermContract.value) {
    // For indeterminate term, treat as infinite (use far future date)
    newEndDate = new Date('2099-12-31')
    newEndDate.setHours(23, 59, 59, 999)
  } else {
    // If no endDate and not indeterminate, validation should have caught this
    errors.value.contractOverlap = ''
    return true
  }

  // Get all approved contracts for this employee (excluding current contract if updating)
  const existingContracts = contracts.value.filter(c => 
    c.employeeID === formData.value.employeeID &&
    isApproved(c.approveStatus) &&
    c.id !== formData.value.id // Exclude current contract if updating
  )

  // Check for overlap with each existing contract
  for (const existingContract of existingContracts) {
    // Skip if existing contract doesn't have valid start date
    if (!existingContract.startDate) {
      continue
    }
    
    const existingStartDate = new Date(existingContract.startDate)
    // Skip if date is invalid
    if (isNaN(existingStartDate.getTime())) {
      console.warn('Invalid start date in existing contract:', existingContract.startDate)
      continue
    }
    existingStartDate.setHours(0, 0, 0, 0)
    
    let existingEndDate
    if (existingContract.endDate) {
      existingEndDate = new Date(existingContract.endDate)
      // Check if end date is valid
      if (isNaN(existingEndDate.getTime())) {
        console.warn('Invalid end date in existing contract:', existingContract.endDate)
        continue
      }
      existingEndDate.setHours(23, 59, 59, 999)
    } else {
      // Indeterminate term contract - treat as infinite
      existingEndDate = new Date('2099-12-31')
      existingEndDate.setHours(23, 59, 59, 999)
    }

    // Check if there's an overlap
    // Overlap occurs if: newStartDate <= existingEndDate AND newEndDate >= existingStartDate
    if (newStartDate <= existingEndDate && newEndDate >= existingStartDate) {
      const contractNumber = existingContract.contractNumber || existingContract.id
      const existingStart = existingStartDate.toLocaleDateString('vi-VN')
      const existingEnd = existingContract.endDate 
        ? existingEndDate.toLocaleDateString('vi-VN')
        : 'không xác định thời hạn'
      
      errors.value.contractOverlap = `Hợp đồng này trùng với hợp đồng đã duyệt: ${contractNumber} (${existingStart} - ${existingEnd}). Mỗi thời điểm nhân viên chỉ được phép có 1 hợp đồng còn hiệu lực.`
      return false
    }
  }

  errors.value.contractOverlap = ''
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
      break
    case 'employeeID':
      validateEmployeeID()
      // Check overlap when employee changes
      if (formData.value.startDate) {
        checkContractOverlap()
      }
      break
    case 'startDate':
      validateStartDate()
      // Re-validate end date when start date changes
      if (formData.value.endDate) {
        validateEndDate()
      }
      // Check overlap when dates change
      if (formData.value.employeeID) {
        checkContractOverlap()
      }
      break
    case 'endDate':
      validateEndDate()
      // Re-validate start date when end date changes
      if (formData.value.startDate) {
        validateStartDate()
      }
      // Check overlap when dates change
      if (formData.value.employeeID) {
        checkContractOverlap()
      }
      break
    case 'contractSalary':
      validateContractSalary()
      break
    case 'insuranceSalary':
      validateInsuranceSalary()
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
    checkContractOverlap(), // Check for contract overlap
    validateContractSalary(),
    validateInsuranceSalary(),
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
    // For indeterminate term contracts, set endDate to null instead of empty string
    endDate: (isIndeterminateTermContract.value || !formData.value.endDate) 
      ? null 
      : formData.value.endDate,
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
    fetchAllowances(),
    fetchAllContracts() // Load contracts for overlap checking
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
          <div class="col-md-6">
            <label class="form-label">Từ ngày <span class="text-danger">*</span></label>
            <input 
              type="date" 
              class="form-control" 
              :class="{ 'is-invalid': errors.startDate }"
              v-model="formData.startDate" 
              @blur="validateField('startDate')"
              @change="validateField('startDate')"
            />
            <div class="invalid-feedback">{{ errors.startDate }}</div>
          </div>
          
          <div class="col-md-6">
            <label class="form-label">
              Đến ngày 
              <span v-if="isDeterminedTermContract" class="text-danger">*</span>
            </label>
            <input 
              type="date" 
              class="form-control" 
              :class="{ 'is-invalid': errors.endDate }"
              v-model="formData.endDate" 
              @blur="validateField('endDate')"
              @change="validateField('endDate')"
              :readonly="isProbationContract || isIndeterminateTermContract"
              :required="isDeterminedTermContract"
              :disabled="isProbationContract || isIndeterminateTermContract"
            />
            <div class="invalid-feedback">{{ errors.endDate }}</div>
            <small v-if="isProbationContract" class="form-text text-muted">
              Tự động tính: từ ngày + 2 tháng
            </small>
            <small v-else-if="isIndeterminateTermContract" class="form-text text-muted">
              Hợp đồng không xác định thời hạn (không cần nhập đến ngày)
            </small>
          </div>
        </div>
        <!-- Contract Overlap Error -->
        <div v-if="errors.contractOverlap" class="alert alert-danger mt-3" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ errors.contractOverlap }}
        </div>
        
      </div>

      <!-- Thông tin lương -->
      <div class="form-group">
        <h6 class="group-title">
          <i class="fas fa-money-bill-wave me-2"></i>
          Thông tin lương
        </h6>
        <div class="row g-4">
          <div class="col-md-6">
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
          <div class="col-md-6">
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
        <div class="allowances-container">
          <div v-if="errors.allowances" class="alert alert-danger mb-3" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>{{ errors.allowances }}
          </div>
          
          <div v-if="formData.allowances.length > 0" class="allowances-list">
            <div 
              v-for="(allowance, index) in formData.allowances" 
              :key="index"
              class="allowance-item"
            >
              <div class="allowance-item-content">
                <div class="allowance-field">
                  <label class="allowance-label">
                    Loại phụ cấp <span class="text-danger">*</span>
                  </label>
                  <select 
                    class="form-select" 
                    :class="{ 'is-invalid': errors.allowances && !allowance.allowanceID && (allowance.value || allowance.value === 0) }"
                    v-model="allowance.allowanceID"
                    @change="validateField('allowances')"
                    :disabled="loading"
                  >
                    <option value="">{{ loading ? 'Đang tải...' : 'Chọn phụ cấp' }}</option>
                    <!-- Show available allowances (excluding already selected ones, but including current one) -->
                    <option 
                      v-for="allow in getAvailableAllowances(index)" 
                      :key="allow.id" 
                      :value="allow.id"
                    >
                      {{ allow.allowanceName }}
                    </option>
                  </select>
                </div>
                
                <div class="allowance-field">
                  <label class="allowance-label">
                    Giá trị (VNĐ) <span class="text-danger">*</span>
                  </label>
                  <div class="input-group">
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
                </div>
                
                <div class="allowance-action">
                  <button 
                    type="button" 
                    class="btn btn-outline-danger btn-remove"
                    @click="removeAllowance(index); validateField('allowances')"
                    :disabled="loading"
                    title="Xóa phụ cấp"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="allowances-empty">
            <i class="fas fa-inbox"></i>
            <p>Chưa có phụ cấp nào được thêm</p>
          </div>
        </div>
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

/* Allowances styling */
.allowances-container {
  padding: 0;
}

.allowances-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.allowance-item {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.allowance-item:hover {
  border-color: #c0c0c0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.allowance-item-content {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.allowance-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.allowance-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.allowance-field .form-select,
.allowance-field .form-control {
  width: 100%;
}

.allowance-field .input-group {
  width: 100%;
}

.allowance-action {
  display: flex;
  align-items: flex-end;
  padding-bottom: 0.5rem;
}

.btn-remove {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  transform: scale(1.05);
}

.allowances-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.allowances-empty i {
  font-size: 3rem;
  color: #dee2e6;
  margin-bottom: 1rem;
  display: block;
}

.allowances-empty p {
  margin: 0;
  font-size: 0.95rem;
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
  
  .allowance-item-content {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .allowance-action {
    padding-bottom: 0;
    justify-content: flex-end;
  }
  
  .allowances-empty {
    padding: 2rem 1rem;
  }
  
  .allowances-empty i {
    font-size: 2.5rem;
  }
}
</style>