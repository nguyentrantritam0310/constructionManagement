<script setup>
import { ref, watch, onMounted } from 'vue'
import FormField from '../FormField.vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  familyRelation: {
    type: Object,
    default: null
  },
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['submit', 'close'])

const formData = ref({
  id: props.familyRelation?.id ?? '',
  relativeName: props.familyRelation?.relativeName ?? '',
  startDate: formatDateForInput(props.familyRelation?.startDate),
  endDate: formatDateForInput(props.familyRelation?.endDate),
  employeeID: props.employeeId,
  relationShipName: props.familyRelation?.relationShipName ?? ''
})

const relationOptions = [
  { value: 'Vợ', text: 'Vợ' },
  { value: 'Chồng', text: 'Chồng' },
  { value: 'Con', text: 'Con' },
  { value: 'Cha', text: 'Cha' },
  { value: 'Mẹ', text: 'Mẹ' },
  { value: 'Anh', text: 'Anh' },
  { value: 'Chị', text: 'Chị' },
  { value: 'Em', text: 'Em' },
  { value: 'Ông', text: 'Ông' },
  { value: 'Bà', text: 'Bà' },
  { value: 'Khác', text: 'Khác' }
]

// Watch for changes in familyRelation prop
watch(() => props.familyRelation, (newFamilyRelation) => {
  if (newFamilyRelation) {
    formData.value = {
      id: newFamilyRelation.id ?? '',
      relativeName: newFamilyRelation.relativeName ?? '',
      startDate: formatDateForInput(newFamilyRelation.startDate),
      endDate: formatDateForInput(newFamilyRelation.endDate),
      employeeID: props.employeeId,
      relationShipName: newFamilyRelation.relationShipName ?? ''
    }
  } else if (props.mode === 'create') {
    // Reset form for create mode
    formData.value = {
      id: '',
      relativeName: '',
      startDate: '',
      endDate: '',
      employeeID: props.employeeId,
      relationShipName: ''
    }
  }
}, { deep: true, immediate: true })

// Watch for changes in employeeId prop
watch(() => props.employeeId, (newEmployeeId) => {
  formData.value.employeeID = newEmployeeId
}, { immediate: true })

function formatDateForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const handleSubmit = () => {
  // Validation
  if (!formData.value.relativeName || !formData.value.startDate || !formData.value.endDate || !formData.value.relationShipName) {
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

  emit('submit', formData.value)
}

const handleClose = () => {
  emit('close')
}

// Reset form when mode changes
watch(() => props.mode, (newMode) => {
  if (newMode === 'create') {
    formData.value = {
      id: '',
      relativeName: '',
      startDate: '',
      endDate: '',
      employeeID: props.employeeId,
      relationShipName: ''
    }
  }
})
</script>

<template>
  <div class="form-card">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">
        <i class="fas fa-users me-2"></i>
        {{ props.mode === 'create' ? 'Thêm quan hệ gia đình' : 'Cập nhật quan hệ gia đình' }}
      </h5>
    </div>
    <div class="card-body">
      <div class="mb-3">
        <label class="form-label fw-bold">Nhân viên:</label>
        <div class="form-control bg-light">
          {{ props.employeeName }}
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="row g-4 mb-3">
          <div class="col-md-6">
            <FormField 
              label="Tên người quan hệ" 
              type="text" 
              v-model="formData.relativeName" 
              required 
              placeholder="Nhập tên người quan hệ"
            />
          </div>
          <div class="col-md-6">
            <label class="form-label">Mối quan hệ <span class="text-danger">*</span></label>
            <select class="form-select" v-model="formData.relationShipName" required>
              <option value="">Chọn mối quan hệ</option>
              <option v-for="relation in relationOptions" :key="relation.value" :value="relation.value" 
                      :selected="formData.relationShipName === relation.value">
                {{ relation.text }}
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
