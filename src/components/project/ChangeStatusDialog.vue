<script setup>
import { ref } from 'vue'
import ModalDialog from '../common/ModalDialog.vue'
import StatusBadge from '../common/StatusBadge.vue'
import FormField from '../common/FormField.vue'
import ActionButton from '../common/ActionButton.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  currentStatus: {
    type: String,
    required: true
  },
  projectId: {
    type: String,
    required: true
  },
  hasInProgressItems: {
    type: Boolean,
    default: false
  },
  allItemsCompleted: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'change-status'])

const selectedStatus = ref('')
const errorMessage = ref('')

const statusOptions = [
  { value: 'Pending Start', label: 'Chờ Khởi Công' },
  { value: 'In Progress', label: 'Đang Thực Hiện' },
  { value: 'Completed', label: 'Hoàn Thành' },
  { value: 'Delayed', label: 'Tạm Dừng' }
]

const handleStatusChange = () => {
  if (!selectedStatus.value) {
    errorMessage.value = 'Vui lòng chọn trạng thái mới'
    return
  }
  emit('change-status', selectedStatus.value)
  emit('update:show', false)
}
</script>

<template>
  <div v-if="show" class="dialog-overlay">
    <div class="dialog-content">
      <h3>Thay Đổi Trạng Thái Dự Án</h3>

      <div class="status-info">
        <p>Trạng thái hiện tại:</p>
        <StatusBadge
          :status="currentStatus"
          type="project"
        />
      </div>

      <div class="form-group">
        <label>Chọn trạng thái mới:</label>
        <select
          v-model="selectedStatus"
          class="form-control"
          :class="{ 'is-invalid': errorMessage }"
        >
          <option value="">Chọn trạng thái</option>
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <div v-if="errorMessage" class="invalid-feedback">
          {{ errorMessage }}
        </div>
      </div>

      <div class="dialog-actions">
        <ActionButton
          type="secondary"
          icon="fas fa-times"
          @click="$emit('update:show', false)"
        >
          Hủy
        </ActionButton>
        <ActionButton
          type="primary"
          icon="fas fa-check"
          @click="handleStatusChange"
        >
          Xác Nhận
        </ActionButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.dialog-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.status-info {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 2rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>