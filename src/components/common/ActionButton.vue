<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  icon: {
    type: String,
    required: true
  },
  tooltip: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <button
    class="btn btn-icon"
    :class="`btn-${type}`"
    :title="tooltip"
  >
    <i :class="icon"></i>
    <slot></slot>
  </button>
</template>

<style scoped>
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>