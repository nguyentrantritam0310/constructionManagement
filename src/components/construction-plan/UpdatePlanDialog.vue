<script setup>
import { ref, watch } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import FormField from '../common/FormField.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  plan: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:show', 'submit'])

const formData = ref({
  planName: '',
  projectCode: '',
  itemCode: '',
  supervisor: '',
  startDate: '',
  endDate: ''
})

// Cập nhật formData khi plan thay đổi
watch(() => props.plan, (newPlan) => {
  if (newPlan) {
    formData.value = { ...newPlan }
  }
}, { immediate: true })

const handleSubmit = () => {
  emit('submit', { ...props.plan, ...formData.value })
  emit('update:show', false)
}

const handleClose = () => {
  emit('update:show', false)
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="(val) => $emit('update:show', val)"
    title="Cập Nhật Kế Hoạch"
    size="lg"
  >
    <form @submit.prevent="handleSubmit">
      <div class="row g-3">
        <div class="col-12">
          <FormField
            label="Tên Kế Hoạch"
            v-model="formData.planName"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Mã Công Trình"
            v-model="formData.projectCode"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Mã Hạng Mục"
            v-model="formData.itemCode"
            required
          />
        </div>

        <div class="col-12">
          <FormField
            label="Chỉ Huy Phụ Trách"
            v-model="formData.supervisor"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Ngày Bắt Đầu"
            type="date"
            v-model="formData.startDate"
            required
          />
        </div>

        <div class="col-md-6">
          <FormField
            label="Ngày Kết Thúc"
            type="date"
            v-model="formData.endDate"
            required
          />
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleClose"
        >
          Hủy
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          Cập nhật
        </button>
      </div>
    </form>
  </ModalDialog>
</template>