<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import { useConstructionPlan } from '../../composables/useConstructionPlan'
import { useUser } from '../../composables/useUser'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useTask } from '../../composables/useTask'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  plan: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const {
  formData,
  createPlan,
  updatePlan,
} = useConstructionPlan()

const { constructions, fetchConstructions } = useConstructionManagement()

const {
  users,
  fetchUsers,
} = useUser()

const { showMessage } = useGlobalMessage()

const { fetchTasksByItemId } = useTask()

const emit = defineEmits(['close'])

const formError = ref('')
const volumeInfo = ref({
  totalVolume: 0,
  totalPlanned: 0,
  remaining: 0,
  loading: false
})

// Regex patterns cho validation
const regexPatterns = {
  // Ngày: định dạng YYYY-MM-DD
  date: /^\d{4}-\d{2}-\d{2}$/,
  // ID: chỉ số nguyên dương
  id: /^[1-9]\d*$/
}

// Validation errors
const errors = ref({
  constructionID: '',
  constructionItemID: '',
  employeeID: '',
  startDate: '',
  expectedCompletionDate: ''
})

// Khởi tạo formData với dữ liệu của plan nếu là chế độ update
const initFormData = () => {
  if (props.mode === 'update' && props.plan) {
    Object.assign(formData, {
      constructionID: props.plan.constructionID,
      constructionItemID: props.plan.constructionItemID,
      employeeID: props.plan.employeeID,
      startDate: new Date(props.plan.startDate).toISOString().split('T')[0],
      expectedCompletionDate: new Date(props.plan.expectedCompletionDate).toISOString().split('T')[0]
    })
  }
}

onMounted(() => {
  fetchConstructions()
  fetchUsers('manager')
  initFormData()
})

// Watch cho props.plan để cập nhật formData khi plan thay đổi
watch(() => props.plan, (newPlan) => {
  if (props.mode === 'update' && newPlan) {
    initFormData()
  }
}, { immediate: true })

const filteredConstructionItems = computed(() => {
  if (!constructions.value.length || !formData.constructionID) return []
  const selectedID = Number(formData.constructionID)
  const selectedconstruction = constructions.value.find(construction => construction.id === selectedID)
  return selectedconstruction?.constructionItems || []
})

watch(() => formData.constructionID, (newVal) => {
  if (newVal) {
    console.log('Đã chọn công trình ID:', newVal)
    const construction = constructions.value.find(p => p.id === Number(newVal))
    console.log('Hạng mục của công trình:', construction?.constructionItems)
    // Reset constructionItemID khi đổi công trình
    formData.constructionItemID = ''
    // Reset volume info
    volumeInfo.value = { totalVolume: 0, totalPlanned: 0, remaining: 0, loading: false }
    // Validate constructionID
    validateField('constructionID')
  }
})

// Watch constructionItemID để load thông tin khối lượng
watch(() => formData.constructionItemID, async (newVal) => {
  if (newVal && props.mode === 'create') {
    const item = filteredConstructionItems.value.find(i => i.id === Number(newVal))
    if (item) {
      volumeInfo.value.loading = true
      try {
        const totalVolume = parseFloat(item.totalVolume || 0)
        const tasksOfItem = await fetchTasksByItemId(newVal)
        const totalPlanned = tasksOfItem.reduce((sum, t) => sum + (parseFloat(t.plannedVolume || t.workload) || 0), 0)
        const remaining = totalVolume - totalPlanned
        
        volumeInfo.value = {
          totalVolume,
          totalPlanned,
          remaining,
          loading: false
        }
      } catch (error) {
        console.error('Error loading volume info:', error)
        volumeInfo.value.loading = false
      }
    }
  } else {
    volumeInfo.value = { totalVolume: 0, totalPlanned: 0, remaining: 0, loading: false }
  }
})

// Validation functions
const validateConstructionID = () => {
  const value = formData.constructionID
  if (!value) {
    errors.value.constructionID = 'Vui lòng chọn công trình'
    return false
  }
  errors.value.constructionID = ''
  return true
}

