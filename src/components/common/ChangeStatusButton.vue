<script setup>
import ActionButton from './ActionButton.vue'

defineProps({
  tooltip: {
    type: String,
    default: 'Đổi trạng thái'
  }
})

const emit = defineEmits(['click'])
</script>

<template>
  <ActionButton
    icon="fas fa-exchange-alt"
    type="warning"
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