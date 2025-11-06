<template>
  <ModalDialog
    :show="show"
    title="Lịch sử duyệt"
    size="lg"
    @update:show="$emit('update:show', $event)"
  >
    <div class="modal-body">
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
      </div>
      <div v-else-if="history.length === 0" class="text-center py-4 text-muted">
        Chưa có lịch sử duyệt
      </div>
      <div v-else class="approval-history-list">
        <div
          v-for="(item, index) in history"
          :key="item.id"
          class="history-item"
          :class="{ 'latest': index === history.length - 1 }"
        >
          <div class="d-flex justify-content-between align-items-center">
            <div class="flex-grow-1">
              <span class="me-2 text-muted">#{{ index + 1 }}</span>
              <strong>{{ getActionLabel(item.action) }}</strong>
              <span class="badge ms-2" :class="getStatusBadgeClass(item.newStatus)">
                {{ getStatusLabel(item.newStatus) }}
              </span>
              <span class="ms-3 text-muted">|</span>
              <span class="ms-2">{{ item.approverName }}</span>
              <span v-if="item.notes" class="ms-3 text-muted">
                <i class="fas fa-comment me-1"></i>{{ item.notes }}
              </span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <small class="text-muted">{{ formatDate(item.createdAt) }}</small>
              <button
                v-if="index === history.length - 1"
                class="btn btn-sm btn-outline-danger"
                @click="handleUndo"
                :disabled="undoing"
                title="Hoàn tác bước này"
              >
                <i class="fas fa-undo"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" @click="$emit('update:show', false)">
        Đóng
      </button>
    </div>
  </ModalDialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import ModalDialog from './ModalDialog.vue'
import approvalHistoryService from '../../services/approvalHistoryService'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  requestType: {
    type: String,
    required: true
  },
  requestId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:show', 'undo-success'])

const { showMessage } = useGlobalMessage()
const history = ref([])
const loading = ref(false)
const undoing = ref(false)

const loadHistory = async () => {
  if (!props.show || !props.requestType || !props.requestId) return
  
  try {
    loading.value = true
    const data = await approvalHistoryService.getApprovalHistory(props.requestType, props.requestId)
    // Reverse để hiển thị theo thứ tự thời gian tăng dần (cũ nhất trước)
    history.value = data ? [...data].reverse() : []
  } catch (error) {
    console.error('Error loading approval history:', error)
    showMessage('error', 'Không thể tải lịch sử duyệt')
    history.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadHistory()
  }
})

watch([() => props.requestType, () => props.requestId], () => {
  if (props.show) {
    loadHistory()
  }
})

const handleUndo = async () => {
  if (!confirm('Bạn có chắc chắn muốn hoàn tác bước duyệt này?')) return
  
  try {
    undoing.value = true
    await approvalHistoryService.undoLatestHistory(props.requestType, props.requestId)
    showMessage('success', 'Đã hoàn tác thành công')
    emit('undo-success')
    await loadHistory()
  } catch (error) {
    console.error('Error undoing approval:', error)
    showMessage('error', error.response?.data?.message || 'Không thể hoàn tác')
  } finally {
    undoing.value = false
  }
}

const getActionLabel = (action) => {
  const labels = {
    'Submit': 'Gửi duyệt',
    'Approve': 'Duyệt',
    'Reject': 'Từ chối',
    'Return': 'Trả lại'
  }
  return labels[action] || action
}

const getStatusLabel = (status) => {
  if (typeof status === 'string') {
    const labels = {
      'Created': 'Tạo mới',
      'Pending': 'Chờ duyệt',
      'Approved': 'Đã duyệt',
      'Rejected': 'Từ chối'
    }
    return labels[status] || status
  }
  return status
}

const getStatusBadgeClass = (status) => {
  const statusStr = typeof status === 'string' ? status : status?.toString()
  const classes = {
    'Created': 'bg-secondary',
    'Pending': 'bg-warning',
    'Approved': 'bg-success',
    'Rejected': 'bg-danger'
  }
  return classes[statusStr] || 'bg-secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.approval-history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.history-item.latest {
  background-color: #f0f8ff;
  border-left: 3px solid #0d6efd;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:hover {
  background-color: #f8f9fa;
}

.history-item.latest:hover {
  background-color: #e6f2ff;
}
</style>

