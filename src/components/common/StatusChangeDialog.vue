<script setup>
import { ref, computed, watch } from 'vue'
import StatusBadge from './StatusBadge.vue'
import FormField from './FormField.vue'
import { useStatusTransition } from '../../composables/useStatusTransition'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['construction', 'item', 'plan', 'task'].includes(value)
  },
  title: {
    type: String,
    default: 'Thay Đổi Trạng Thái'
  }
})

const emit = defineEmits(['update:show', 'submit'])

const selectedStatus = ref('')
const { getStatusOptions, getStatusWarning } = useStatusTransition(props.type)

// Reset selectedStatus khi dialog mở
watch(() => props.show, (newShow) => {
  if (newShow) {
    selectedStatus.value = props.item.statusName
  }
})

// Lấy danh sách trạng thái có thể chuyển đổi
const availableStatuses = computed(() => {
  return getStatusOptions(props.item.statusName)
})

// Lấy thông báo cảnh báo
const showWarning = computed(() => {
  return getStatusWarning(selectedStatus.value)
})

const handleSubmit = () => {
  if (selectedStatus.value && selectedStatus.value !== props.item.statusName) {
    emit('submit', {
      newStatus: selectedStatus.value,
      type: props.type,
      item: props.item
    })
    emit('update:show', false)
  }
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
          <h5 class="modal-title">{{ title }}</h5>
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
              <StatusBadge :status="item.statusName" :type="type" />
            </div>

            <FormField
              label="Chọn trạng thái mới"
              type="select"
              v-model="selectedStatus"
              :options="availableStatuses"
              required
            />

            <div v-if="showWarning" class="alert" :class="selectedStatus === 'Hủy bỏ' ? 'alert-danger' : 'alert-warning'">
              <i class="fas fa-exclamation-triangle me-2"></i>
              {{ showWarning }}
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
            :disabled="!selectedStatus || selectedStatus === item.statusName"
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
