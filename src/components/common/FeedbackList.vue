<template>
  <div class="feedback-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-2 text-muted">Đang tải phản ánh...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="feedbacks.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-comment-slash"></i>
      </div>
      <h6 class="empty-title">Chưa có phản ánh nào</h6>
      <p class="empty-description">
        {{ emptyMessage }}
      </p>
    </div>

    <!-- Feedback List -->
    <div v-else class="feedback-items">
      <div
        v-for="feedback in feedbacks"
        :key="`${feedback.timeSheetID || feedback.payrollID}-${feedback.employeeID}`"
        class="feedback-item"
      >
        <div class="feedback-header">
          <div class="feedback-title">
            <h6 class="mb-1">{{ feedback.title }}</h6>
            <div class="feedback-meta">
              <span class="feedback-date">
                <i class="fas fa-calendar-alt me-1"></i>
                {{ formatDate(feedback.timeSheetFeedbackDate || feedback.payrollFeedbackDate) }}
              </span>
              <span class="feedback-period">
                <i class="fas fa-calendar me-1"></i>
                {{ getPeriodText(feedback) }}
              </span>
            </div>
          </div>
          <div class="feedback-actions">
            <button
              class="btn btn-sm btn-outline-primary"
              @click="$emit('edit', feedback)"
              :title="'Chỉnh sửa phản ánh'"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-danger"
              @click="handleDelete(feedback)"
              :title="'Xóa phản ánh'"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="feedback-content">
          <p class="mb-0">{{ feedback.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGlobalMessage } from '../../composables/useGlobalMessage.js'

const props = defineProps({
  feedbacks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  type: {
    type: String,
    default: 'timesheet',
    validator: (value) => ['timesheet', 'payroll'].includes(value)
  },
  emptyMessage: {
    type: String,
    default: 'Bạn chưa có phản ánh nào.'
  }
})

const emit = defineEmits(['edit', 'delete'])

const { showMessage } = useGlobalMessage()

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPeriodText = (feedback) => {
  if (props.type === 'timesheet') {
    return `Tháng ${feedback.timeSheetMonth}/${feedback.timeSheetYear}`
  } else {
    return `Tháng ${feedback.payrollMonth}/${feedback.payrollYear}`
  }
}

const handleDelete = async (feedback) => {
  if (confirm('Bạn có chắc chắn muốn xóa phản ánh này?')) {
    emit('delete', feedback)
  }
}
</script>

<style scoped>
.feedback-list {
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-description {
  font-size: 0.9rem;
  margin-bottom: 0;
}

.feedback-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-item {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.feedback-item:hover {
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.1);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.feedback-title h6 {
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feedback-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.feedback-date,
.feedback-period {
  display: flex;
  align-items: center;
}

.feedback-date i,
.feedback-period i {
  width: 12px;
  color: #0d6efd;
}

.feedback-actions {
  display: flex;
  gap: 0.5rem;
}

.feedback-actions .btn {
  border-radius: 6px;
  padding: 0.375rem 0.5rem;
  transition: all 0.2s ease;
}

.feedback-actions .btn:hover {
  transform: translateY(-1px);
}

.feedback-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid #0d6efd;
}

.feedback-content p {
  color: #495057;
  line-height: 1.6;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .feedback-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .feedback-actions {
    align-self: flex-end;
  }
  
  .feedback-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* Scrollbar styling */
.feedback-list::-webkit-scrollbar {
  width: 6px;
}

.feedback-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.feedback-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.feedback-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
