<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import FormField from '../common/FormField.vue'
import { useConstructionItem } from '../../composables/useConstructionItem'
import { useGlobalMessage } from '../../composables/useGlobalMessage'
import { useWorkSubTypeVariant } from '../../composables/useWorkSubTypeVariant'
import { useUnitofMeasurement } from '../../composables/useUnitofMeasurement'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['create', 'update'].includes(value)
  },
  item: {
    type: Object,
    required: false,
    default: () => ({})
  }
})

const { showMessage } = useGlobalMessage()
const { createConstructionItem, updateConstructionItem } = useConstructionItem()
const { variants, loadVariants } = useWorkSubTypeVariant()
const { unitMeasurements, loadUnitMeasurements } = useUnitofMeasurement()

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  constructionItemName: '',
  startDate: '',
  expectedCompletionDate: '',
  totalVolume: '',
  unitOfMeasurementID: '',
  workSubTypeVariantID: '',
})

const formError = ref('')
const isSubmitting = ref(false)

// Initialize form data if in update mode
const initFormData = () => {
  if (props.mode === 'update' && props.item) {
    formData.value = {
      constructionItemName: props.item.constructionItemName || '',
      startDate: props.item.startDate ? new Date(props.item.startDate).toISOString().split('T')[0] : '',
      expectedCompletionDate: props.item.expectedCompletionDate ? new Date(props.item.expectedCompletionDate).toISOString().split('T')[0] : '',
      totalVolume: props.item.totalVolume || '',
      unitOfMeasurementID: props.item.unitOfMeasurementID || '',
      workSubTypeVariantID: props.item.workSubTypeVariantID || '',
    }
  } else {
    // Reset form for create mode
    formData.value = {
      constructionItemName: '',
      startDate: '',
      expectedCompletionDate: '',
      totalVolume: '',
      unitOfMeasurementID: '',
      workSubTypeVariantID: '',
    }
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadVariants(), loadUnitMeasurements()])
    initFormData()
  } catch (error) {
    console.error('Error loading form data:', error)
    showMessage('Không thể tải dữ liệu form', 'error')
  }
})

// Watch for changes in item prop
watch(() => props.item, (newItem) => {
  if (props.mode === 'update' && newItem) {
    initFormData()
  }
}, { immediate: true })

const validateForm = () => {
  if (!formData.value.constructionItemName?.trim()) {
    formError.value = 'Vui lòng nhập tên hạng mục'
    return false
  }
  if (!formData.value.startDate) {
    formError.value = 'Vui lòng chọn ngày bắt đầu'
    return false
  }
  if (!formData.value.expectedCompletionDate) {
    formError.value = 'Vui lòng chọn ngày kết thúc dự kiến'
    return false
  }
  if (!formData.value.totalVolume || Number(formData.value.totalVolume) <= 0) {
    formError.value = 'Vui lòng nhập khối lượng hợp lệ'
    return false
  }
  if (!formData.value.unitOfMeasurementID) {
    formError.value = 'Vui lòng chọn đơn vị đo'
    return false
  }
  if (!formData.value.workSubTypeVariantID) {
    formError.value = 'Vui lòng chọn loại công tác'
    return false
  }

  // Validate dates
  const startDate = new Date(formData.value.startDate)
  const endDate = new Date(formData.value.expectedCompletionDate)
  if (endDate < startDate) {
    formError.value = 'Ngày kết thúc phải sau ngày bắt đầu'
    return false
  }

  return true
}

const handleSubmit = async () => {
  formError.value = ''
  if (!validateForm()) return

  try {
    isSubmitting.value = true
    const itemData = {
      constructionItemName: formData.value.constructionItemName.trim(),
      startDate: new Date(formData.value.startDate).toISOString(),
      expectedCompletionDate: new Date(formData.value.expectedCompletionDate).toISOString(),
      totalVolume: Number(formData.value.totalVolume),
      unitOfMeasurementID: Number(formData.value.unitOfMeasurementID),
      workSubTypeVariantID: Number(formData.value.workSubTypeVariantID)
    }

    console.log('Submitting form data:', itemData) // Debug log
    emit('submit', itemData)
  } catch (error) {
    console.error('Error submitting form:', error)
    formError.value = error.response?.data?.message || 'Có lỗi xảy ra khi gửi form'
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="construction-item-form">
    <div v-if="formError" class="alert alert-danger mb-3">
      {{ formError }}
    </div>

    <div class="row g-3">
      <!-- Tên hạng mục -->
      <div class="col-12">
    <FormField
      label="Tên Hạng Mục"
      type="text"
      v-model="formData.constructionItemName"
      required
          :error="formError && !formData.constructionItemName?.trim() ? 'Vui lòng nhập tên hạng mục' : ''"
          placeholder="Nhập tên hạng mục"
    />
      </div>

      <!-- Ngày bắt đầu -->
      <div class="col-md-6">
    <FormField
      label="Ngày Bắt Đầu"
      type="date"
      v-model="formData.startDate"
      required
          :error="formError && !formData.startDate ? 'Vui lòng chọn ngày bắt đầu' : ''"
          :min="new Date().toISOString().split('T')[0]"
    />
      </div>

      <!-- Ngày kết thúc -->
      <div class="col-md-6">
    <FormField
          label="Ngày Kết Thúc Dự Kiến"
      type="date"
      v-model="formData.expectedCompletionDate"
      required
          :error="formError && !formData.expectedCompletionDate ? 'Vui lòng chọn ngày kết thúc' : ''"
          :min="formData.startDate || new Date().toISOString().split('T')[0]"
    />
      </div>

      <!-- Khối lượng -->
      <div class="col-md-6">
    <FormField
      label="Tổng Khối Lượng"
      type="number"
      v-model="formData.totalVolume"
      required
          min="0.01"
          step="0.01"
          :error="formError && (!formData.totalVolume || Number(formData.totalVolume) <= 0) ? 'Vui lòng nhập khối lượng hợp lệ' : ''"
          placeholder="Nhập khối lượng"
        />
      </div>

      <!-- Đơn vị đo -->
      <div class="col-md-6">
        <FormField
          label="Đơn Vị Đo"
          type="select"
          v-model="formData.unitOfMeasurementID"
          :options="unitMeasurements.map(unit => ({
            value: unit.id,
            label: unit.shortName || unit.name
          }))"
          required
          :error="formError && !formData.unitOfMeasurementID ? 'Vui lòng chọn đơn vị đo' : ''"
          placeholder="Chọn đơn vị đo"
        />
      </div>

      <!-- Loại công việc -->
      <div class="col-12">
    <FormField
          label="Loại Công Tác"
          type="select"
          v-model="formData.workSubTypeVariantID"
          :options="variants.map(variant => ({
            value: variant.id,
            label: variant.description
          }))"
      required
          :error="formError && !formData.workSubTypeVariantID ? 'Vui lòng chọn loại công tác' : ''"
          placeholder="Chọn loại công tác"
    />
  </div>
    </div>

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="handleCancel" :disabled="isSubmitting">
        Hủy
      </button>
      <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status"></span>
        {{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.construction-item-form {
  max-width: 100%;
}

.alert {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
}

.form-control.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}
</style>
