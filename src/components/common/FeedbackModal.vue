<template>
  <ModalDialog :show="show" :title="title" size="lg" @update:show="$emit('update:show', $event)">
    <form @submit.prevent="handleSubmit">
      <div class="feedback-form">
        <!-- Title Field -->
        <div class="form-group mb-3">
          <label for="feedbackTitle" class="form-label">
            <i class="fas fa-heading me-2"></i>
            Tiêu đề phản ánh
          </label>
          <input
            id="feedbackTitle"
            v-model="form.title"
            type="text"
            class="form-control"
            placeholder="Alone tiêu đề cho phản ánh..."
            maxlength="200"
            required
          />
          <div class="form-text">{{ form.title.length }}/200 ký tự</div>
        </div>

        <!-- Content Field -->
        <div class="form-group mb-4">
          <label for="feedbackContent" class="form-label">
            <i class="fas fa-comment-alt me-2"></i>
            Nội dung phản ánh
          </label>
          <textarea
            id="feedbackContent"
            v-model="form.content"
            class="form-control"
            rows="6"
            placeholder="Nhập nội dung phản ánh chi tiết..."
            maxlength="2000"
            required
          ></textarea>
          <div class="form-text">{{ form.content.length }}/2000 ký tự</div>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex gap-2 justify-content-end">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="handleCancel"
            :disabled="loading"
          >
            <i class="fas fa-times me-1"></i>
            Hủy
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || !isFormValid"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin me-1"></i>
            <i v-else class="fas fa-paper-plane me-1"></i>
            {{ isEditMode ? 'Cập nhật' : 'Gửi phản ánh' }}
          </button>
        </div>
      </div>
    </form>
  </ModalDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Phản ánh'
  },
  loading: {
    type: Boolean,
    default: false
  },
  editData: {
    type: Object,
    default: null
  },
  type: {
    type: String,
    default: 'timesheet', // 'timesheet' or 'payroll'
    validator: (value) => ['timesheet', 'payroll'].includes(value)
  }
})

const emit = defineEmits(['update:show', 'submit'])

const form = ref({
  title: '',
  content: ''
})

const isEditMode = computed(() => !!props.editData)

// Form validation
const isFormValid = computed(() => {
  return form.value.title.trim().length > 0 && form.value.content.trim().length > 0
})

const resetForm = () => {
  form.value = {
    title: '',
    content: ''
  }
}

// Watch for edit data changes
watch(() => props.editData, (newData) => {
  if (newData) {
    form.value = {
      title: newData.title || '',
      content: newData.content || ''
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch for modal show/hide
watch(() => props.show, (newShow) => {
  if (newShow && !props.editData) {
    resetForm()
  }
})

const handleSubmit = () => {
  if (!isFormValid.value) return
  
  const submitData = {
    title: form.value.title.trim(),
    content: form.value.content.trim()
  }

  emit('submit', submitData)
}

const handleCancel = () => {
  resetForm()
  emit('update:show', false)
}
</script>

<style scoped>
.feedback-form {
  padding: 1rem 0;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-label i {
  color: #0d6efd;
}

.form-control {
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0b5ed7 0%, #0a58ca 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.btn-outline-secondary {
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background-color: #6c757d;
  border-color: #6c757d;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
}
</style>
