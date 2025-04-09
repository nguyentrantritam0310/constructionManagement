<script setup>
import { ref, watch } from 'vue'
import ActionButton from './ActionButton.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Đổi Trạng Thái'
  },
  currentStatus: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'project' // 'project' hoặc 'construction'
  }
})

const emit = defineEmits(['submit', 'cancel'])

const selectedStatus = ref('')

// Reset selectedStatus khi currentStatus thay đổi
watch(() => props.currentStatus, (newStatus) => {
  selectedStatus.value = newStatus
}, { immediate: true })

const statuses = {
  project: [
    { value: 'Not Started', label: 'Chưa bắt đầu' },
    { value: 'In Progress', label: 'Đang thi công' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'Suspended', label: 'Tạm dừng' }
  ],
  construction: [
    { value: 'Not Started', label: 'Chưa bắt đầu' },
    { value: 'In Progress', label: 'Đang thực hiện' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'Delayed', label: 'Tạm hoãn' }
  ]
}

const handleSubmit = () => {
  if (selectedStatus.value && selectedStatus.value !== props.currentStatus) {
    emit('submit', selectedStatus.value)
  }
}
</script>

<template>
  <div class="change-status-form">
    <div class="current-status mb-4">
      <label class="form-label">Trạng thái hiện tại:</label>
      <StatusBadge :status="currentStatus" :type="type" />
    </div>

    <div class="status-options mb-4">
      <label class="form-label" for="newStatus">Chọn trạng thái mới:</label>
      <select
        id="newStatus"
        v-model="selectedStatus"
        class="form-select"
      >
        <option value="" disabled>-- Chọn trạng thái --</option>
        <option
          v-for="status in statuses[type]"
          :key="status.value"
          :value="status.value"
          :disabled="status.value === currentStatus"
        >
          {{ status.label }}
        </option>
      </select>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <ActionButton
        type="secondary"
        @click="$emit('cancel')"
      >
        Hủy
      </ActionButton>
      <ActionButton
        type="primary"
        @click="handleSubmit"
        :disabled="!selectedStatus || selectedStatus === currentStatus"
      >
        Xác nhận
      </ActionButton>
    </div>
  </div>
</template>

<style scoped>
.change-status-form {
  padding: 1rem;
}

.current-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-options {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #ced4da;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-select:disabled {
  background-color: #e9ecef;
  opacity: 1;
}
</style>