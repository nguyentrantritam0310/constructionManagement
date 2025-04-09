<script setup>
import { ref } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import FormField from '../common/FormField.vue'

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

const handleSubmit = () => {
  if (!formData.value.name || !formData.value.plannedVolume || !formData.value.monthlyPlan) {
    alert('Vui lòng nhập đầy đủ thông tin')
    return
  }

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
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Đơn vị"
            v-model="formData.unit"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Khối lượng hoạch định"
            type="number"
            v-model="formData.plannedVolume"
            required
          />
        </div>

        <div class="col-12">
          <FormField
            label="Kế hoạch tháng"
            type="number"
            v-model="formData.monthlyPlan"
            required
          />
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('update:show', false)"
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