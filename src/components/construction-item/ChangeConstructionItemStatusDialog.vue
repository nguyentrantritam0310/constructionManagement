<script setup>
import { ref } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import ActionButton from '../common/ActionButton.vue'

const props = defineProps({
  show: Boolean,
  item: Object
})

const emit = defineEmits(['update:show', 'submit'])

const statuses = [
  { value: 'Not Started', label: 'Chưa bắt đầu' },
  { value: 'In Progress', label: 'Đang thực hiện' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Delayed', label: 'Tạm hoãn' }
]

const selectedStatus = ref('')

const handleSubmit = () => {
  if (selectedStatus.value) {
    emit('submit', selectedStatus.value)
    selectedStatus.value = ''
  }
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="$emit('update:show', $event)"
    title="Đổi Trạng Thái Hạng Mục"
    size="md"
  >
    <div class="p-3">
      <div class="mb-4">
        <h6 class="mb-3">Hạng mục: {{ item?.name }}</h6>
        <div class="status-options">
          <div
            v-for="status in statuses"
            :key="status.value"
            class="form-check mb-2"
          >
            <input
              type="radio"
              :id="status.value"
              :value="status.value"
              v-model="selectedStatus"
              class="form-check-input"
            >
            <label :for="status.value" class="form-check-label">
              {{ status.label }}
            </label>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <ActionButton
          type="secondary"
          @click="$emit('update:show', false)"
        >
          Hủy
        </ActionButton>
        <ActionButton
          type="primary"
          @click="handleSubmit"
          :disabled="!selectedStatus"
        >
          Xác nhận
        </ActionButton>
      </div>
    </div>
  </ModalDialog>
</template>

<style scoped>
.status-options {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}
</style>