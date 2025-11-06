<template>
  <ModalDialog
    :show="show"
    :title="title"
    @update:show="$emit('update:show', $event)"
  >
    <div class="modal-body">
      <div class="mb-3">
        <label for="approvalNotes" class="form-label">Ghi chú</label>
        <textarea
          id="approvalNotes"
          v-model="notes"
          class="form-control"
          rows="4"
          placeholder="Nhập ghi chú (tùy chọn)"
        ></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" @click="handleCancel">
        Hủy
      </button>
      <button type="button" class="btn btn-primary" @click="handleConfirm">
        Xác nhận
      </button>
    </div>
  </ModalDialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import ModalDialog from './ModalDialog.vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Nhập ghi chú'
  },
  action: {
    type: String,
    default: 'approve' // approve, reject, return
  }
})

const emit = defineEmits(['update:show', 'confirm', 'cancel'])

const notes = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    notes.value = ''
  }
})

const handleConfirm = () => {
  emit('confirm', notes.value)
  emit('update:show', false)
  notes.value = ''
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
  notes.value = ''
}
</script>


