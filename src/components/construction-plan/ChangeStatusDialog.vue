<script setup>
import { ref, computed, watch } from 'vue'
import StatusBadge from '../common/StatusBadge.vue'

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

const selectedStatus = ref('')

// Reset selectedStatus khi dialog mở
watch(() => props.show, (newShow) => {
  if (newShow) {
    selectedStatus.value = props.plan.status
  }
})

const statusOptions = [
  { value: 'Not Started', label: 'Chưa khởi công' },
  { value: 'In Progress', label: 'Đang thi công' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Suspended', label: 'Tạm dừng' }
]

const validStatusTransitions = {
  'Not Started': ['In Progress', 'Suspended'],
  'In Progress': ['Completed', 'Suspended'],
  'Completed': [],
  'Suspended': ['In Progress']
}

const availableStatuses = computed(() => {
  return statusOptions.filter(status =>
    validStatusTransitions[props.plan.status]?.includes(status.value)
  )
})

const handleSubmit = () => {
  emit('submit', selectedStatus.value)
  emit('update:show', false)
}

const handleClose = () => {
  emit('update:show', false)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="handleClose"></div>
  <div v-if="show" class="modal fade show" style="display: block;">
    <div class="modal-dialog" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Thay Đổi Trạng Thái</h5>
          <button
            type="button"
            class="btn-close"
            @click="handleClose"
          ></button>
        </div>
        <div class="modal-body">
          <div class="status-dialog">
            <div class="current-status mb-3">
              <p class="mb-2">Trạng thái hiện tại:</p>
              <StatusBadge :status="plan.status" type="construction" />
            </div>

            <div class="form-group">
              <label class="form-label">Chọn trạng thái mới:</label>
              <select
                v-model="selectedStatus"
                class="form-select"
              >
                <option value="" disabled>Chọn trạng thái</option>
                <option
                  v-for="status in availableStatuses"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </div>

            <div v-if="selectedStatus === 'Suspended'" class="alert alert-warning mt-3">
              <i class="fas fa-exclamation-triangle me-2"></i>
              Lưu ý: Việc tạm dừng kế hoạch sẽ ảnh hưởng đến tiến độ thi công
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleClose"
          >
            Hủy
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="!selectedStatus || selectedStatus === plan.status"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1055;
}

.status-dialog {
  min-width: 400px;
}

.modal-content {
  animation: modalShow 0.3s ease-out;
}

@keyframes modalShow {
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