const validateConstructionItemID = () => {
  const value = formData.constructionItemID
  if (!value) {
    errors.value.constructionItemID = 'Vui lòng chọn hạng mục'
    return false
  }
  
  // Validate hạng mục thuộc công trình đã chọn
  if (formData.constructionID) {
    const item = filteredConstructionItems.value.find(i => i.id == value || i.id === Number(value))
    if (!item) {
      errors.value.constructionItemID = 'Hạng mục không thuộc công trình đã chọn'
      return false
    }
  }
  
  errors.value.constructionItemID = ''
  return true
}

const validateEmployeeID = () => {
  const value = formData.employeeID
  if (!value) {
    errors.value.employeeID = 'Vui lòng chọn chỉ huy phụ trách'
    return false
  }
  errors.value.employeeID = ''
  return true
}

const validateStartDate = () => {
  const value = formData.startDate
  if (!value) {
    errors.value.startDate = 'Ngày bắt đầu không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.startDate = 'Định dạng ngày bắt đầu không hợp lệ'
    return false
  }
  
  const startDate = new Date(value)
  if (isNaN(startDate.getTime()) || startDate.toISOString().split('T')[0] !== value) {
    errors.value.startDate = 'Ngày bắt đầu không hợp lệ'
    return false
  }
  
  // Ngày bắt đầu không được quá tương lai (cho phép tối đa 1 năm)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  if (startDate > maxDate) {
    errors.value.startDate = 'Ngày bắt đầu không được vượt quá 1 năm trong tương lai'
    return false
  }
  
  // Validate end date when start date changes
  if (formData.expectedCompletionDate) {
    const endDate = new Date(formData.expectedCompletionDate)
    if (!isNaN(endDate.getTime()) && startDate >= endDate) {
      errors.value.startDate = 'Ngày bắt đầu phải trước ngày kết thúc'
      // Also update end date error
      validateExpectedCompletionDate()
    }
  }
  
  errors.value.startDate = ''
  return true
}

const validateExpectedCompletionDate = () => {
  const value = formData.expectedCompletionDate
  if (!value) {
    errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được để trống'
    return false
  }
  if (!regexPatterns.date.test(value)) {
    errors.value.expectedCompletionDate = 'Định dạng ngày kết thúc không hợp lệ'
    return false
  }
  
  const endDate = new Date(value)
  if (isNaN(endDate.getTime()) || endDate.toISOString().split('T')[0] !== value) {
    errors.value.expectedCompletionDate = 'Ngày kết thúc không hợp lệ'
    return false
  }
  
  // Validate end date is after start date
  if (formData.startDate) {
    const startDate = new Date(formData.startDate)
    if (!isNaN(startDate.getTime())) {
      if (startDate >= endDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến phải sau ngày bắt đầu'
        return false
      }
      
      // Ngày kết thúc không được quá xa trong tương lai (tối đa 10 năm sau ngày bắt đầu)
      const maxDate = new Date(startDate)
      maxDate.setFullYear(maxDate.getFullYear() + 10)
      if (endDate > maxDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được vượt quá 10 năm sau ngày bắt đầu'
        return false
      }
      
      // Ngày kết thúc không được quá tương lai (cho phép tối đa 20 năm)
      const absoluteMaxDate = new Date()
      absoluteMaxDate.setFullYear(absoluteMaxDate.getFullYear() + 20)
      if (endDate > absoluteMaxDate) {
        errors.value.expectedCompletionDate = 'Ngày kết thúc dự kiến không được vượt quá 20 năm trong tương lai'
        return false
      }
    }
  }
  
  errors.value.expectedCompletionDate = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'constructionID':
      validateConstructionID()
      // Re-validate constructionItemID when constructionID changes
      if (formData.constructionItemID) {
        validateConstructionItemID()
      }
      break
    case 'constructionItemID':
      validateConstructionItemID()
      break
    case 'employeeID':
      validateEmployeeID()
      break
    case 'startDate':
      validateStartDate()
      // Re-validate end date when start date changes
      if (formData.expectedCompletionDate) {
        validateExpectedCompletionDate()
      }
      break
    case 'expectedCompletionDate':
      validateExpectedCompletionDate()
      // Re-validate start date when end date changes
      if (formData.startDate) {
        validateStartDate()
      }
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateConstructionID(),
    validateConstructionItemID(),
    validateEmployeeID(),
    validateStartDate(),
    validateExpectedCompletionDate()
  ]
  
  return validations.every(v => v === true)
}

