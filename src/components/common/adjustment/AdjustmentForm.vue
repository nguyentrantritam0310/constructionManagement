<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Helper function to format date for input field
const formatDateForInput = (dateValue) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const formData = ref({
  voucherNo: props.adjustment.voucherNo || '',
  decisionDate: formatDateForInput(props.adjustment.decisionDate),
  month: props.adjustment.Month || props.adjustment.month || '',
  year: props.adjustment.Year || props.adjustment.year || currentYear,
  adjustmentTypeID: props.adjustment.AdjustmentTypeID || props.adjustment.adjustmentTypeID || '',
  adjustmentItemID: props.adjustment.AdjustmentItemID || props.adjustment.adjustmentItemID || '',
  reason: props.adjustment.Reason || props.adjustment.reason || '',
  employees: props.adjustment.Employees || props.adjustment.employees || []
})

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
    } catch (error) {
      console.error('Error loading adjustment items:', error)
    }
  } else {
    adjustmentItems.value = []
  }
  // Only reset adjustmentItemID if we're in create mode
  if (props.mode === 'create') {
    formData.value.adjustmentItemID = ''
  }
}

const handleSubmit = () => {
  // Transform data to match backend DTO format (POST/PUT DTOs use camelCase)
  const submitData = {
    voucherNo: formData.value.voucherNo,
    decisionDate: formData.value.decisionDate, // Already in YYYY-MM-DD format
    month: parseInt(formData.value.month),
    year: parseInt(formData.value.year),
    reason: formData.value.reason,
    adjustmentTypeID: parseInt(formData.value.adjustmentTypeID),
    // Only include adjustmentItemID if it has a value
    ...(formData.value.adjustmentItemID && { adjustmentItemID: parseInt(formData.value.adjustmentItemID) }),
    employees: selectedEmployees.value
      .filter(emp => emp.employeeID && emp.value !== 0)
      .map(emp => ({
        employeeID: emp.employeeID,
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
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <FormField label="Số phiếu" type="text" v-model="formData.voucherNo" required />
      </div>
      <div class="col-md-4">
        <FormField label="Ngày Quyết định" type="date" v-model="formData.decisionDate" required />
      </div>
      <div class="col-md-4">
        <FormField label="Tháng" type="number" v-model="formData.month" min="1" max="12" required />
      </div>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <FormField label="Năm" type="number" v-model="formData.year" readonly />
      </div>
      <div class="col-md-4">
        <label class="form-label">Khoản cộng trừ</label>
        <select class="form-select" v-model="formData.adjustmentTypeID" @change="onAdjustmentTypeChange">
          <option value="">Chọn khoản cộng trừ</option>
          <option v-for="type in adjustmentTypes" :key="type.id" :value="type.id">
            {{ type.adjustmentTypeName }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Hạng mục</label>
        <select class="form-select" v-model="formData.adjustmentItemID">
          <option value="">Chọn hạng mục</option>
          <option v-for="item in adjustmentItems" :key="item.id" :value="item.id">
            {{ item.adjustmentItemName }}
          </option>
        </select>
      </div>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <FormField label="Lý do" type="text" v-model="formData.reason" />
      </div>
    </div>

    <!-- Bảng nhân viên -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Danh sách nhân viên</h5>
        <button type="button" class="btn btn-sm btn-outline-primary" @click="addEmployeeRow">
          <i class="fas fa-plus me-1"></i>Thêm nhân viên
        </button>
      </div>
      
      <div class="table-responsive" v-if="selectedEmployees.length > 0">
        <table class="table table-bordered">
          <thead class="table-light">
            <tr>
              <th>Nhân viên</th>
              <th>Tên nhân viên</th>
              <th>Giá trị</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(employee, index) in selectedEmployees" :key="index">
              <td>
                <select 
                  class="form-select" 
                  v-model="employee.employeeID"
                  @change="updateEmployeeName(index, employee.employeeID)"
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
                  type="text" 
                  class="form-control" 
                  v-model="employee.employeeName" 
                  readonly
                />
              </td>
              <td>
                <input 
                  type="number" 
                  class="form-control" 
                  v-model="employee.value" 
                  step="0.01"
                  min="0"
                />
              </td>
              <td>
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-danger"
                  @click="removeEmployeeRow(index)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="text-center text-muted py-3">
        <p>Chưa có nhân viên nào được chọn</p>
      </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}</button>
    </div>
  </form>
</template>
