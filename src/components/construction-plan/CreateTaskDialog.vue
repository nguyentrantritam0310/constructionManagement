<script setup>
import { ref } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import FormField from '../common/FormField.vue'
import { useToast } from '../../composables/useToast'

const { showSuccess, showError } = useToast()

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:show', 'submit'])

const formData = ref({
  name: '',
  unit: 'm3',
  plannedVolume: '',
  monthlyPlan: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  // Validate name
  if (!formData.value.name.trim()) {
    errors.value.name = 'Vui lòng nhập tên nhiệm vụ'
    isValid = false
  } else if (formData.value.name.length > 200) {
    errors.value.name = 'Tên nhiệm vụ không được vượt quá 200 ký tự'
    isValid = false
  }

  // Validate unit
  if (!formData.value.unit.trim()) {
    errors.value.unit = 'Vui lòng nhập đơn vị'
    isValid = false
  }

  // Validate planned volume
  const plannedVolume = parseFloat(formData.value.plannedVolume)
  if (isNaN(plannedVolume) || plannedVolume <= 0) {
    errors.value.plannedVolume = 'Vui lòng nhập khối lượng hoạch định hợp lệ'
    isValid = false
  } else if (plannedVolume > 1000000) {
    errors.value.plannedVolume = 'Khối lượng hoạch định không được vượt quá 1,000,000'
    isValid = false
  }

  // Validate monthly plan
  const monthlyPlan = parseFloat(formData.value.monthlyPlan)
  if (isNaN(monthlyPlan) || monthlyPlan <= 0) {
    errors.value.monthlyPlan = 'Vui lòng nhập kế hoạch tháng hợp lệ'
    isValid = false
  } else if (monthlyPlan > plannedVolume) {
    errors.value.monthlyPlan = 'Kế hoạch tháng không được vượt quá khối lượng hoạch định'
    isValid = false
  }

  return isValid
}

const handleSubmit = () => {
  if (!validateForm()) {
    return
  }

  try {
    emit('submit', {
      ...formData.value,
      plannedVolume: parseFloat(formData.value.plannedVolume),
      monthlyPlan: parseFloat(formData.value.monthlyPlan)
    })

    // Reset form
    formData.value = {
      name: '',
      unit: 'm3',
      plannedVolume: '',
      monthlyPlan: ''
    }
    errors.value = {}
  } catch (err) {
    showError('Có lỗi xảy ra khi tạo nhiệm vụ mới')
  }
}

const handleCancel = () => {
  formData.value = {
    name: '',
    unit: 'm3',
    plannedVolume: '',
    monthlyPlan: ''
  }
  errors.value = {}
  emit('update:show', false)
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="$emit('update:show', $event)"
    title="Thêm Nhiệm Vụ Mới"
    size="md"
  >
    <form @submit.prevent="handleSubmit">
      <div class="row g-3">
        <div class="col-12">
          <FormField
            label="Tên nhiệm vụ"
            v-model="formData.name"
            :error="errors.name"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Đơn vị"
            v-model="formData.unit"
            :error="errors.unit"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Khối lượng hoạch định"
            type="number"
            v-model="formData.plannedVolume"
            :error="errors.plannedVolume"
            required
            min="0"
            max="1000000"
            step="0.01"
          />
        </div>

        <div class="col-12">
          <FormField
            label="Kế hoạch tháng"
            type="number"
            v-model="formData.monthlyPlan"
            :error="errors.monthlyPlan"
            required
            min="0"
            :max="formData.plannedVolume"
            step="0.01"
          />
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleCancel"
        >
          Hủy
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          Thêm
        </button>
      </div>
    </form>
  </ModalDialog>
</template>
