<script setup>
import ActionButton from './ActionButton.vue'

defineProps({
  tooltip: {
    type: String,
    default: 'Xoá'
  }
})

const emit = defineEmits(['click'])
</script>

<template>
  <ActionButton
    icon="fas fa-trash"
    type="danger"
    :tooltip="tooltip"
    class="action-btn"
    @click="$emit('click', $event)"
  />
</template>

<style scoped>
.action-btn {
  padding: 0.25rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: scale(1.1);
}
</style>
