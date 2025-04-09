<script setup>
import { ref } from 'vue'
import FormField from '../common/FormField.vue'

const emit = defineEmits(['submit', 'cancel'])

const formData = ref({
  planName: '',
  projectCode: '',
  itemCode: '',
  supervisor: '',
  startDate: '',
  endDate: ''
})

const handleSubmit = () => {
  emit('submit', { ...formData.value })
}
</script>

<template>
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

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button
        type="button"
        class="btn btn-secondary"
        @click="$emit('cancel')"
      >
        Hủy
      </button>
      <button
        type="submit"
        class="btn btn-primary"
      >
        Xác Nhận
      </button>
    </div>
  </form>
</template>