const handleSubmit = async () => {
  formError.value = ''
  
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
  
  try {
    // Lấy danh sách task theo hạng mục
    const tasksOfItem = await fetchTasksByItemId(formData.constructionItemID)
    // Tính tổng khối lượng hoạch định đã có
    const totalPlanned = tasksOfItem.reduce((sum, t) => sum + (parseFloat(t.plannedVolume || t.workload) || 0), 0)
    // Lấy tổng khối lượng hạng mục - sửa từ totalWorkload sang totalVolume
    const item = filteredConstructionItems.value.find(i => i.id === Number(formData.constructionItemID))
    const totalVolume = parseFloat(item?.totalVolume || item?.totalWorkload || 0)

    console.log('Validation khối lượng hoạch định:', {
      itemId: formData.constructionItemID,
      itemName: item?.constructionItemName,
      totalPlanned,
      totalVolume,
      remaining: totalVolume - totalPlanned,
      tasksCount: tasksOfItem.length
    })

    if (totalVolume <= 0) {
      formError.value = 'Hạng mục chưa có tổng khối lượng. Vui lòng cập nhật tổng khối lượng hạng mục trước.'
      const endDateField = document.querySelector('[name="expectedCompletionDate"]') || document.querySelector('input[type="date"]:last-of-type')
      if (endDateField) {
        endDateField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    if (totalPlanned >= totalVolume) {
      const remaining = totalVolume - totalPlanned
      formError.value = `Tổng khối lượng hoạch định đã đủ (${totalPlanned.toLocaleString('vi-VN')}/${totalVolume.toLocaleString('vi-VN')}). Khối lượng còn lại: ${remaining.toLocaleString('vi-VN')}. Không thể thêm kế hoạch mới!`
      const endDateField = document.querySelector('[name="expectedCompletionDate"]') || document.querySelector('input[type="date"]:last-of-type')
      if (endDateField) {
        endDateField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const planData = {
      constructionID: Number(formData.constructionID),
      constructionItemID: Number(formData.constructionItemID),
      employeeID: formData.employeeID,
      startDate: new Date(formData.startDate).toISOString(),
      expectedCompletionDate: new Date(formData.expectedCompletionDate).toISOString(),
      constructionStatusID: props.mode === 'update' ? props.plan.constructionStatusID : 1
    }

    // Log dữ liệu trước khi gửi
    console.log('📤 Dữ liệu gửi đi:', planData)

    if (props.mode === 'update') {
      planData.id = props.plan.id
      await updatePlan(props.plan.id, planData)
      showMessage('Cập nhật kế hoạch thành công', 'success')
    } else {
      await createPlan(planData)
      showMessage('Tạo kế hoạch thành công', 'success')
    }

    emit('close')
  } catch (error) {
    console.error(`Error ${props.mode === 'update' ? 'updating' : 'creating'} plan:`, error)
    if (error.response?.data) {
      showMessage(error.response.data.message || `Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} kế hoạch`, 'error')
    } else {
      showMessage(`Không thể ${props.mode === 'update' ? 'cập nhật' : 'tạo'} kế hoạch`, 'error')
    }
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="formError" class="alert alert-danger py-2 mb-3">
      {{ formError }}
    </div>
    <div class="row g-3">
      <!-- Chọn công trình -->
      <div class="col-md-6">
        <label class="form-label">Tên Công Trình <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.constructionID }"
          v-model="formData.constructionID"
          @change="validateField('constructionID')"
        >
          <option value="">Chọn công trình</option>
          <option v-for="construction in constructions" :key="construction.id" :value="construction.id">
            {{ construction.constructionName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.constructionID }}</div>
      </div>

      <!-- Chọn hạng mục -->
      <div class="col-md-6">
        <label class="form-label">Hạng Mục <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.constructionItemID }"
          v-model="formData.constructionItemID"
          @change="validateField('constructionItemID')"
          :disabled="!formData.constructionID || filteredConstructionItems.length === 0"
        >
          <option value="">
            {{ !formData.constructionID ? 'Chọn công trình trước' : (filteredConstructionItems.length === 0 ? 'Không có hạng mục' : 'Chọn hạng mục') }}
          </option>
          <option v-for="item in filteredConstructionItems" :key="item.id" :value="item.id">
            {{ item.constructionItemName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.constructionItemID }}</div>
        
        <!-- Hiển thị thông tin khối lượng khi chọn hạng mục -->
        <div v-if="formData.constructionItemID && props.mode === 'create'" class="mt-2">
          <div v-if="volumeInfo.loading" class="text-muted small">
            <i class="fas fa-spinner fa-spin me-1"></i> Đang tải thông tin...
          </div>
          <div v-else-if="volumeInfo.totalVolume > 0" class="small">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Tổng khối lượng:</span>
              <span class="fw-bold">{{ volumeInfo.totalVolume.toLocaleString('vi-VN') }}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Đã hoạch định:</span>
              <span class="fw-bold text-warning">{{ volumeInfo.totalPlanned.toLocaleString('vi-VN') }}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Còn lại:</span>
              <span 
                class="fw-bold"
                :class="{
                  'text-success': volumeInfo.remaining > 0,
                  'text-danger': volumeInfo.remaining <= 0
                }"
              >
                {{ volumeInfo.remaining.toLocaleString('vi-VN') }}
              </span>
            </div>
            <div v-if="volumeInfo.remaining <= 0" class="alert alert-warning py-1 mt-2 mb-0">
              <small><i class="fas fa-exclamation-triangle me-1"></i> Khối lượng hoạch định đã đủ, không thể thêm kế hoạch mới!</small>
            </div>
          </div>
          <div v-else-if="formData.constructionItemID" class="text-muted small mt-1">
            <i class="fas fa-info-circle me-1"></i> Hạng mục chưa có tổng khối lượng
          </div>
        </div>
      </div>

      <!-- Chỉ huy phụ trách -->
      <div class="col-12">
        <label class="form-label">Chỉ Huy Phụ Trách <span class="text-danger">*</span></label>
        <select 
          class="form-select" 
          :class="{ 'is-invalid': errors.employeeID }"
          v-model="formData.employeeID"
          @change="validateField('employeeID')"
        >
          <option value="">Chọn chỉ huy phụ trách</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.employeeName }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errors.employeeID }}</div>
      </div>

      <!-- Ngày bắt đầu -->
      <div class="col-md-6">
        <label class="form-label">Ngày Bắt Đầu <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.startDate }"
          v-model="formData.startDate"
          @blur="validateField('startDate')"
          @change="validateField('startDate')"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.startDate }}</div>
      </div>

      <!-- Ngày kết thúc -->
      <div class="col-md-6">
        <label class="form-label">Ngày Kết Thúc Dự Kiến <span class="text-danger">*</span></label>
        <input 
          type="date" 
          class="form-control" 
          :class="{ 'is-invalid': errors.expectedCompletionDate }"
          v-model="formData.expectedCompletionDate"
          @blur="validateField('expectedCompletionDate')"
          @change="validateField('expectedCompletionDate')"
          :min="formData.startDate || undefined"
          :max="new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0]"
        />
        <div class="invalid-feedback">{{ errors.expectedCompletionDate }}</div>
      </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="handleClose">
        Hủy
      </button>
      <button type="submit" class="btn btn-primary">
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-select,
.form-control {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.95rem;
  height: 45px;
  width: 100%;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus,
.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.form-select:disabled {
  background-color: #e9ecef;
  opacity: 0.6;
  cursor: not-allowed;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.btn {
  border-radius: 4px;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  transition: all 0.2s ease;
}
</style>
