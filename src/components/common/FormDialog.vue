<script setup>
import ModalDialog from './ModalDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'lg'
  },
  submitText: {
    type: String,
    default: 'Lưu'
  },
  formData: {
    type: Object,
    default: () => ({})
  },
  resubmitMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'submit', 'resubmit', 'cancel'])

const handleClose = () => {
  emit('update:show', false)
  emit('cancel')
}

const handleSubmit = () => {
  if (props.resubmitMode) {
    emit('resubmit', props.formData)
  } else {
    emit('submit', props.formData)
  }
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="emit('update:show', $event)"
    :title="title"
    :size="size"
  >
    <form @submit.prevent="handleSubmit">
    <div class="modal-body">
      <slot></slot>
    </div>
    <div class="modal-footer">
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          <i class="fas fa-times me-2"></i>Hủy
        </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save me-2"></i>{{ props.resubmitMode ? 'Gửi lại' : submitText }}
        </button>
      </div>
    </div>
    </form>
  </ModalDialog>
</template>
