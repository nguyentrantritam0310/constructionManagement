<script setup>
import ModalDialog from './ModalDialog.vue'
import ChangeStatusForm from './ChangeStatusForm.vue'

const props = defineProps({
  show: Boolean,
  title: String,
  currentStatus: String,
  type: {
    type: String,
    default: 'project'
  }
})

const emit = defineEmits(['update:show', 'submit'])
</script>

<template>
  <ModalDialog
    :show="show"
    @update:show="$emit('update:show', $event)"
    :title="title"
    size="md"
  >
    <ChangeStatusForm
      :current-status="currentStatus"
      :type="type"
      @submit="$emit('submit', $event)"
      @cancel="$emit('update:show', false)"
    />
  </ModalDialog>
</template>