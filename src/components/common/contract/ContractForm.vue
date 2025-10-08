<script setup>
import { ref, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'

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
  contractTypes: {
    type: Array,
    default: () => []
  },
  contractForms: {
    type: Array,
    default: () => []
  },
  allowances: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['submit', 'close'])

const formData = ref({
  id: props.contract?.id ?? '',
  contractNumber: props.contract?.contractNumber ?? '',
  contractTypeID: props.contract?.contractTypeID ?? '',
  contractFormID: props.contract?.contractFormID ?? '',
  employeeID: props.contract?.employeeID ?? '',
  status: props.contract?.status ?? 'Đã ký',
  startDate: formatDateForInput(props.contract?.startDate),
  endDate: formatDateForInput(props.contract?.endDate),
  contractSalary: props.contract?.contractSalary ?? '',
  insuranceSalary: props.contract?.insuranceSalary ?? '',
  approveStatus: props.contract?.approveStatus ?? 'Chờ duyệt',
  allowances: (props.contract?.allowances || []).map(a => ({
    allowanceID: a.allowanceID || a.allowance?.id || '',
    value: a.value || 0
  }))
})

const statusOptions = [
  { value: 'Chờ ký', text: 'Chờ ký' },
  { value: 'Đã ký', text: 'Đã ký' },
  { value: 'Hết hạn', text: 'Hết hạn' },
  { value: 'Hủy bỏ', text: 'Hủy bỏ' }
]

const approveStatusOptions = [
  { value: 'Chờ duyệt', text: 'Chờ duyệt' },
  { value: 'Đã duyệt', text: 'Đã duyệt' },
  { value: 'Từ chối', text: 'Từ chối' }
]

// Watch for changes in contract prop
watch(() => props.contract, (newContract) => {
  if (newContract) {
    formData.value = {
      id: newContract.id ?? '',
      contractNumber: newContract.contractNumber ?? '',
      contractTypeID: newContract.contractTypeID ?? '',
      contractFormID: newContract.contractFormID ?? '',
      employeeID: newContract.employeeID ?? '',
      status: newContract.status ?? 'Đã ký',
      startDate: formatDateForInput(newContract.startDate),
      endDate: formatDateForInput(newContract.endDate),
      contractSalary: newContract.contractSalary ?? '',
      insuranceSalary: newContract.insuranceSalary ?? '',
      approveStatus: newContract.approveStatus ?? 'Chờ duyệt',
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

const handleSubmit = () => {
  // Validation
  if (!formData.value.contractNumber || !formData.value.contractTypeID || 
      !formData.value.contractFormID || !formData.value.employeeID ||
      !formData.value.startDate || !formData.value.endDate ||
      !formData.value.contractSalary || !formData.value.insuranceSalary) {
    alert('Vui lòng điền đầy đủ thông tin bắt buộc')
    return
  }

  // Date validation
  const startDate = new Date(formData.value.startDate)
  const endDate = new Date(formData.value.endDate)
  
  if (startDate >= endDate) {
    alert('Ngày kết thúc phải sau ngày bắt đầu')
    return
  }

  // Salary validation
  if (parseFloat(formData.value.contractSalary) <= 0 || parseFloat(formData.value.insuranceSalary) <= 0) {
    alert('Lương hợp đồng và lương bảo hiểm phải lớn hơn 0')
    return
  }

  emit('submit', formData.value)
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

// Reset form when mode changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'create') {
    formData.value = {
      id: '',
      contractNumber: '',
      contractTypeID: '',
      contractFormID: '',
      employeeID: '',
      status: 'Đã ký',
      startDate: '',
      endDate: '',
      contractSalary: '',
      insuranceSalary: '',
      approveStatus: 'Chờ duyệt',
      allowances: []
    }
  }
})
</script>

<template>
  <div class="form-card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="fas fa-file-contract me-2"></i>
        {{ props.mode === 'create' ? 'Thêm hợp đồng lao động' : 'Cập nhật hợp đồng lao động' }}
      </h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="handleSubmit">
        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <FormField 
              label="Số hợp đồng" 
              type="text" 
              v-model="formData.contractNumber" 
              required 
              placeholder="Nhập số hợp đồng"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Nhân viên <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.employeeID" required>
              <option value="">Chọn nhân viên</option>
              <option v-for="employee in employees" :key="employee.id" :value="employee.id" 
                      :selected="formData.employeeID === employee.id">
                {{ employee.firstName }} {{ employee.lastName }} - {{ employee.employeeCode }}
              </option>
            </select>
          </div>
        </div>

        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <label class="form-label">Loại hợp đồng <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.contractTypeID" required>
              <option value="">Chọn loại hợp đồng</option>
              <option v-for="type in contractTypes" :key="type.id" :value="type.id" 
                      :selected="formData.contractTypeID == type.id">
                {{ type.contractTypeName }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Hình thức hợp đồng <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.contractFormID" required>
              <option value="">Chọn hình thức hợp đồng</option>
              <option v-for="form in contractForms" :key="form.id" :value="form.id" 
                      :selected="formData.contractFormID == form.id">
                {{ form.contractFormName }}
              </option>
            </select>
          </div>
        </div>

        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <FormField 
              label="Từ ngày" 
              type="date" 
              v-model="formData.startDate" 
              required 
            />
          </div>
          <div class="col-md-6">
            <FormField 
              label="Đến ngày" 
              type="date" 
              v-model="formData.endDate" 
              required 
            />
          </div>
        </div>

        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <FormField 
              label="Lương hợp đồng" 
              type="number" 
              v-model="formData.contractSalary" 
              required 
              placeholder="Nhập lương hợp đồng"
              step="1000"
            />
          </div>
          <div class="col-md-6">
            <FormField 
              label="Lương bảo hiểm" 
              type="number" 
              v-model="formData.insuranceSalary" 
              required 
              placeholder="Nhập lương bảo hiểm"
              step="1000"
            />
          </div>
        </div>

        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <label class="form-label">Trạng thái</label>
            <select class="form-select" v-model="formData.status">
              <option v-for="status in statusOptions" :key="status.value" :value="status.value" 
                      :selected="formData.status === status.value">
                {{ status.text }}
              </option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Trạng thái duyệt</label>
            <select class="form-select" v-model="formData.approveStatus">
              <option v-for="status in approveStatusOptions" :key="status.value" :value="status.value" 
                      :selected="formData.approveStatus === status.value">
                {{ status.text }}
              </option>
            </select>
          </div>
        </div>

        <!-- Allowances Section -->
        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Phụ cấp</h6>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="addAllowance">
              <i class="fas fa-plus me-1"></i> Thêm phụ cấp
            </button>
          </div>
          
          <div v-if="formData.allowances.length === 0" class="text-muted text-center py-3">
            Chưa có phụ cấp nào
          </div>
          
          <div v-for="(allowance, index) in formData.allowances" :key="index" class="row g-3 mb-3">
            <div class="col-md-5">
              <label class="form-label">Loại phụ cấp</label>
              <select class="form-select" v-model="allowance.allowanceID">
                <option value="">Chọn phụ cấp</option>
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
  </div>
</template>

<style scoped>
.form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: none;
}

.card-body {
  padding: 1.5rem;
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

.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}
</style>