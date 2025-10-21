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

const handleSubmit = () => {
  // Basic validation
  if (!formData.value.contractNumber || !formData.value.contractTypeID || 
      !formData.value.employeeID ||
      !formData.value.startDate || !formData.value.contractSalary || !formData.value.insuranceSalary) {
    alert('Vui lòng điền đầy đủ thông tin bắt buộc')
    return
  }

  // Validation for determined term contracts
  if (isDeterminedTermContract.value) {
    if (!formData.value.validityPeriod) {
      alert('Vui lòng chọn hiệu lực hợp đồng')
      return
    }
    if (!formData.value.endDate) {
      alert('Ngày kết thúc không được để trống')
      return
    }
  }

  // Validation for probation contracts
  if (isProbationContract.value) {
    if (!formData.value.endDate) {
      alert('Ngày kết thúc không được để trống')
      return
    }
  }

  // Validation for indeterminate term contracts
  if (isIndeterminateTermContract.value) {
    // End date is not required for indeterminate term contracts
    // But if provided, it should be after start date
    if (formData.value.endDate) {
      const startDate = new Date(formData.value.startDate)
      const endDate = new Date(formData.value.endDate)
      
      if (startDate >= endDate) {
        alert('Ngày kết thúc phải sau ngày bắt đầu')
        return
      }
    }
  }

  // Validation for other contract types (excluding determined term, indeterminate term, and probation)
  if (!isDeterminedTermContract.value && !isIndeterminateTermContract.value && !isProbationContract.value) {
    if (!formData.value.endDate) {
      alert('Ngày kết thúc không được để trống')
      return
    }
    
    const startDate = new Date(formData.value.startDate)
    const endDate = new Date(formData.value.endDate)
    
    if (startDate >= endDate) {
      alert('Ngày kết thúc phải sau ngày bắt đầu')
      return
    }
  }

  // Salary validation
  if (parseFloat(formData.value.contractSalary) <= 0 || parseFloat(formData.value.insuranceSalary) <= 0) {
    alert('Lương hợp đồng và lương bảo hiểm phải lớn hơn 0')
    return
  }

  // Probation contract duration validation
  if (isProbationContract.value && formData.value.startDate && formData.value.endDate) {
    const startDate = new Date(formData.value.startDate)
    const endDate = new Date(formData.value.endDate)
    const durationInMonths = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth())
    
    if (durationInMonths > 2) {
      alert('Hợp đồng thử việc không được vượt quá 2 tháng')
      return
    }
  }

  // Format data for API submission - keep Vietnamese string status
  const submitData = {
    ...formData.value
  }

  // Remove ValidityPeriod from submit data as it's not in the backend entity
  delete submitData.validityPeriod

  console.log('=== CONTRACT FORM SUBMIT DEBUG ===')
  console.log('Form mode:', props.mode)
  console.log('Form data:', formData.value)
  console.log('ApproveStatus:', formData.value.approveStatus, 'Type:', typeof formData.value.approveStatus)
  console.log('Submit data:', submitData)
  console.log('Submit data keys:', Object.keys(submitData))
  console.log('Submit data values:', Object.values(submitData))
  console.log('=== END SUBMIT DEBUG ===')

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
            <FormField 
              label="Số hợp đồng" 
              type="text" 
              v-model="formData.contractNumber" 
              required 
              placeholder="Nhập số hợp đồng"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.employeeID" required>
              <option value="">Chọn nhân viên</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id" 
                      :selected="formData.employeeID === employee.id">
                {{ employee.firstName }} {{ employee.lastName }} - {{ employee.employeeCode }}
              </option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Loại hợp đồng <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.contractTypeID" required :disabled="loading">
              <option value="">{{ loading ? 'Đang tải...' : 'Chọn loại hợp đồng' }}</option>
              <option v-for="type in contractTypes" :key="type.id" :value="type.id" 
                      :selected="formData.contractTypeID == type.id">
                {{ type.contractTypeName }}
              </option>
            </select>
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
          <div v-if="isDeterminedTermContract" class="col-md-4">
            <label class="form-label">Hiệu lực <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.validityPeriod" required>
              <option value="">Chọn hiệu lực</option>
              <option v-for="validity in validityOptions" :key="validity.value" :value="validity.value">
                {{ validity.text }}
              </option>
            </select>
          </div>
          
          <div class="col-md-4">
            <FormField 
              label="Từ ngày" 
              type="date" 
              v-model="formData.startDate" 
              required 
            />
          </div>
          
          <div class="col-md-4">
            <FormField 
              label="Đến ngày" 
              type="date" 
              v-model="formData.endDate" 
              :required="!isIndeterminateTermContract"
              :readonly="isDeterminedTermContract || isProbationContract"
            />
            <small v-if="isDeterminedTermContract || isProbationContract" class="form-text text-muted">
              Tự động tính dựa trên từ ngày và hiệu lực
            </small>
            <small v-else-if="isIndeterminateTermContract" class="form-text text-muted">
              Hợp đồng không xác định thời hạn
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
            <FormField 
              label="Lương hợp đồng" 
              type="number" 
              v-model="formData.contractSalary" 
              required 
              placeholder="Nhập lương hợp đồng"
              step="1000"
            />
          </div>
          <div class="col-md-4">
            <FormField 
              label="Lương bảo hiểm" 
              type="number" 
              v-model="formData.insuranceSalary" 
              required 
              placeholder="Nhập lương bảo hiểm"
              step="1000"
            />
          </div>
          <div class="col-md-4">
            <label class="form-label">Trạng thái duyệt</label>
            <select class="form-select" v-model="formData.approveStatus">
              <option v-for="status in approveStatusOptions" :key="status.value" :value="status.value" 
                      :selected="formData.approveStatus === status.value">
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
          <div v-if="formData.allowances.length === 0" class="col-12">
            <div class="text-muted text-center py-3">
              Chưa có phụ cấp nào
            </div>
          </div>
          
          <div v-for="(allowance, index) in formData.allowances" :key="index" class="col-12">
            <div class="row g-3">
              <div class="col-md-5">
                <label class="form-label">Loại phụ cấp</label>
                <select class="form-select" v-model="allowance.allowanceID" :disabled="loading">
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
                  v-model="allowance.value" 
                  placeholder="Nhập giá trị phụ cấp"
                  step="1000"
                />
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="button" class="btn btn-outline-danger btn-sm" @click="removeAllowance(index)">
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