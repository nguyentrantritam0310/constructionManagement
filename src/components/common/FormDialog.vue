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
  }
})

const emit = defineEmits(['update:show', 'submit', 'cancel'])

const handleClose = () => {
  emit('update:show', false)
  emit('cancel')
}

const handleSubmit = () => {
  emit('submit')
}
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="emit('update:show', $event)"
    :title="title"
    :size="size"
  >
    <div class="modal-body">
      <slot></slot>
    </div>
    <div class="modal-footer">
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          <i class="fas fa-times me-2"></i>Hủy
        </button>
        <button type="submit" class="btn btn-primary" @click="handleSubmit">
          <i class="fas fa-save me-2"></i>Lưu
        </button>
      </div>
    </div>
  </ModalDialog>
</template>
